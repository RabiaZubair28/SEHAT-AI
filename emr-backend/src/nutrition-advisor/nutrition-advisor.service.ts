import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { Repository } from 'typeorm';
import { CreateNutritionDto } from 'src/nutrition/dto/create-nutrition.dto';
import { assess } from '@health-advisor/modules/nutrition-advisor/assessment/clinical-assessment';
import { assertGenerationPrerequisites } from '@health-advisor/modules/nutrition-advisor/services/generation-prerequisites';
import { assertCanDraft, draftReviewContext, draftFollowUpDate } from '@health-advisor/modules/nutrition-advisor/services/draft-review-policy';
import { FOOD_DATA_SOURCE, FOOD_DATA_VERSION, FOOD_LIBRARY } from '@health-advisor/modules/nutrition-advisor/foods/food-library';
import { normalizePlan, suggestSubstitutes, validatePlan } from '@health-advisor/modules/nutrition-advisor/meal-planning/meal-planner';
import { AdvisorPreferences, DEFAULT_PREFERENCES, MEAL_SLOTS, MealSlot } from '@health-advisor/modules/nutrition-advisor/models/types';
import {
  CreateDeliveryDto,
  GeneratePlanDto,
  ReviewPlanDto,
  UpdatePlanDto,
} from './dto/nutrition-advisor.dto';
import {
  NutritionAdvisorPlan,
  NutritionPlanStatus,
  PlanHandoutContent,
} from './entities/nutrition-advisor-plan.entity';
import {
  NutritionAdvisorAction,
  NutritionAdvisorEvent,
} from './entities/nutrition-advisor-event.entity';
import {
  NutritionAdvisorDelivery,
  NutritionDeliveryChannel,
  NutritionDeliveryStatus,
} from './entities/nutrition-advisor-delivery.entity';
import { NutritionAdvisorAiService } from '@health-advisor/modules/nutrition-advisor/services/ai-plan.service';
import {
  AdvisorUser,
  NutritionAdvisorContextService,
  NutritionEncounter,
} from './nutrition-advisor-context.service';
import {
  maskPhone,
  normalizePkMobile,
  NutritionAdvisorWhatsAppService,
} from './nutrition-advisor-whatsapp.service';

const EDITABLE = [NutritionPlanStatus.DRAFT, NutritionPlanStatus.CHANGES_REQUESTED];
const STORAGE_DIR = process.env.NUTRITION_ADVISOR_STORAGE_DIR || join(process.cwd(), 'storage', 'nutrition-advisor');

const stableStringify = (value: any): string =>
  Array.isArray(value)
    ? `[${value.map(stableStringify).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value).sort().filter((k) => value[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
      : JSON.stringify(value ?? null);

@Injectable()
export class NutritionAdvisorService {
  constructor(
    @InjectRepository(NutritionAdvisorPlan)
    private readonly planRepo: Repository<NutritionAdvisorPlan>,
    @InjectRepository(NutritionAdvisorEvent)
    private readonly eventRepo: Repository<NutritionAdvisorEvent>,
    @InjectRepository(NutritionAdvisorDelivery)
    private readonly deliveryRepo: Repository<NutritionAdvisorDelivery>,
    private readonly contextService: NutritionAdvisorContextService,
    private readonly aiService: NutritionAdvisorAiService,
    private readonly whatsApp: NutritionAdvisorWhatsAppService,
  ) {}

  // ------------------------------------------------------------------ reads

  getFoodLibrary() {
    return { version: FOOD_DATA_VERSION, source: FOOD_DATA_SOURCE, mealSlots: MEAL_SLOTS, foods: FOOD_LIBRARY };
  }

  async getOverview(appointmentServiceId: number, user: AdvisorUser, preferenceOverride?: AdvisorPreferences, draft?: CreateNutritionDto) {
    const encounter = await this.contextService.loadEncounter(appointmentServiceId, user);
    const latest = await this.latestPlan(appointmentServiceId);
    const preferences = preferenceOverride
      ? this.cleanPreferences(preferenceOverride)
      : latest?.preferences ?? DEFAULT_PREFERENCES;
    const context = await this.contextService.buildClinicalContext(encounter, draft);
    const assessment = assess(context, preferences);

    return {
      patient: this.patientSummary(encounter),
      measurements: context.measurements,
      haemoglobin: context.labs.haemoglobin,
      recordedAllergies: context.recordedAllergies,
      ...assessment,
      findings: latest?.contextSnapshot?.generation ? latest.contextSnapshot.findings : [],
      recommendations: latest?.contextSnapshot?.generation ? latest.contextSnapshot.recommendations : [],
      activityGuidance: { ...assessment.activityGuidance,
        text: latest?.contextSnapshot?.generation ? latest.handout.activityGuidance : '',
        textUr: latest?.contextSnapshot?.generation ? latest.handout.activityGuidanceUr : '' },
      preferences,
      foodData: { version: FOOD_DATA_VERSION, source: FOOD_DATA_SOURCE },
      whatsAppConfigured: this.whatsApp.configured,
      latestPlan: latest ? { id: latest.id, version: latest.version, status: latest.status, updatedAt: latest.updatedAt } : null,
    };
  }

  async getCurrentPlan(appointmentServiceId: number, user: AdvisorUser) {
    await this.contextService.loadEncounter(appointmentServiceId, user);
    const plan = await this.latestPlan(appointmentServiceId);
    if (!plan) return { plan: null };
    return this.describePlan(plan);
  }

  async getPlan(planId: number, user: AdvisorUser) {
    const plan = await this.loadPlan(planId, user);
    return this.describePlan(plan);
  }

  async listVersions(appointmentServiceId: number, user: AdvisorUser) {
    await this.contextService.loadEncounter(appointmentServiceId, user);
    const versions = await this.planRepo.find({
      where: { appointmentServiceId },
      order: { version: 'DESC' },
    });
    return versions.map((p) => ({
      id: p.id,
      version: p.version,
      status: p.status,
      generatedBy: p.generatedBy,
      createdAt: p.createdAt,
      createdBy: this.userName(p.createdBy),
      reviewedAt: p.reviewedAt,
      contentHash: p.contentHash,
    }));
  }

  /** Plans awaiting review (and recently reviewed) at the reviewer's facility. */
  async listReviewQueue(user: AdvisorUser) {
    const qb = this.planRepo
      .createQueryBuilder('plan')
      .innerJoin('plan.appointmentService', 'as')
      .innerJoin('as.appointment', 'appointment')
      .innerJoin('appointment.patient', 'patient')
      .leftJoin('plan.createdBy', 'author')
      .select([
        'plan.id AS "planId"',
        'plan.appointment_service_id AS "appointmentServiceId"',
        'plan.version AS "version"',
        'plan.status AS "status"',
        'plan.updated_at AS "updatedAt"',
        'plan.reviewed_at AS "reviewedAt"',
        'patient.first_name AS "firstName"',
        'patient.last_name AS "lastName"',
        'patient.mr_no AS "mrNo"',
        'author.first_name AS "authorFirstName"',
        'author.last_name AS "authorLastName"',
      ])
      .where('(plan.status = :pending OR (plan.status IN (:...done) AND plan.reviewed_at > :since))', {
        pending: NutritionPlanStatus.PENDING_REVIEW,
        done: [NutritionPlanStatus.APPROVED, NutritionPlanStatus.CHANGES_REQUESTED, NutritionPlanStatus.REJECTED],
        since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .orderBy(`CASE WHEN plan.status = '${NutritionPlanStatus.PENDING_REVIEW}' THEN 0 ELSE 1 END`, 'ASC')
      .addOrderBy('plan.updated_at', 'DESC')
      .limit(100);
    if (user.facilityId) qb.andWhere('appointment.facility_id = :facilityId', { facilityId: user.facilityId });
    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      planId: r.planId,
      appointmentServiceId: r.appointmentServiceId,
      version: r.version,
      status: r.status,
      updatedAt: r.updatedAt,
      reviewedAt: r.reviewedAt,
      patientName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
      mrNo: r.mrNo,
      submittedBy: [r.authorFirstName, r.authorLastName].filter(Boolean).join(' ') || null,
    }));
  }

  suggestSwaps(planId: number, foodId: string, slot: MealSlot, user: AdvisorUser) {
    return this.loadPlan(planId, user).then((plan) =>
      suggestSubstitutes(foodId, slot, this.rulesFor(plan), 6).map((f) => f.id),
    );
  }

  // ----------------------------------------------------------------- writes

  async generatePlan(appointmentServiceId: number, dto: GeneratePlanDto, user: AdvisorUser) {
    const encounter = await this.contextService.loadEncounter(appointmentServiceId, user);
    // Use the validated form draft for generation without saving/completing the encounter.
    if (dto.nutritionInput) {
      if (dto.nutritionInput.appointment_id !== encounter.appointmentService.appointment.id) {
        throw new BadRequestException('Nutrition inputs belong to a different encounter.');
      }
      encounter.appointmentService.nutritionServiceInfo = dto.nutritionInput.serviceInfo as any;
      encounter.appointmentService.nutritionVitalAssessment = dto.nutritionInput.vitalAssessment as any;
    }
    assertGenerationPrerequisites({
      ageYears: encounter.patient.ageYears, sex: encounter.patient.sex,
      admission: encounter.appointmentService.nutritionServiceInfo,
      vitals: encounter.appointmentService.nutritionVitalAssessment,
    });
    const preferences = this.cleanPreferences(dto.preferences);
    const context = await this.contextService.buildClinicalContext(encounter, dto.nutritionInput);
    const assessment = assess(context, preferences);

    assertCanDraft(assessment);

    const restrictions = [...new Set([...assessment.derivedRestrictions, ...preferences.medicalRestrictions])];
    const ai = await this.aiService.draftAdvisor(context, assessment, preferences);
    const draftedAssessment = { ...assessment, findings: ai.findings, recommendations: ai.recommendations,
      activityGuidance: { ...assessment.activityGuidance, text: ai.handout.activityGuidance, textUr: ai.handout.activityGuidanceUr } };

    const followUp = draftFollowUpDate(assessment);
    const handout: PlanHandoutContent = {
      ...ai.handout,
      followUpDate: followUp,
      urduProofread: false,
    };

    const previous = await this.latestPlan(appointmentServiceId);
    const plan = this.planRepo.create({
      appointmentServiceId,
      patientId: encounter.patientId,
      version: (previous?.version ?? 0) + 1,
      status: NutritionPlanStatus.DRAFT,
      preferences,
      plan: ai.plan,
      handout,
      contextSnapshot: { ...this.snapshot(draftedAssessment, restrictions), generation: ai.generation },
      generatedBy: ai.generatedBy,
      foodDataVersion: FOOD_DATA_VERSION,
      contentHash: '',
      previousVersionId: previous?.id ?? null,
      createdById: user.sub,
      createdBy: { id: user.sub } as any,
      updatedBy: { id: user.sub } as any,
    });
    plan.contentHash = this.hash(plan);
    const saved = await this.planRepo.save(plan);
    await this.supersede(previous);
    await this.log(saved.id, NutritionAdvisorAction.GENERATED, user, {
      version: saved.version,
      generatedBy: ai.generatedBy,
      note: ai.note ?? null,
    });
    return { ...(await this.describePlan(await this.loadPlan(saved.id, user))), generationNote: ai.note ?? null };
  }

  async updatePlan(planId: number, dto: UpdatePlanDto, user: AdvisorUser) {
    const current = await this.loadPlan(planId, user);
    await this.assertLatest(current);

    if (dto.preferences && stableStringify(this.cleanPreferences(dto.preferences)) !== stableStringify(current.preferences)) {
      throw new BadRequestException('Generate a new LLM draft from Patient Nutrition Details when changing preferences.');
    }
    const preferences = current.preferences;
    const nextPlan = dto.plan ? normalizePlan(dto.plan) : current.plan;
    const nextHandout = { ...current.handout, ...(dto.handout ?? {}) } as PlanHandoutContent;
    // Changing the English activity text or patient notes invalidates the Urdu proofreading.
    if (
      dto.handout &&
      dto.handout.urduProofread === undefined &&
      (nextHandout.activityGuidanceUr !== current.handout.activityGuidanceUr ||
        nextHandout.patientNotesUr !== current.handout.patientNotesUr ||
        nextHandout.activityGuidance !== current.handout.activityGuidance ||
        nextHandout.patientNotes !== current.handout.patientNotes)
    ) {
      nextHandout.urduProofread = false;
    }

    const contextSnapshot = current.contextSnapshot;
    const candidateHash = this.hash({ plan: nextPlan, handout: nextHandout, preferences });
    if (candidateHash === current.contentHash) return this.describePlan(current);

    // Approved/rejected versions are frozen: edits create a new draft version (NA-22).
    if (!EDITABLE.includes(current.status) && current.status !== NutritionPlanStatus.PENDING_REVIEW) {
      const next = this.planRepo.create({
        appointmentServiceId: current.appointmentServiceId,
        patientId: current.patientId,
        version: current.version + 1,
        status: NutritionPlanStatus.DRAFT,
        preferences,
        plan: nextPlan,
        handout: nextHandout,
        contextSnapshot,
        generatedBy: current.generatedBy,
        foodDataVersion: FOOD_DATA_VERSION,
        contentHash: candidateHash,
        previousVersionId: current.id,
        createdById: user.sub,
        createdBy: { id: user.sub } as any,
        updatedBy: { id: user.sub } as any,
      });
      const saved = await this.planRepo.save(next);
      await this.supersede(current);
      await this.log(saved.id, NutritionAdvisorAction.NEW_VERSION, user, { fromVersion: current.version, version: saved.version, hash: candidateHash });
      return this.describePlan(await this.loadPlan(saved.id, user));
    }

    const withdrawn = current.status === NutritionPlanStatus.PENDING_REVIEW;
    current.preferences = preferences;
    current.plan = nextPlan;
    current.handout = nextHandout;
    current.contextSnapshot = contextSnapshot;
    current.contentHash = candidateHash;
    current.status = withdrawn ? NutritionPlanStatus.DRAFT : current.status;
    current.updatedBy = { id: user.sub } as any;
    await this.planRepo.save(current);
    await this.log(current.id, NutritionAdvisorAction.EDITED, user, { version: current.version, hash: candidateHash, withdrewSubmission: withdrawn || undefined });
    return this.describePlan(await this.loadPlan(current.id, user));
  }

  async submitForReview(planId: number, user: AdvisorUser) {
    const plan = await this.loadPlan(planId, user);
    await this.assertLatest(plan);
    if (!EDITABLE.includes(plan.status)) {
      throw new ConflictException(`A plan that is ${plan.status.replace('_', ' ')} cannot be submitted.`);
    }
    const { warnings } = validatePlan(plan.plan, plan.contextSnapshot.targets, this.rulesFor(plan));
    const errors = warnings.filter((w) => w.severity === 'error');
    if (errors.length) {
      throw new UnprocessableEntityException({ message: 'Resolve the plan errors before submitting for review.', reasons: errors.map((e) => e.message) });
    }
    plan.status = NutritionPlanStatus.PENDING_REVIEW;
    plan.updatedBy = { id: user.sub } as any;
    await this.planRepo.save(plan);
    await this.log(plan.id, NutritionAdvisorAction.SUBMITTED, user, { version: plan.version, hash: plan.contentHash });
    return this.describePlan(plan);
  }

  async reviewPlan(planId: number, dto: ReviewPlanDto, user: AdvisorUser) {
    const plan = await this.loadPlan(planId, user);
    await this.assertLatest(plan);
    if (plan.status !== NutritionPlanStatus.PENDING_REVIEW) {
      throw new ConflictException('Only a plan waiting for review can be approved, rejected or returned.');
    }
    if (dto.contentHash !== plan.contentHash) {
      throw new ConflictException('This plan changed after you opened it. Reload and review the latest version.');
    }
    if (dto.decision !== 'approve' && !dto.comment?.trim()) {
      throw new BadRequestException('Please add a comment explaining what needs to change.');
    }
    const next = {
      approve: [NutritionPlanStatus.APPROVED, NutritionAdvisorAction.APPROVED],
      reject: [NutritionPlanStatus.REJECTED, NutritionAdvisorAction.REJECTED],
      request_changes: [NutritionPlanStatus.CHANGES_REQUESTED, NutritionAdvisorAction.CHANGES_REQUESTED],
    }[dto.decision] as [NutritionPlanStatus, NutritionAdvisorAction];

    plan.status = next[0];
    plan.reviewComment = dto.comment?.trim() || null;
    plan.reviewedById = user.sub;
    plan.reviewedAt = new Date();
    plan.updatedBy = { id: user.sub } as any;
    await this.planRepo.save(plan);
    await this.log(plan.id, next[1], user, { version: plan.version, hash: plan.contentHash });
    return this.describePlan(await this.loadPlan(plan.id, user));
  }

  async createDelivery(planId: number, dto: CreateDeliveryDto, file: { buffer: Buffer; mimetype: string; size: number } | undefined, user: AdvisorUser) {
    const plan = await this.loadPlan(planId, user);
    await this.assertLatest(plan);
    if (plan.status !== NutritionPlanStatus.APPROVED) {
      throw new ConflictException('Only an approved plan can be downloaded or sent to the patient.');
    }
    if (dto.contentHash !== plan.contentHash) {
      throw new ConflictException('The handout does not match the approved version. Reload and try again.');
    }
    if (dto.language === 'ur' && !plan.handout.urduProofread) {
      throw new UnprocessableEntityException('The Urdu text must be marked as proofread before an Urdu handout is shared.');
    }
    if (!file?.buffer?.length || file.mimetype !== 'application/pdf' || !file.buffer.subarray(0, 5).toString().startsWith('%PDF')) {
      throw new BadRequestException('A PDF handout file is required.');
    }

    let recipient: string | null = null;
    if (dto.channel === 'whatsapp') {
      if (dto.consent !== 'true') {
        throw new UnprocessableEntityException('Confirm the patient has agreed to receive the plan on WhatsApp.');
      }
      recipient = normalizePkMobile(dto.phone);
      if (!recipient) throw new BadRequestException('Enter a valid Pakistani mobile number (e.g. +92 300 1234567).');
      const encounter = await this.contextService.loadEncounter(plan.appointmentServiceId, user);
      const registered = normalizePkMobile(encounter.patient.phone);
      if (registered !== recipient && dto.recipientVerified !== 'true') {
        throw new UnprocessableEntityException('This number differs from the registered number. Confirm it with the patient before sending.');
      }
    }

    // Retain an auditable copy linked to this encounter and version (NA-27).
    const sha = createHash('sha256').update(file.buffer).digest('hex');
    const dir = join(STORAGE_DIR, String(plan.appointmentServiceId));
    await mkdir(dir, { recursive: true });
    const fileName = `plan-${plan.id}-v${plan.version}-${dto.language}-${Date.now()}.pdf`;
    await writeFile(join(dir, fileName), file.buffer);

    let status = NutritionDeliveryStatus.SENT;
    let error: string | null = null;
    let providerMessageId: string | null = null;
    if (dto.channel === 'whatsapp') {
      const result = await this.whatsApp.sendDocument(
        recipient!,
        file.buffer,
        dto.language === 'ur' ? 'nutrition-plan-urdu.pdf' : 'nutrition-plan.pdf',
        dto.message?.trim() || (dto.language === 'ur' ? 'آپ کا غذائی منصوبہ' : 'Your nutrition plan'),
      );
      status = result.ok ? NutritionDeliveryStatus.SENT : NutritionDeliveryStatus.FAILED;
      error = result.error ?? null;
      providerMessageId = result.messageId ?? null;
    }

    const delivery = await this.deliveryRepo.save(
      this.deliveryRepo.create({
        planId: plan.id,
        planVersion: plan.version,
        contentHash: plan.contentHash,
        channel: dto.channel as NutritionDeliveryChannel,
        status,
        language: dto.language,
        recipientMasked: maskPhone(recipient),
        consentConfirmed: dto.consent === 'true',
        filePath: join(String(plan.appointmentServiceId), fileName),
        fileSha256: sha,
        providerMessageId,
        error,
        createdById: user.sub,
        createdBy: { id: user.sub } as any,
      }),
    );
    const action = dto.channel === 'download'
      ? NutritionAdvisorAction.DOWNLOADED
      : status === NutritionDeliveryStatus.SENT ? NutritionAdvisorAction.SENT : NutritionAdvisorAction.SEND_FAILED;
    await this.log(plan.id, action, user, { version: plan.version, deliveryId: delivery.id, language: dto.language, recipient: delivery.recipientMasked });

    return this.describeDelivery(await this.deliveryRepo.findOneOrFail({ where: { id: delivery.id } }));
  }

  async listDeliveries(planId: number, user: AdvisorUser) {
    const plan = await this.loadPlan(planId, user);
    const rows = await this.deliveryRepo
      .createQueryBuilder('d')
      .innerJoin('d.plan', 'plan')
      .leftJoinAndSelect('d.createdBy', 'createdBy')
      .where('plan.appointment_service_id = :id', { id: plan.appointmentServiceId })
      .orderBy('d.createdAt', 'DESC')
      .getMany();
    return rows.map((d) => this.describeDelivery(d));
  }

  // ---------------------------------------------------------------- helpers

  private async describePlan(plan: NutritionAdvisorPlan) {
    const targets = plan.contextSnapshot?.targets ?? null;
    const { totals, warnings } = validatePlan(plan.plan, targets, this.rulesFor(plan));
    const events = await this.eventRepo.find({ where: { planId: plan.id }, order: { createdAt: 'ASC' } });
    return {
      plan: {
        id: plan.id,
        appointmentServiceId: plan.appointmentServiceId,
        version: plan.version,
        status: plan.status,
        preferences: plan.preferences,
        content: plan.plan,
        handout: plan.handout,
        context: plan.contextSnapshot,
        generatedBy: plan.generatedBy,
        foodDataVersion: plan.foodDataVersion,
        contentHash: plan.contentHash,
        reviewComment: plan.reviewComment,
        reviewedBy: this.userName(plan.reviewedBy),
        reviewedAt: plan.reviewedAt,
        createdAt: plan.createdAt,
        createdBy: this.userName(plan.createdBy),
        updatedAt: plan.updatedAt,
        previousVersionId: plan.previousVersionId,
      },
      totals,
      warnings,
      events: events.map((e) => ({ action: e.action, at: e.createdAt, by: this.userName(e.user), details: e.details })),
    };
  }

  private describeDelivery(d: NutritionAdvisorDelivery) {
    return {
      id: d.id,
      planId: d.planId,
      planVersion: d.planVersion,
      channel: d.channel,
      status: d.status,
      language: d.language,
      recipient: d.recipientMasked,
      error: d.error,
      createdAt: d.createdAt,
      createdBy: this.userName(d.createdBy),
    };
  }

  private patientSummary(encounter: NutritionEncounter) {
    const { name, mrNo, ageYears, sex, phone } = encounter.patient;
    return { name, mrNo, ageYears, sex, phoneMasked: maskPhone(normalizePkMobile(phone)), phone: normalizePkMobile(phone) };
  }

  private snapshot(assessment: ReturnType<typeof assess>, restrictions: string[]) {
    return {
      capturedAt: new Date().toISOString(),
      clinicalReview: draftReviewContext(assessment),
      targets: assessment.targets,
      findings: assessment.findings,
      recommendations: assessment.recommendations,
      dataQuality: assessment.dataQuality,
      effective: assessment.effective,
      restrictions,
      activityAllowed: assessment.activityGuidance.allowed,
      activityCaution: assessment.activityGuidance.caution ?? null,
    };
  }

  private rulesFor(plan: NutritionAdvisorPlan) {
    return {
      prefs: plan.preferences,
      restrictions: plan.contextSnapshot?.restrictions ?? plan.preferences.medicalRestrictions,
    };
  }

  private cleanPreferences(input: AdvisorPreferences): AdvisorPreferences {
    const known = new Set(FOOD_LIBRARY.map((f) => f.id));
    return {
      ...DEFAULT_PREFERENCES,
      ...input,
      excludedFoodIds: [...new Set(input.excludedFoodIds)].filter((id) => known.has(id)),
      preferredFoodIds: [...new Set(input.preferredFoodIds)].filter((id) => known.has(id)),
      allergies: [...new Set(input.allergies)],
      medicalRestrictions: [...new Set(input.medicalRestrictions)],
      healthConditions: [...new Set(input.healthConditions ?? [])],
    };
  }

  private hash(p: Pick<NutritionAdvisorPlan, 'plan' | 'handout' | 'preferences'>) {
    return createHash('sha256').update(stableStringify({ plan: p.plan, handout: p.handout, preferences: p.preferences })).digest('hex');
  }

  private userName(u: any) {
    if (!u) return null;
    return u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email || `User #${u.id}`;
  }

  private latestPlan(appointmentServiceId: number) {
    return this.planRepo.findOne({ where: { appointmentServiceId }, order: { version: 'DESC' } });
  }

  private async loadPlan(planId: number, user: AdvisorUser) {
    const plan = await this.planRepo.findOne({ where: { id: planId }, relations: { reviewedBy: true } });
    if (!plan) throw new NotFoundException('Nutrition plan not found.');
    await this.contextService.loadEncounter(plan.appointmentServiceId, user);
    return plan;
  }

  private async assertLatest(plan: NutritionAdvisorPlan) {
    const latest = await this.latestPlan(plan.appointmentServiceId);
    if (latest && latest.id !== plan.id) {
      throw new ConflictException(`A newer version (v${latest.version}) of this plan exists. Open the latest version.`);
    }
  }

  private async supersede(previous: NutritionAdvisorPlan | null) {
    if (previous && previous.status !== NutritionPlanStatus.REJECTED) {
      await this.planRepo.update(previous.id, { status: NutritionPlanStatus.SUPERSEDED });
    }
  }

  private log(planId: number, action: NutritionAdvisorAction, user: AdvisorUser, details: Record<string, any>) {
    return this.eventRepo.save(this.eventRepo.create({ planId, action, userId: user.sub, details }));
  }
}
