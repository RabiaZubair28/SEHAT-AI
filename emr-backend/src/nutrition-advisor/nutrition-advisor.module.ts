import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { NutritionAdvisorController } from './nutrition-advisor.controller';
import { NutritionAdvisorService } from './nutrition-advisor.service';
import { NutritionAdvisorContextService } from './nutrition-advisor-context.service';
import { NutritionAdvisorAiService } from '@health-advisor/modules/nutrition-advisor/services/ai-plan.service';
import { NutritionAdvisorWhatsAppService } from './nutrition-advisor-whatsapp.service';
import { NutritionAdvisorPlan } from './entities/nutrition-advisor-plan.entity';
import { NutritionAdvisorEvent } from './entities/nutrition-advisor-event.entity';
import { NutritionAdvisorDelivery } from './entities/nutrition-advisor-delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentService,
      User,
      Prescription,
      OtherPrescription,
      MedicineVariant,
      NutritionAdvisorPlan,
      NutritionAdvisorEvent,
      NutritionAdvisorDelivery,
    ]),
    AuthModule,
  ],
  controllers: [NutritionAdvisorController],
  providers: [
    NutritionAdvisorService,
    NutritionAdvisorContextService,
    NutritionAdvisorAiService,
    NutritionAdvisorWhatsAppService,
  ],
})
export class NutritionAdvisorModule {}
