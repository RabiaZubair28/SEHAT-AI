import { generateAdvisorDraft } from '../llm/service';
import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { FoodRules, generateRuleBasedPlan, validatePlan } from '../meal-planning/meal-planner';
import { NutrientTargets } from '../models/types';
import { AiPlanResult } from '../models/ai-plan';
import { GeminiClientService } from './gemini-client.service';
import { PlanPatient } from './plan-context';
import { PlanRepairService } from './plan-repair.service';

@Injectable()
export class NutritionAdvisorAiService {
  readonly draftAdvisor = generateAdvisorDraft;
  private readonly logger = new Logger(NutritionAdvisorAiService.name);
  private readonly client = new GeminiClientService();
  private readonly repairer = new PlanRepairService();
  private get enabled() { return (process.env.NUTRITION_ADVISOR_AI_ENABLED ?? 'true') !== 'false'; }
  private get model() { return process.env.NUTRITION_ADVISOR_MODEL || 'gemini-2.5-flash-lite'; }

  async proposePlan(patient: PlanPatient, targets: NutrientTargets, rules: FoodRules): Promise<AiPlanResult> {
    const fallback = (note: string): AiPlanResult => {
      const plan = generateRuleBasedPlan(rules, targets);
      if (plan.days.some((day) => day.meals.some((meal) => !meal.items.length)) ||
        validatePlan(plan, targets, rules).warnings.some((w) => w.severity === 'error')) {
        throw new UnprocessableEntityException('No safe automatic meal plan is available; clinician assessment is required.');
      }
      return { plan, generatedBy: 'rules', note };
    };
    if (!this.enabled) return fallback('AI drafting is switched off; plan built from approved meal patterns.');
    if (!process.env.GEMINI_API_KEY) return fallback('Gemini API key is not configured; plan built from approved meal patterns.');
    try {
      const raw = await this.client.requestPlan(patient, targets, rules, this.model);
      const plan = this.repairer.repair(raw, rules, targets);
      if (!plan) return fallback('AI draft was incomplete; plan built from approved meal patterns.');
      const errors = validatePlan(plan, targets, rules).warnings.filter((w) => w.severity === 'error');
      if (errors.length) return fallback('AI plan did not pass safety checks; plan built from approved meal patterns.');
      return { plan, generatedBy: `ai:${this.model}`.slice(0, 40) };
    } catch (err) {
      const timedOut = err instanceof Error && err.name === 'AbortError';
      this.logger.warn(`Hosted AI plan drafting failed: ${timedOut ? 'timeout' : 'provider or validation error'}`);
      return fallback(timedOut ? 'AI drafting took too long; plan built from approved meal patterns.' : 'AI service unavailable; plan built from approved meal patterns.');
    }
  }
}
