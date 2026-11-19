import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { successResponse } from 'src/common/utils/response.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { RoleName, VisitStatus } from 'src/common/enums/enums';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { MedicineVariant } from './entities/medicine-variant.entity';
import { MedicineCount } from 'src/medicine-batch/entities/medicine-count.entity';
import { Medicine } from './entities/medicine.entity';

@Injectable()
export class MedicineService {
  private readonly logger: Logger = new Logger(MedicineService.name);

  constructor(
    @InjectRepository(MedicineVariant)
    private readonly medicineVariantRepository: Repository<MedicineVariant>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: Repository<Prescription>,
    @InjectRepository(MedicineCount)
    private readonly medicineCountRepository: Repository<MedicineCount>,
    private readonly serviceUtility: ServiceUtility,
  ) { }

  async getMedicines(filters: any) {
    try {
      const page = parseInt(filters.page, 10) || 1;
      const limit = parseInt(filters.limit, 10) || 10;
      const skip = (page - 1) * limit;

      const queryBuilder = this.medicineVariantRepository
        .createQueryBuilder('variant')
        .leftJoinAndSelect('variant.medicine', 'medicine')
        .leftJoinAndSelect('variant.batches', 'batch')
        .leftJoinAndSelect('variant.medicineCount', 'medicineCount');

      if (filters.name) {
        queryBuilder.andWhere('medicine.name ILIKE :name', {
          name: `%${filters.name}%`,
        });
      }

      if (filters.category) {
        queryBuilder.andWhere('medicine.category = :category', {
          category: filters.category,
        });
      }

      if (filters.except_category) {
        queryBuilder.andWhere('medicine.category != :exceptCategory', {
          exceptCategory: filters.except_category,
        });
      }

      if (filters.is_otc !== undefined) {
        queryBuilder.andWhere('medicineCount.otc = :isOtc', {
          isOtc: filters.is_otc,
        });
      }

      if (filters.contraceptive !== undefined) {
        queryBuilder.andWhere('medicine.contraceptive = :contraceptive', {
          contraceptive: filters.contraceptive,
        });
      }

      queryBuilder
        .orderBy('medicine.name', 'ASC')
        .addOrderBy('variant.id', 'ASC')
        .skip(skip)
        .take(limit);

      const [data, count] = await queryBuilder.getManyAndCount();

      const message =
        count === 0 ? 'No Data Found' : 'Medicines fetched successfully';

      return successResponse(data, message, 200, page, limit, count);
    } catch (error) {
      console.error(ApiResponseMessages.FAC_FET_FAILED, error);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.FAC_FET_FAILED,
      );
    }
  }

  async getPatientPrescribedMedicines(
    patientId,
    request,
  ): Promise<Prescription> {
    try {
      const facilityId = request?.user?.facilityId ?? request?.facilityId;

      const prescription = await this.prescriptionRepository.find({
        where: {
          medicineDispensed: false,
          visit: {
            patient_id: patientId,
            status: VisitStatus.IN_PROGRESS,
            facility: { id: facilityId },
          },
        },
        relations: [
          'medicineVariant',
          'medicineVariant.medicine',
          'medicineVariant.batches',
          'medicineVariant.batches.facility',
        ],
      });
      if (prescription.length === 0) {
        throw new NotFoundException(
          ApiResponseMessages.PRES_NOT_FOUND,
        );
      }

      const variantIds = [
        ...new Set(
          prescription
            .map((item) => item.medicineVariant?.id)
            .filter((id): id is number => typeof id === 'number'),
        ),
      ];

      const medicineCounts =
        facilityId && variantIds.length
          ? await this.medicineCountRepository.find({
            where: {
              facilityId,
              medicineVariantId: In(variantIds),
            },
          })
          : [];

      const medicineCountByVariant = new Map(
        medicineCounts.map((count) => [count.medicineVariantId, count]),
      );

      const prescriptionsWithDispensedQuantity = prescription.map((prescriptionItem) => {
        const variant = prescriptionItem.medicineVariant;

        const desiredQuantity = this.serviceUtility.calculateDesiredQuantity(
          variant,
          prescriptionItem,
        );

        const facilityBatches =
          variant?.batches?.filter(
            (batch) => batch.facility?.id === facilityId,
          ) ?? [];

        const availableQuantity = facilityBatches.reduce(
          (total, batch) => total + (batch.stock_quantity ?? 0),
          0,
        );

        const medicineCount = medicineCountByVariant.get(variant.id);

        const { dispensedQuantity } = this.serviceUtility.calculateDispensedQuantity(
          desiredQuantity,
          availableQuantity,
          medicineCount?.limit_quantity,
          variant?.medicine?.name,
          Boolean(medicineCount?.otc),
        );

        return {
          ...prescriptionItem,
          dispensedQuantity,
          desiredQuantity,
        };
      });

      return successResponse(
        prescriptionsWithDispensedQuantity,
        ApiSuccessResponseMessages.PRES_FETCH_SUCCESS,
        200,
      );
    } catch (error) {
      this.logger.error(ApiResponseMessages.PRES_FETCH_ERROR, error.stack);
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.PRES_FETCH_ERROR,
      );
    }
  }
}
