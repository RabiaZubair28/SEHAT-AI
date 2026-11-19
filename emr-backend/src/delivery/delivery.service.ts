import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DeepPartial, EntityManager, Repository } from 'typeorm';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { enrichMedicinesAdministered } from 'src/common/utils/medicine-enrichment.util';
import {
  ChildCondition,
  CNICProvider,
  DeliveryProgressStatus,
  Gender,
  LevelOfCare,
  AttendanceStatus,
  PatientRegistrationType,
  PatientStatus,
  ReferralType,
  RoleName,
  ServiceType,
  Sex,
  TypeOfService,
  TypeOfDelivery,
  VisitStatus,
} from 'src/common/enums/enums';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { DischargeDetails } from './entities/discharge-details.entity';
import { NewbornAssessment } from './entities/newborn-assesment.entity';
import { PreDeliveryAssessment } from './entities/pre-delivery.entity';
import { ReferralDetails } from './entities/referral-details.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentDoctor } from 'src/appointments/entities/appointment-doctor.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { generateMrNo } from 'src/common/helper';
import { CreatePrescriptionDto } from 'src/diagnosis-prescriptions/dto/create-prescription.dto';
import { PostDeliveryAssessment } from './entities/post-delivery.entity';
import { CreateCemoncDto } from './dto/create-cemonc.dto';
import { Referral } from 'src/referrals/entities/referral.entity';
import { DeliveryPatient } from './entities/delivery-patients.entity';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { CreateReferralDetailsDto } from './dto/referral.dto';
import { ReferralCreationInput } from 'src/common/interfaces/referral-creation.interface';
import { NEWBORN_ASSESMENT_LIMIT, TIME_DIFF } from 'src/common/app.constants';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { CreateImmunisationWithCardDto } from 'src/immunisation/dto/create-immunisation-with-card.dto';
import { ReferInCreationInterface } from 'src/common/interfaces/refer-in-creation.interface';
import { Visit } from 'src/visit/entities/visit.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Service } from 'src/services/entities/service.entity';
import { CreateDeliveryResult } from 'src/common/interfaces/create-delivery-result.interface';
import { User } from 'src/users/entities/user.entity';
import { ReferralResponse } from 'src/common/interfaces/referral-response.interface';
import { UserService } from 'src/user-services/entities/user-service.entity';
import { TokenCounterService } from '../token-counter/token-counter.service';
import { successResponse } from 'src/common/utils/response.util';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PatientRollupService } from 'src/patients/patient-rollup.service';

const DELIVERY_RESPONSE_RELATIONS = [
  'patient',
  'preDeliveryAssesment',
  'postDeliveryAssesment',
  'newbornAssesment',
  'deliveryDischargeDetails',
  'deliveryReferralDetails',
  'deliveryReferralDetails.district',
  'deliveryReferralDetails.facility',
  'deliveryPatients',
  'deliveryPatients.child',
  'deliveryPatients.child.immunisations',
  'deliveryPatients.child.immunisationCard',
  'deliveryPatients.child.immunisationsDoses',
  'deliveryPatients.child.immunisationsDoses.vaccine',
];

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(AppointmentService)
    private readonly appointmentServiceRepo: Repository<AppointmentService>,
    @InjectRepository(MedicineVariant)
    private readonly medicineVariantRepo: Repository<MedicineVariant>,
    @InjectRepository(PreDeliveryAssessment)
    private readonly preDeliveryRepository: Repository<PreDeliveryAssessment>,
    @InjectRepository(PostDeliveryAssessment)
    private readonly postDeliveryRepository: Repository<PostDeliveryAssessment>,
    @InjectRepository(NewbornAssessment)
    private readonly newBornRepository: Repository<NewbornAssessment>,
    @InjectRepository(DischargeDetails)
    private readonly dischargeRepository: Repository<DischargeDetails>,
    @InjectRepository(ReferralDetails)
    private readonly referralRepository: Repository<ReferralDetails>,
    @InjectRepository(DeliveryPatient)
    private readonly deliveryPatientRepo: Repository<DeliveryPatient>,
    private readonly serviceUtility: ServiceUtility,
    private readonly tokenCounterService: TokenCounterService,
    private readonly patientRollupService: PatientRollupService,
  ) {}

  public async create<T extends CreateDeliveryDto | CreateCemoncDto>(
    data: T,
    user: AuthenticatedUser,
    status: DeliveryProgressStatus,
  ): Promise<CreateDeliveryResult> {
    try {
      const userId = user.sub;
      const facilityId = user.facilityId ?? undefined;
      const districtId = user.districtId ?? null;

      const prescriptionsArr: CreatePrescriptionDto[] = [];

      const newbornsArr: Patient[] = [];
      const deferredImmunisations: CreateImmunisationWithCardDto[] = [];
      const referInResults: { message: string }[] = [];
      const deliveryStatus = status ?? DeliveryProgressStatus.CONTINUE;

      const shouldCompleteAppointment =
        this.isTerminalDeliveryStatus(deliveryStatus);

      const appointment = await this.serviceUtility.validateAppointment(
        data.appointment_id,
      );
      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient.id,
        userId,
      );

      const service = await this.serviceUtility.getServiceByType(
        ServiceType.DELIVERY,
      );
      const appointmentService =
        await this.serviceUtility.validateAndGetAppointmentService(
          appointment.id,
          service.id,
        );

      await this.serviceUtility.checkAppointmentServiceStatus(
        appointmentService,
        PatientStatus.IN_PROGRESS,
      );

      await this.appointmentServiceRepo.manager.transaction(async (manager) => {
        const managedAppointmentService = manager.create(AppointmentService, {
          id: appointmentService.id,
          status: appointmentService.status,
          deliveryProgressStatus: deliveryStatus,
        });

        const maybeMarkAppointmentCompleted = () => {
          if (shouldCompleteAppointment) {
            this.markAppointmentCompleted(
              appointment,
              managedAppointmentService,
            );
          }
        };

        if (data.preDelivery) {
          const prevPreDelivery = await manager.exists(PreDeliveryAssessment, {
            where: { appointmentService: { id: appointmentService.id } },
          });
          if (prevPreDelivery) {
            throw new BadRequestException(
              `PreDeliveryAssessment already exists for AppointmentService ${appointmentService.id}`,
            );
          }
          const pre = manager.create(PreDeliveryAssessment, {
            ...data.preDelivery,
            appointmentService: { id: appointmentService.id },
          });
          await manager.save(pre);

          maybeMarkAppointmentCompleted();
        }

        if (data.postDelivery) {
          await this.handlePostDeliverCreation(
            manager,
            appointmentService,
            managedAppointmentService,
            data,
            this.medicineVariantRepo,
            prescriptionsArr,
          );
        }

        if (data.newbornAssessments?.length) {
          const prevNewborns = await manager.exists(NewbornAssessment, {
            where: { appointmentService: { id: appointmentService.id } },
          });
          if (prevNewborns) {
            throw new BadRequestException(
              `NewbornAssessments already exist for AppointmentService ${appointmentService.id}`,
            );
          }
          if (data.newbornAssessments.length > NEWBORN_ASSESMENT_LIMIT) {
            throw new BadRequestException(
              'Cannot contain more than 2 newborns.',
            );
          }

          for (const nbData of data.newbornAssessments) {
            const nb = manager.create(NewbornAssessment, {
              ...nbData,
              appointmentService: { id: appointmentService.id },
            });
            await manager.save(nb);

            if (
              ![
                ChildCondition.DEAD_AFTER_DELIVERY,
                ChildCondition.INTRAUTERINE_DEATH,
              ].includes(nbData.condition)
            ) {
              const newborn = await this.createNewbornRecords(
                manager,
                appointment,
                nbData,
                managedAppointmentService,
                service.id,
                deferredImmunisations,
              );
              if (newborn) {
                newbornsArr.push(newborn);
              }
            }
            if (nbData.medicinesAdministered) {
              for (const newbornMed of nbData.medicinesAdministered) {
                const medicine = await manager
                  .getRepository(MedicineVariant)
                  .createQueryBuilder('medicineVariant')
                  .select(['medicineVariant.id'])
                  .where('medicineVariant.id = :medicineVariantId', {
                    medicineVariantId: newbornMed.medicine_variant_id,
                  })
                  .getOne();

                if (!medicine) {
                  throw new NotFoundException(
                    `Medicine ${newbornMed.medicine_variant_id} not found`,
                  );
                }

                prescriptionsArr.push({
                  medicine_variant_id: medicine.id,
                  quantity: newbornMed.quantity,
                  medicineDispensed: false,
                });
              }
            }

            maybeMarkAppointmentCompleted();
          }
        }

        if (data.dischargeDetails) {
          const prevDischarge = await manager.exists(DischargeDetails, {
            where: { appointmentService: { id: appointmentService.id } },
          });
          if (prevDischarge) {
            throw new BadRequestException(
              `DischargeDetails already exists for AppointmentService ${appointmentService.id}`,
            );
          }
          const discharge = manager.create(DischargeDetails, {
            ...data.dischargeDetails,
            appointmentService: { id: appointmentService.id },
          });
          await manager.save(discharge);

          maybeMarkAppointmentCompleted();
        }

        if (data.referralDetails) {
          const referralDetailsList: CreateReferralDetailsDto[] = Array.isArray(
            data.referralDetails,
          )
            ? data.referralDetails
            : [data.referralDetails];

          if (referralDetailsList.length === 0) return;

          const existingReferrals = await manager.exists(ReferralDetails, {
            where: { appointmentService: { id: appointmentService.id } },
          });

          if (existingReferrals) {
            throw new BadRequestException(
              `ReferralDetails already exist for AppointmentService ${appointmentService.id}`,
            );
          }

          for (const referralData of referralDetailsList) {
            const isInternalReferral =
              referralData.typeOfReferral === ReferralType.INTERNAL;
            const isExternalCemoncReferral =
              deliveryStatus === DeliveryProgressStatus.REFER_TO_CEMONC &&
              referralData.typeOfReferral === ReferralType.EXTERNAL;
            const resolvedFacilityId = isInternalReferral
              ? facilityId
              : referralData.facility_id;
            const resolvedDistrictId = isInternalReferral
              ? districtId
              : referralData.district_id;
            if (isInternalReferral && !resolvedFacilityId) {
              throw new BadRequestException(
                'Facility ID is required for internal referrals.',
              );
            }
            if (isInternalReferral && !resolvedDistrictId) {
              throw new BadRequestException(
                'District ID is required for internal referrals.',
              );
            }

            const referral = manager.create(ReferralDetails, {
              appointmentService: managedAppointmentService,
              whoRequiresReferral: referralData.whoRequiresReferral
                ? [referralData.whoRequiresReferral]
                : null,
              typeOfService: referralData.typeOfService,
              typeOfReferral: referralData.typeOfReferral,
              motherComplications: referralData.motherComplications ?? null,
              childComplications: referralData.childComplications ?? null,
              otherComplication: referralData.otherComplication ?? null,
              district: resolvedDistrictId
                ? ({ id: resolvedDistrictId } as any)
                : null,
              levelOfCare: referralData.levelOfCare ?? null,
              facility: resolvedFacilityId
                ? ({ id: resolvedFacilityId } as any)
                : null,
            } as DeepPartial<ReferralDetails>);
            const serviceRequired = await manager.findOne(Service, {
              where: {
                name: referralData.typeOfService,
              },
              relations: [
                'userServices',
                'userServices.user',
                'userServices.user.role',
                'userServices.user.facility',
              ],
            });
            if (!serviceRequired) {
              throw new NotFoundException('Service required not found');
            }

            let userOfferingService: UserService | undefined;

            if (!isExternalCemoncReferral) {
              const candidateUserServices = serviceRequired.userServices ?? [];
              if (candidateUserServices.length === 0) {
                throw new BadRequestException(
                  `No user found offering service ${referralData.typeOfService}`,
                );
              }

              const facilityMatchedUserServices = resolvedFacilityId
                ? candidateUserServices.filter(
                    (us) => us.user?.facility?.id === resolvedFacilityId,
                  )
                : candidateUserServices;

              const availableUserServices =
                await this.filterUserServicesByAttendance(
                  facilityMatchedUserServices,
                );
              userOfferingService = availableUserServices[0];

              const shouldPreferPaedsForOpd =
                referralData.typeOfService === TypeOfService.OPD &&
                typeof referralData.patient_id === 'number' &&
                (await this.isPatientPaedsAge(manager, referralData.patient_id));

              if (shouldPreferPaedsForOpd) {
                const paedsService = availableUserServices.find(
                  (us) => us.user?.role?.name === RoleName.PAEDS,
                );
                if (paedsService) {
                  userOfferingService = paedsService;
                }
              }

              if (!userOfferingService) {
                throw new BadRequestException(
                  `No user found offering service ${referralData.typeOfService}`,
                );
              }
            }

            await this.createReferralEntry(manager, {
              patient: { id: referralData.patient_id },
              fromDoctor: { id: userId },
              toDoctor: userOfferingService
                ? { id: userOfferingService.userId }
                : undefined,
              district: resolvedDistrictId
                ? { id: resolvedDistrictId }
                : undefined,
              facility: resolvedFacilityId
                ? { id: resolvedFacilityId }
                : undefined,
              type_of_service: referralData.typeOfService,
              type: referralData.typeOfReferral,
              levelOfCare: referralData.levelOfCare ?? LevelOfCare.PRIMARY,
              motherComplications: referralData.motherComplications,
              childComplications: referralData.childComplications,
              whoRequiresReferral: referralData.whoRequiresReferral,
              refer_out_reason:
                referralData.typeOfReferral === ReferralType.EXTERNAL
                  ? 'different expertise required'
                  : undefined,
            });

            if (referralData.typeOfReferral == ReferralType.INTERNAL) {
              const referInInput: ReferInCreationInterface = {
                patient: { id: referralData.patient_id },
                doctor: { id: userOfferingService!.userId },
                status: PatientStatus.PENDING,
                facility: { id: resolvedFacilityId },
                service_id: serviceRequired.id,
              };
              const result = await this.createReferInEntry(
                manager,
                referInInput,
              );
              referInResults.push(result);
            }
            await manager.save(referral);
          }

          //refer to cemonc visit status dispatched logic
          if (deliveryStatus === DeliveryProgressStatus.REFER_TO_CEMONC) {
            if (appointment.visit) {
              appointment.visit.status = VisitStatus.DISPATCHED;
              await manager.update(Visit, appointment.visit.id, {
                status: appointment.visit.status,
              });
            }
          }
          maybeMarkAppointmentCompleted();
        }
        for (const payload of deferredImmunisations) {
          await this.serviceUtility.saveImmunisation(payload, user, manager);
        }

        await this.serviceUtility.savePrescriptionsAndDispense(
          prescriptionsArr,
          managedAppointmentService,
          appointment,
          service,
          user,
          manager,
        );

        await Promise.all([
          manager.update(Appointment, appointment.id, {
            status: appointment.status,
          }),
          manager.update(AppointmentService, appointmentService.id, {
            status: managedAppointmentService.status,
            deliveryProgressStatus:
              managedAppointmentService.deliveryProgressStatus,
          }),
        ]);
      });

      const appointmentServiceResponse =
        await this.appointmentServiceRepo.findOneOrFail({
          where: { id: appointmentService.id },
          relations: DELIVERY_RESPONSE_RELATIONS,
          loadEagerRelations: false,
        });

      return {
        appointmentServiceResponse,
        referInResults,
      };
    } catch (e) {
      this.logger.error(ApiResponseMessages.DL_ADD_ERROR, e.stack);
      throw ExceptionUtility.generateException(
        e,
        ApiResponseMessages.DL_ADD_ERROR,
      );
    }
  }

  async findByPatientId(patientId: number, appointmentServiceId: number) {
    try {
      let delivery = await this.appointmentServiceRepo.findOne({
        where: {
          id: appointmentServiceId,
          appointment: { patient: { id: patientId } },
          service: { name: ServiceType.DELIVERY },
        },
        order: { createdAt: 'DESC' },
        relations: DELIVERY_RESPONSE_RELATIONS,
        loadEagerRelations: false,
      });

      if (!delivery) {
        throw new NotFoundException(
          `No DELIVERY visit found for patient ID ${patientId}`,
        );
      }

      await this.hydrateMedicinesAdministered(delivery);

      return delivery;
    } catch (error) {
      this.logger.error('Error fetching delivery record', error.stack);
      console.error(`Error fetching delivery for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * ES-774: The medicinesAdministered JSON column stores only medicine_variant_id
   * and quantity. We resolve variant details (name, unit, strength) on read.
   *
   * Something worth exploring in the future: what value do the medicinesAdministered
   * columns in the post_delivery_assessments and newborn_assessments tables add to
   * our app, since this data is also stored in the prescriptions table anyway.
   */
  async hydrateMedicinesAdministered(delivery: AppointmentService) {
    const promises: Promise<void>[] = [];

    if (delivery.postDeliveryAssesment?.medicinesAdministered) {
      promises.push(
        enrichMedicinesAdministered(
          this.medicineVariantRepo,
          delivery.postDeliveryAssesment.medicinesAdministered,
        ).then((enriched) => {
          delivery.postDeliveryAssesment.medicinesAdministered = enriched;
        }),
      );
    }

    if (delivery.newbornAssesment && Array.isArray(delivery.newbornAssesment)) {
      for (const newborn of delivery.newbornAssesment) {
        if (newborn.medicinesAdministered) {
          promises.push(
            enrichMedicinesAdministered(
              this.medicineVariantRepo,
              newborn.medicinesAdministered,
            ).then((enriched) => {
              newborn.medicinesAdministered = enriched;
            }),
          );
        }
      }
    }

    await Promise.all(promises);
  }

  async getDeliveryReport(filters: any) {
    try {
      const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters?.limit) > 0 ? Number(filters.limit) : 10;
      const skip = (page - 1) * limit;
      const facilityId = Number(filters?.facilityId);
      const patientId = Number(filters?.patientId);
      const deliveryProgressStatus = filters?.deliveryProgressStatus as
        | DeliveryProgressStatus
        | undefined;
      const typeOfDelivery = (
        filters?.TypeOfDelivery ?? filters?.typeOfDelivery
      ) as TypeOfDelivery | undefined;
      const search =
        typeof filters?.search === 'string' ? filters.search.trim() : '';

      const baseQuery = this.appointmentServiceRepo
        .createQueryBuilder('appointmentService')
        .leftJoin('appointmentService.service', 'service')
        .leftJoin('appointmentService.postDeliveryAssesment', 'postDelivery')
        .leftJoin('appointmentService.appointment', 'appointment')
        .leftJoin('appointment.patient', 'patient')
        .leftJoin('appointment.doctor', 'doctor')
        .where('service.name = :serviceName', {
          serviceName: ServiceType.DELIVERY,
        });

      if (filters?.dateFrom) {
        baseQuery.andWhere('DATE(appointmentService.createdAt) >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }

      if (filters?.dateTo) {
        baseQuery.andWhere('DATE(appointmentService.createdAt) <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }

      if (filters?.doctorId) {
        baseQuery.andWhere('doctor.id = :doctorId', {
          doctorId: Number(filters.doctorId),
        });
      }

      if (deliveryProgressStatus) {
        baseQuery.andWhere(
          'appointmentService.deliveryProgressStatus = :deliveryProgressStatus',
          { deliveryProgressStatus },
        );
      }

      if (typeOfDelivery) {
        baseQuery.andWhere('postDelivery.typeOfDelivery = :typeOfDelivery', {
          typeOfDelivery,
        });
      }

      if (!Number.isNaN(patientId) && patientId > 0) {
        baseQuery.andWhere('patient.id = :patientId', {
          patientId,
        });
      }

      if (!Number.isNaN(facilityId) && facilityId > 0) {
        baseQuery.andWhere('appointment.facility_id = :facilityId', {
          facilityId,
        });
      }

      if (search) {
        baseQuery.andWhere(
          new Brackets((searchQuery) => {
            searchQuery
              // TODO: CONCAT prevents index usage on first_name/last_name
              .where(
                "CONCAT(patient.first_name, ' ', patient.last_name) ILIKE :search",
                { search: `%${search}%` },
              )
              // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
              .orWhere('patient.phone_number LIKE :search', {
                search: `${search}%`,
              })
              // ES-780: Wildcard % prefix and ILIKE is intentionally not used to better utilize indexes
              .orWhere('patient.mr_no LIKE :search', {
                search: `${search}%`,
              });
          }),
        );
      }

      const countRow = await baseQuery
        .clone()
        .select('COUNT(DISTINCT appointmentService.id)', 'count')
        .getRawOne();
      const count = Number(countRow?.count ?? 0);

      const dataQuery = baseQuery
        .clone()
        .select('appointmentService.id', 'appointment_service_id')
        .addSelect('patient.id', 'patient_id')
        .addSelect('patient.first_name', 'patient_first_name')
        .addSelect('patient.last_name', 'patient_last_name')
        .addSelect('doctor.id', 'doctor_id')
        .addSelect('doctor.first_name', 'doctor_first_name')
        .addSelect('doctor.last_name', 'doctor_last_name')
        .addSelect('appointmentService.deliveryProgressStatus', 'status')
        .addSelect('postDelivery.typeOfDelivery', 'delivery_type')
        .addSelect('postDelivery.otherComplication', 'notes')
        .addSelect('appointmentService.createdAt', 'delivery_date');

      const rows = await dataQuery
        .orderBy('appointmentService.createdAt', 'DESC')
        .offset(skip)
        .limit(limit)
        .getRawMany();

      const typeSummaryRows = await baseQuery
        .clone()
        .select('postDelivery.typeOfDelivery', 'delivery_type')
        .addSelect('COUNT(DISTINCT appointmentService.id)', 'delivery_count')
        .groupBy('postDelivery.typeOfDelivery')
        .orderBy('delivery_count', 'DESC')
        .addOrderBy('postDelivery.typeOfDelivery', 'ASC')
        .getRawMany();

      const dailySummaryRows = await baseQuery
        .clone()
        .select('DATE(appointmentService.createdAt)', 'delivery_date')
        .addSelect('COUNT(DISTINCT appointmentService.id)', 'delivery_count')
        .groupBy('DATE(appointmentService.createdAt)')
        .orderBy('delivery_date', 'ASC')
        .getRawMany();

      return successResponse(
        {
          records: rows.map((row) => ({
            appointmentServiceId: Number(row.appointment_service_id),
            patientId: Number(row.patient_id),
            patientName: `${row.patient_first_name ?? ''} ${row.patient_last_name ?? ''}`.trim(),
            deliveryDate: row.delivery_date,
            status: row.status ?? null,
            deliveryType: row.delivery_type ?? null,
            doctorId: row.doctor_id ? Number(row.doctor_id) : null,
            doctorName:
              row.doctor_first_name || row.doctor_last_name
                ? `${row.doctor_first_name ?? ''} ${row.doctor_last_name ?? ''}`.trim()
                : null,
            notes: row.notes ?? null,
          })),
          deliverySummary: {
            typeSummary: typeSummaryRows.map((row) => ({
              deliveryType: row.delivery_type ?? 'Unknown',
              count: Number(row.delivery_count),
            })),
            dailySummary: dailySummaryRows.map((row) => ({
              date: row.delivery_date,
              count: Number(row.delivery_count),
            })),
          },
        },
        count === 0 ? 'No Data Found' : 'Delivery report fetched successfully',
        200,
        page,
        limit,
        count,
      );
    } catch (error) {
      this.logger.error('Failed to fetch delivery report', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch delivery report',
      );
    }
  }

  async update(
    id: number,
    updateDeliveryDto: UpdateDeliveryDto,
    request: Request,
    status?: DeliveryProgressStatus,
  ) {
    try {
      const userId = ((request as any).user as any)?.sub;
      const delivery = await this.appointmentServiceRepo.findOne({
        where: { id },
        relations: [
          ...DELIVERY_RESPONSE_RELATIONS,
          'appointment',
          'appointment.patient',
          'appointment.visit',
        ],
        loadEagerRelations: false,
      });

      if (!delivery) {
        throw new NotFoundException(`Delivery with ID ${id} not found`);
      }

      await this.serviceUtility.validatePatientAccess(
        delivery.appointment?.id,
        delivery.appointment?.patient?.id,
        userId,
      );

      const service = await this.serviceUtility.getServiceByType(
        ServiceType.DELIVERY,
      );
      delivery.service = service;

      // ES-805: Remove 12 hour edit limit
      // const timeDifferenceInHours =
      //   ExceptionUtility.timeDifferenceInHoursFromCreation(delivery.createdAt);

      // if (timeDifferenceInHours >= TIME_DIFF) {
      //   throw new ConflictException(ApiSuccessResponseMessages.EDIT_W_HOURS);
      // }

      const {
        preDelivery,
        postDelivery,
        newbornAssessments,
        dischargeDetails,
        referralDetails,
        ...rest
      } = updateDeliveryDto;

      if (preDelivery !== undefined) {
        delivery.preDeliveryAssesment =
          await this.serviceUtility.handleRequiredNestedUpdate(
            delivery.preDeliveryAssesment,
            preDelivery,
            this.preDeliveryRepository,
            'PreDeliveryAssessment',
          );
      }

      if (postDelivery !== undefined) {
        delivery.postDeliveryAssesment =
          await this.serviceUtility.handleRequiredNestedUpdate(
            delivery.postDeliveryAssesment,
            postDelivery,
            this.postDeliveryRepository,
            'PostDeliveryAssessment',
          );
      }

      if (newbornAssessments !== undefined) {
        if (newbornAssessments.length > 1) {
          for (let i = 0; i < newbornAssessments.length; i++) {
            delivery.newbornAssesment[i] =
              await this.serviceUtility.handleRequiredNestedUpdate(
                delivery.newbornAssesment[i],
                newbornAssessments[i],
                this.newBornRepository,
                'NewbornAssessment',
              );
          }
        }
      }

      if (dischargeDetails !== undefined) {
        delivery.deliveryDischargeDetails =
          await this.serviceUtility.handleRequiredNestedUpdate(
            delivery.deliveryDischargeDetails,
            dischargeDetails,
            this.dischargeRepository,
            'DischargeDetails',
          );
      }

      if (referralDetails !== undefined) {
        const referralList = Array.isArray(referralDetails)
          ? referralDetails
          : [referralDetails];

        await this.referralRepository.delete({
          appointmentService: { id: delivery.id },
        });

        const newReferrals: ReferralDetails[] = [];

        for (const referralData of referralList) {
          const referral = this.referralRepository.create();
          referral.appointmentService = delivery;
          referral.whoRequiresReferral = referralData.whoRequiresReferral
            ? [referralData.whoRequiresReferral]
            : [];
          referral.motherComplications =
            referralData.motherComplications ?? null;
          referral.childComplications = referralData.childComplications ?? null;
          referral.otherComplication = referralData.otherComplication ?? null;

          if (referralData.district_id) {
            referral.district = { id: referralData.district_id } as any;
          }

          if (referralData.facility_id) {
            referral.facility = { id: referralData.facility_id } as any;
          }

          referral.levelOfCare = referralData.levelOfCare ?? null;

          newReferrals.push(await this.referralRepository.save(referral));
        }

        delivery.deliveryReferralDetails = newReferrals;
      }

      const mappedRestData = this.serviceUtility.mapDtoToEntityData(rest);
      Object.assign(delivery, mappedRestData);

      if (status) {
        delivery.deliveryProgressStatus = status;

        if (
          status === DeliveryProgressStatus.REFER_TO_CEMONC &&
          delivery.appointment?.visit
        ) {
          delivery.appointment.visit.status = VisitStatus.DISPATCHED;
          await this.appointmentServiceRepo.manager.save(delivery.appointment.visit);
        }

        if (this.isTerminalDeliveryStatus(status)) {
          if (delivery.appointment) {
            delivery.appointment.status = PatientStatus.COMPLETED;
            await this.appointmentServiceRepo.manager.save(delivery.appointment);
          }
          delivery.status = PatientStatus.COMPLETED;
        }
      }

      const updated = await this.appointmentServiceRepo.save(delivery);

      return updated;
    } catch (error) {
      this.logger.error('Error updating delivery', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Error updating delivery',
      );
    }
  }
  private markAppointmentCompleted(
    appointment: Appointment,
    appointmentService: AppointmentService,
  ) {
    appointment.status = PatientStatus.COMPLETED;
    appointmentService.status = PatientStatus.COMPLETED;
  }

  private isTerminalDeliveryStatus(status: DeliveryProgressStatus): boolean {
    return [
      DeliveryProgressStatus.DISCHARGED,
      DeliveryProgressStatus.REFER_TO_CEMONC,
      DeliveryProgressStatus.FALSE_LABOR,
      DeliveryProgressStatus.LAMA,
    ].includes(status);
  }

  private async createReferralEntry(
    manager: EntityManager,
    input: ReferralCreationInput,
  ) {
    await manager.save(manager.create(Referral, input));
  }

  private async isPatientPaedsAge(
    manager: EntityManager,
    patientId: number,
  ): Promise<boolean> {
    const patient = await manager.findOne(Patient, {
      where: { id: patientId },
      select: ['id', 'dob'],
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    return this.isPaedsAge(patient.dob);
  }

  private isPaedsAge(dob?: Date | null): boolean {
    if (!dob) {
      return false;
    }
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (
      monthDelta < 0 ||
      (monthDelta === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age <= 14;
  }

  private async filterUserServicesByAttendance(
    userServices: UserService[],
  ): Promise<UserService[]> {
    const checked = await Promise.all(
      userServices.map(async (userService) => {
        const facilityId = userService.user?.facility?.id;
        if (!facilityId || !userService.user?.id) return null;
        const status = await this.serviceUtility.getAttendanceStatus(
          userService.user.id,
          facilityId,
        );
        return status === AttendanceStatus.CHECKED_IN ? userService : null;
      }),
    );

    const filtered = checked.filter(
      (userService): userService is UserService => !!userService,
    );
    if (filtered.length === 0) {
      throw new NotFoundException(
        'No users available for referral at this time.',
      );
    }
    return filtered;
  }

  private async createReferInEntry(
    manager: EntityManager,
    input: ReferInCreationInterface,
  ): Promise<ReferralResponse> {
    const visit = manager.create(Visit, {
      patient: { id: input.patient.id },
      facility: { id: input.facility.id },
      visitDate: new Date(),
    });

    const savedVisit = await manager.save(Visit, visit);
    const token = await this.tokenCounterService.getNextToken();
    const appointment = manager.create(Appointment, {
      patient: input.patient,
      doctor: input.doctor,
      facility: input.facility,
      visit: savedVisit,
      status: PatientStatus.PENDING,
      token_number: token,
    });

    const savedAppointment = await manager.save(Appointment, appointment);

    const appointmentDoctor = manager.create(AppointmentDoctor, {
      appointment: savedAppointment,
      doctor: input.doctor,
      is_primary: true,
      createdBy: input.doctor as User,
    });
    await manager.save(AppointmentDoctor, appointmentDoctor);

    const appointmentService = await manager.create(AppointmentService, {
      status: PatientStatus.PENDING,
      patient: input.patient,
      appointment: savedAppointment,
      service: { id: input.service_id },
    });

    const savedAppointmentService = await manager.save(
      AppointmentService,
      appointmentService,
    );

    const queue = manager.create(PatientQueue, {
      patient: input.patient,
      doctor: input.doctor,
      appointment: savedAppointment,
      status: PatientStatus.PENDING,
    });

    const savedQueue = await manager.save(PatientQueue, queue);

    const service = await manager.findOne(Service, {
      where: {
        id: input.service_id,
      },
    });
    if (!service) {
      throw new NotFoundException(
        `Service with the following id: ${input.service_id} not found while referring in the patient with id: ${input.patient.id}`,
      );
    }
    const referredDoctor = await manager.findOne(User, {
      where: {
        id: input.doctor.id,
      },
    });
    const referredPatient = await manager.findOne(Patient, {
      where: {
        id: input.patient.id,
      },
    });
    if (!referredPatient) {
      throw new NotFoundException(
        `Patient with id: ${input.patient.id} not found`,
      );
    }

    return {
      message: `Patient with id: ${input.patient.id} referred for the service: ${service.name} to the doctor: ${referredDoctor?.first_name} ${referredDoctor?.last_name} with id: ${referredDoctor?.id}`,
      patient: {
        id: referredPatient.id,
        firstName: referredPatient.first_name,
        lastName: referredPatient.last_name,
      },
      service: {
        id: service.id,
        name: service.name,
      },
      doctor: referredDoctor
        ? {
            id: referredDoctor.id,
            firstName: referredDoctor.first_name,
            lastName: referredDoctor.last_name,
          }
        : undefined,
    };
  }

  async getChildrenByAppointmentService(appointmentServiceId: number): Promise<
    {
      id: number;
      firstName: string;
      lastName: string;
      gender: string;
    }[]
  > {
    const rows = await this.deliveryPatientRepo
      .createQueryBuilder('dp')
      .innerJoin('dp.child', 'child')
      .where('dp.appointmentService = :id', { id: appointmentServiceId })
      .select([
        'child.id AS id',
        'child.first_name AS firstName',
        'child.last_name AS lastName',
        'child.gender AS gender',
      ])
      .getRawMany();

    return rows.map((r) => ({
      id: Number(r.id),
      firstName: r.firstname ?? r.firstName,
      lastName: r.lastname ?? r.lastName,
      gender: r.gender,
    }));
  }

  private async createNewbornRecords(
    manager: EntityManager,
    appointment: Appointment,
    nbData: any,
    managedAppointmentService: any,
    deliveryServiceId: number,
    deferredImmunisations: CreateImmunisationWithCardDto[],
  ) {
    if (
      [
        ChildCondition.DEAD_AFTER_DELIVERY,
        ChildCondition.INTRAUTERINE_DEATH,
      ].includes(nbData.condition)
    ) {
      return null;
    }

    const parentPatient = appointment.patient;
    const resolvedFacilityId =
      parentPatient.facility_id ?? appointment.facility?.id;

    if (!resolvedFacilityId) {
      throw new BadRequestException(
        'Facility is required to create newborn delivery records.',
      );
    }

    const babyMrNo = generateMrNo(
      new Date().getFullYear(),
      resolvedFacilityId,
    ).toString();

    const newbornPatient = manager.create(Patient, {
      first_name: `Baby of ${parentPatient.first_name}`,
      last_name: parentPatient.last_name || 'Newborn',
      cnic: parentPatient.cnic,
      cnic_provider: CNICProvider.Guardian,
      dob: new Date(),
      gender: nbData.sex === Sex.MALE ? Gender.MALE : Gender.FEMALE,
      address: parentPatient.address,
      phone_number: parentPatient.phone_number,
      division_id: parentPatient.division_id,
      district_id: parentPatient.district_id,
      facility_id: resolvedFacilityId,
      taluka_id: parentPatient.taluka_id,
      mr_no: babyMrNo,
      immunisation_number:
        nbData.vaccinesAdministered?.immunisationCard?.immunisationNumber,
      registration_type: PatientRegistrationType.DELIVERY,
      uc_id: appointment.patient?.uc_id,
    });

    await this.patientRollupService.lockForPatientCreation(manager);
    const newborn = await manager.save(newbornPatient);
    await this.patientRollupService.incrementForCreatedPatient(
      newborn.id,
      manager,
    );

    if (nbData.vaccinesAdministered) {
      const immunisationPayload: CreateImmunisationWithCardDto & {
        newBornDOB?: Date;
      } = {
        ...nbData.vaccinesAdministered,
        immunisationCard: {
          immunisationCardAvailable:
            nbData.vaccinesAdministered?.immunisationCard
              ?.immunisationCardAvailable,
          immunisationCardProvided:
            nbData.vaccinesAdministered?.immunisationCard
              ?.immunisationCardProvided,
          immunisationNumber:
            nbData.vaccinesAdministered?.immunisationCard?.immunisationNumber,
        },
        appointmentId: appointment.id,
        service_id: deliveryServiceId,
        newBornId: newborn.id,
        newBornDOB: newborn.dob,
      };
      deferredImmunisations.push(immunisationPayload);
    }

    const deliveryPatientEntry = manager.create(DeliveryPatient, {
      appointmentService: { id: managedAppointmentService.id },
      mother: { id: parentPatient.id },
      child: { id: newborn.id },
      facility: { id: resolvedFacilityId },
    });
    await manager.save(deliveryPatientEntry);
    return newborn;
  }

  private async handlePostDeliverCreation(
    manager: EntityManager,
    appointmentService: AppointmentService,
    managedAppointmentService: AppointmentService,
    data: any,
    medicineVariantRepo: Repository<MedicineVariant>,
    prescriptionsArr,
  ) {
    if (!data.postDelivery) {
      throw new BadRequestException('PostDelivery data is required');
    }
    const prevPostDelivery = await manager.exists(PostDeliveryAssessment, {
      where: { appointmentService: { id: appointmentService.id } },
    });
    if (prevPostDelivery) {
      throw new BadRequestException(
        `PostDeliveryAssessment already exists for AppointmentService ${appointmentService.id}`,
      );
    }

    const postDeliveryRecord = manager.create(PostDeliveryAssessment, {
      ...data.postDelivery,
      appointmentService: { id: appointmentService.id },
    });
    await manager.save(postDeliveryRecord);

    if (data.postDelivery?.medicinesAdministered?.length) {
      for (const med of data.postDelivery.medicinesAdministered) {
        const medicineVariantId = med.medicine_variant_id;

        const medicine = await medicineVariantRepo.findOne({
          where: { id: medicineVariantId },
        });
        if (!medicine) {
          throw new NotFoundException(
            `Medicine variant ${medicineVariantId} not found`,
          );
        }

        prescriptionsArr.push({
          medicine_variant_id: medicine.id,
          medicineDosage: med.dosage,
          medicineDuration: med.duration,
          quantity: med.quantity,
          medicineDispensed: false,
          medicineInstruction: med.medicineInstruction,
        });
      }
    }
  }
}
