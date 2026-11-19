import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateDispenserDto } from './dto/create-dispenser.dto';
import { successResponse } from 'src/common/utils/response.util';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Dispenser } from './entities/dispenser.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { ApiSuccessResponseMessages } from 'src/common/api-success-messages.constant';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { PatientStatus, RoleName, ServiceType } from 'src/common/enums/enums';
import { User } from 'src/users/entities/user.entity';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { DispenseItem } from './entities/dispense-item.entity';
import { OtcDto } from './dto/otc.dto';
import { DoctorMedicineStock } from 'src/medicine/entities/doctor-medicine-stock.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { MedicineCount } from 'src/medicine-batch/entities/medicine-count.entity';
import { CreateEmergencyDispenserDto } from './dto/create-emergency-dispenser.dto';
import { Facility } from 'src/facilities/entities/facility.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
@Injectable()
export class DispenserService {
  private readonly logger: Logger = new Logger(DispenserService.name);
  constructor(
    @InjectRepository(Dispenser)
    private readonly dispenserRepository: Repository<Dispenser>,
    @Inject(forwardRef(() => ServiceUtility))
    private readonly serviceUtility: ServiceUtility,
  ) { }

  async create(
    dispenserDto: CreateDispenserDto,
    user: AuthenticatedUser,
    transactionalEntityManager?: EntityManager,
  ): Promise<Dispenser> {
    try {
      const userId = user.sub;
      const userRole = user.role;
      const isDispenser = userRole === RoleName.DISPENSER;
      let dispenserWithRelations: Dispenser | null = null;
      const warnings: string[] = [];

      if (!userId) {
        throw new UnauthorizedException('Unable to determine dispensing user.');
      }

      const appointment = await this.serviceUtility.validateAppointment(
        dispenserDto.appointment_id,
      );

      await this.serviceUtility.validatePatientAccess(
        appointment.id,
        appointment.patient.id,
        userId,
      );

      const facilityId = appointment.facility?.id;

      if (!facilityId) {
        throw new BadRequestException(
          'Unable to determine facility for the appointment.',
        );
      }

      const service = await this.serviceUtility.getServiceByType(
        ServiceType.MEDICINE_DISPENSING,
      );

      const appointmentService =
        await this.serviceUtility.validateAndGetAppointmentService(
          appointment.id,
          transactionalEntityManager ? dispenserDto.service_id : service.id,
        );

      if (!transactionalEntityManager) {
        await this.serviceUtility.checkAppointmentServiceStatus(
          appointmentService,
          PatientStatus.IN_PROGRESS,
        );
      }

      const runner = async (manager: EntityManager) => {
        const operatingUser = new User();
        operatingUser.id = userId;

        const existingDispenser = await manager.findOne(Dispenser, {
          where: { appointmentService: { id: appointmentService.id } },
          loadEagerRelations: false,
        });

        const dispenser =
          existingDispenser ??
          manager.create(Dispenser, {
            remarks: dispenserDto.remarks,
            otcMedRequired: dispenserDto.otcMedRequired,
          });
        if (existingDispenser) {
          if (dispenserDto.remarks !== undefined) {
            dispenser.remarks = dispenserDto.remarks;
          }
          dispenser.updatedBy = operatingUser;
        } else {
          dispenser.dispensedBy = operatingUser;
          dispenser.createdBy = operatingUser;
        }
        dispenser.appointmentService = appointmentService;
        dispenser.facility = appointment.facility;

        const dispenseItems: DispenseItem[] = [];
        const dispensedPrescriptions: Prescription[] = [];

        for (const itemDto of dispenserDto.items ?? []) {
          const prescription = await this.findPrescriptionForDispensing(
            manager,
            itemDto.prescription_id,
          );

          if (!prescription) {
            throw new NotFoundException(
              `Prescription with id ${itemDto.prescription_id} not found`,
            );
          }

          const variant = prescription.medicineVariant;

          const desiredQuantity = this.serviceUtility.calculateDesiredQuantity(
            variant,
            prescription,
          );

          const medicineCount = await manager.findOne(MedicineCount, {
            where: { medicineVariantId: variant.id, facilityId },
          });

          if (desiredQuantity <= 0) {
            throw new BadRequestException(
              'Desired quantity must be greater than zero',
            );
          }

          const { dispenseItem, dispensedQuantity } =
            await this.createDispenseItem(
              manager,
              variant,
              desiredQuantity,
              dispenser,
              operatingUser,
              appointment,
              facilityId,
              isDispenser,
              false,
              prescription,
              medicineCount ?? undefined,
            );
          dispenseItems.push(dispenseItem);

          if (dispensedQuantity > 0) {
            prescription.medicineDispensed = true;
            prescription.updatedBy = operatingUser;
            dispensedPrescriptions.push(prescription);
          } else {
            warnings.push(
              `${this.formatMedicineVariantLabel(variant)} is out of stock. Added with dispensed quantity 0.`,
            );
          }
        }
        if (dispensedPrescriptions.length) {
          await this.markPrescriptionsDispensed(
            manager,
            dispensedPrescriptions,
            operatingUser,
          );
        }

        if (dispenserDto.otc_items?.length) {
          const otcDispenseItems = await this.processOtcItems(
            manager,
            dispenserDto.otc_items,
            dispenser,
            operatingUser,
            appointment,
            facilityId,
            isDispenser,
          );
          dispenseItems.push(...otcDispenseItems);
        }

        if (dispenseItems.length) {
          dispenser.items = dispenseItems;
        }
        if (!transactionalEntityManager) {
          appointment.status = PatientStatus.COMPLETED;
          appointment.updatedBy = operatingUser;

          appointmentService.status = PatientStatus.COMPLETED;
          appointmentService.updatedBy = operatingUser;
        }

        const savedDispenser = await manager.save(dispenser);

        if (!transactionalEntityManager) {
          await Promise.all([
            manager.update(Appointment, appointment.id, {
              status: appointment.status,
              updatedBy: { id: operatingUser.id },
            } as any),
            manager.update(AppointmentService, appointmentService.id, {
              status: appointmentService.status,
              updatedBy: { id: operatingUser.id },
            } as any),
          ]);
        }

        dispenserWithRelations = await this.findDispenserResponse(
          manager,
          savedDispenser.id,
        );
      };

      if (transactionalEntityManager) {
        await runner(transactionalEntityManager);
      } else {
        await this.dispenserRepository.manager.transaction(runner);
      }
      if (dispenserWithRelations) {
        (dispenserWithRelations as any).warnings = warnings;
      }

      return successResponse(
        dispenserWithRelations,
        ApiSuccessResponseMessages.DISPENSER_CREATED,
        201,
      );
    } catch (error) {
      this.logger.error(
        ApiResponseMessages.DISPENSER_CREATION_FAILED,
        error.stack,
      );
      throw ExceptionUtility.generateException(
        error,
        ApiResponseMessages.DISPENSER_CREATION_FAILED,
      );
    }
  }

  private formatMedicineVariantLabel(variant?: MedicineVariant | null): string {
    const medicineName = variant?.medicine?.name?.trim() || 'Medicine';
    const strength = variant?.strength?.trim();

    return strength ? `${medicineName} (${strength})` : medicineName;
  }

  private async findPrescriptionForDispensing(
    manager: EntityManager,
    prescriptionId: number,
    emergencyPatientId?: number,
  ): Promise<Prescription | null> {
    const qb = manager
      .getRepository(Prescription)
      .createQueryBuilder('prescription')
      .leftJoin('prescription.medicineVariant', 'variant')
      .leftJoin('variant.medicine', 'medicine')
      .leftJoin('variant.batches', 'batch')
      .leftJoin('batch.facility', 'facility')
      .select([
        'prescription.id',
        'prescription.medicineDosage',
        'prescription.medicineDuration',
        'prescription.quantity',
        'prescription.medicineDispensed',
        'variant.id',
        'variant.strength',
        'variant.unit',
        'medicine.id',
        'medicine.name',
        'medicine.category',
        'medicine.contraceptive',
        'batch.id',
        'batch.stock_quantity',
        'facility.id',
      ])
      .where('prescription.id = :prescriptionId', { prescriptionId })
      .andWhere('prescription.medicine_dispensed = :medicineDispensed', {
        medicineDispensed: false,
      });

    if (emergencyPatientId !== undefined) {
      qb.innerJoin('prescription.emergencyPatient', 'emergencyPatient')
        .andWhere('emergencyPatient.id = :emergencyPatientId', {
          emergencyPatientId,
        });
    }

    return qb.getOne();
  }

  private async markPrescriptionsDispensed(
    manager: EntityManager,
    prescriptions: Prescription[],
    operatingUser: User,
  ): Promise<void> {
    const prescriptionIds = prescriptions.map((prescription) => prescription.id);
    if (!prescriptionIds.length) {
      return;
    }

    await manager
      .createQueryBuilder()
      .update(Prescription)
      .set({
        medicineDispensed: true,
        updatedBy: { id: operatingUser.id },
      } as any)
      .where('id IN (:...prescriptionIds)', { prescriptionIds })
      .execute();
  }

  private async findDispenserResponse(
    manager: EntityManager,
    dispenserId: number,
    includeEmergencyPatient = false,
  ): Promise<Dispenser | null> {
    const qb = manager
      .getRepository(Dispenser)
      .createQueryBuilder('dispenser')
      .leftJoin('dispenser.items', 'item')
      .leftJoin('item.medicineVariant', 'variant')
      .leftJoin('variant.medicine', 'medicine')
      .leftJoin('item.batch', 'batch')
      .leftJoin('dispenser.appointmentService', 'appointmentService')
      .leftJoin('dispenser.facility', 'facility')
      .select([
        'dispenser.id',
        'dispenser.remarks',
        'dispenser.otcMedRequired',
        'item.id',
        'item.required_qty',
        'item.dispensed_qty',
        'item.medicineDosage',
        'item.medicineDuration',
        'item.otc',
        'variant.id',
        'variant.strength',
        'variant.unit',
        'medicine.id',
        'medicine.name',
        'medicine.category',
        'batch.id',
        'batch.batch_number',
        'batch.stock_quantity',
        'appointmentService.id',
        'appointmentService.status',
        'appointmentService.deliveryProgressStatus',
        'facility.id',
        'facility.name',
      ])
      .where('dispenser.id = :dispenserId', { dispenserId });

    if (includeEmergencyPatient) {
      qb.leftJoin('dispenser.emergencyPatient', 'emergencyPatient')
        .addSelect(['emergencyPatient.id']);
    }

    return qb.getOne();
  }

  private async createDispenseItem(
    transactionalEntityManager: EntityManager,
    variant: MedicineVariant,
    desiredQuantity: number,
    dispenser: Dispenser,
    operatingUser: User,
    appointment: any,
    facilityId: number,
    isDispenser: boolean,
    isOtc: boolean = false,
    prescription?: Prescription | null,
    medicineCount?: MedicineCount,
  ): Promise<{ dispenseItem: DispenseItem; dispensedQuantity: number }> {
    const medicineBatches =
      variant.batches?.filter((batch) => batch.facility?.id === facilityId) ??
      [];

    const sortedBatches = [...medicineBatches].sort(
      (a, b) => (b.stock_quantity ?? 0) - (a.stock_quantity ?? 0),
    );
    const [primaryBatch] = sortedBatches;

    let dispensedQuantity = 0;
    let dispenseItemBatch: MedicineBatch | undefined;

    if (isDispenser) {
      const availableStock = sortedBatches.reduce(
        (total, batch) => total + (batch.stock_quantity ?? 0),
        0,
      );

      const {
        dispensedQuantity: calculatedQuantity,
        dispenseItemBatch: calculatedBatch,
        updatedBatches,
      } = this.serviceUtility.calculateDispensedQuantity(
        desiredQuantity,
        availableStock,
        medicineCount?.limit_quantity ?? null,
        variant.medicine?.name,
        isOtc,
        sortedBatches,
        operatingUser,
      );

      dispensedQuantity = calculatedQuantity;
      if (calculatedBatch) {
        dispenseItemBatch = calculatedBatch;
      }

      if (updatedBatches.length) {
        await transactionalEntityManager.save(updatedBatches);
      }

      if (dispensedQuantity > 0) {
        await this.updateMedicineCount(
          transactionalEntityManager,
          variant,
          facilityId,
          availableStock,
          dispensedQuantity,
        );
      }
    } else {
      const doctorStock = await transactionalEntityManager.findOne(
        DoctorMedicineStock,
        {
          where: {
            doctor: { id: appointment.doctor.id },
            facility: { id: facilityId },
            medicineVariant: { id: variant.id },
          },
        },
      );

      if (!doctorStock) {
        throw new NotFoundException(
          `Medicine ${variant.medicine?.name} not found in doctor stock, Please request commodity.`,
        );
      }

      if (!isOtc && (doctorStock.quantity ?? 0) < desiredQuantity) {
        throw new BadRequestException(
          `Requested ${desiredQuantity}, only ${doctorStock.quantity ?? 0} available`,
        );
      }

      const { dispensedQuantity: calculatedQuantity } =
        this.serviceUtility.calculateDispensedQuantity(
          desiredQuantity,
          doctorStock.quantity ?? 0,
        );
      dispensedQuantity = calculatedQuantity;

      if (dispensedQuantity > 0) {
        doctorStock.quantity -= dispensedQuantity;
        doctorStock.updatedBy = operatingUser;
        await transactionalEntityManager.save(doctorStock);
      }
    }

    if (!dispenseItemBatch) {
      dispenseItemBatch = primaryBatch;
    }

    const dispenseItemData: Partial<DispenseItem> = {
      medicineVariant: variant,
      dispensed_qty: dispensedQuantity,
      required_qty: desiredQuantity,
      otc: isOtc ? true : false,
    };

    if (dispenseItemBatch) {
      dispenseItemData.batch = dispenseItemBatch;
    }

    if (prescription) {
      dispenseItemData.medicineDosage = prescription.medicineDosage;
      dispenseItemData.medicineDuration = prescription.medicineDuration;
    }

    const dispenseItem = transactionalEntityManager.create(
      DispenseItem,
      dispenseItemData,
    );
    dispenseItem.dispense = dispenser;
    dispenseItem.createdBy = operatingUser;

    return { dispenseItem, dispensedQuantity };
  }

  private async updateMedicineCount(
    transactionalEntityManager: EntityManager,
    variant: MedicineVariant,
    facilityId: number,
    availableStock: number,
    dispensedQuantity: number,
  ): Promise<void> {
    if (dispensedQuantity <= 0) {
      return;
    }

    const medicineId = variant.medicine?.id;
    if (!medicineId) {
      return;
    }

    const existingCount = await transactionalEntityManager.findOne(
      MedicineCount,
      {
        where: {
          medicineId,
          medicineVariantId: variant.id,
          facilityId,
        },
      },
    );

    if (existingCount) {
      existingCount.count = Math.max(
        0,
        (existingCount.count ?? 0) - dispensedQuantity,
      );
      await transactionalEntityManager.save(existingCount);
      return;
    }

    const remainingCount = Math.max(
      0,
      (availableStock ?? 0) - dispensedQuantity,
    );
    const newCount = transactionalEntityManager.create(MedicineCount, {
      medicineId,
      medicineVariantId: variant.id,
      facilityId,
      count: remainingCount,
    });
    await transactionalEntityManager.save(newCount);
  }

  private async processOtcItems(
    transactionalEntityManager: EntityManager,
    otcItems: OtcDto[],
    dispenser: Dispenser,
    operatingUser: User,
    appointment: any,
    facilityId: number,
    isDispenser: boolean,
  ): Promise<DispenseItem[]> {
    const otcDispenseItems: DispenseItem[] = [];

    for (const otcItem of otcItems) {
      const variant = await transactionalEntityManager.findOne(
        MedicineVariant,
        {
          where: {
            id: otcItem.medicine_variant_id,
          },
          relations: ['batches', 'batches.facility', 'medicine'],
        },
      );

      if (!variant) {
        throw new NotFoundException(
          `OTC medicine variant ${otcItem.medicine_variant_id} not found`,
        );
      }

      const medicineCount = await transactionalEntityManager.findOne(
        MedicineCount,
        {
          where: {
            medicineVariantId: variant.id,
            facilityId,
            otc: true,
          },
        },
      );

      if (!medicineCount) {
        throw new NotFoundException(
          `OTC ${this.formatMedicineVariantLabel(variant)} not found in medicine count`,
        );
      }

      const desiredQuantity = otcItem.quantity;

      const { dispenseItem } = await this.createDispenseItem(
        transactionalEntityManager,
        variant,
        desiredQuantity,
        dispenser,
        operatingUser,
        appointment,
        facilityId,
        isDispenser,
        true,
        undefined,
        medicineCount,
      );

      otcDispenseItems.push(dispenseItem);
    }

    return otcDispenseItems;
  }

  async findByPatientId(patientId: number, appointmentServiceId: number) {
    const dispenseItem = await this.dispenserRepository.findOne({
      where: {
        appointmentService: {
          id: appointmentServiceId,
          appointment: { patient: { id: patientId } },
        },
      },
      order: { createdAt: 'DESC' },
      relations: [
        'items',
        'items.medicineVariant.medicine',
        'items.medicineVariant',
        'items.medicineVariant.batches',
        'appointmentService',
      ],
    });

    if (!dispenseItem) {
      throw new NotFoundException(
        `No Dispenser records found for patient ID ${patientId}`,
      );
    }
    return dispenseItem;
  }

  async getMedicineCountReport(filters: any) {
    try {
      const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters?.limit) > 0 ? Number(filters.limit) : 10;
      const includeDateWiseUsage =
        filters?.includeDateWiseUsage === true ||
        filters?.includeDateWiseUsage === 'true';
      const facilityId = Number(filters?.facilityId);
      const variantId = Number(filters?.variantId ?? filters?.variant_id);
      const medicineName =
        typeof filters?.medicineName === 'string'
          ? filters.medicineName.trim()
          : '';

      const itemRepository = this.dispenserRepository.manager.getRepository(
        DispenseItem,
      );
      const medicineCountRepository = this.dispenserRepository.manager.getRepository(
        MedicineCount,
      );

      const usageQuery = itemRepository
        .createQueryBuilder('dispenseItem')
        .leftJoin('dispenseItem.medicineVariant', 'medicineVariant')
        .leftJoin('medicineVariant.medicine', 'medicine')
        .leftJoin('dispenseItem.dispense', 'dispense')
        .select('medicineVariant.id', 'medicine_variant_id')
        .addSelect('medicine.id', 'medicine_id')
        .addSelect('medicine.name', 'medicine_name')
        .addSelect('medicine.generic_name', 'medicine_generic_name')
        .addSelect('medicineVariant.strength', 'variant_strength')
        .addSelect('medicineVariant.unit', 'variant_unit')
        .addSelect('SUM(dispenseItem.dispensed_qty)', 'total_dispensed_qty')
        .groupBy('medicineVariant.id')
        .addGroupBy('medicine.id')
        .addGroupBy('medicine.name')
        .addGroupBy('medicine.generic_name')
        .addGroupBy('medicineVariant.strength')
        .addGroupBy('medicineVariant.unit')
        .orderBy('medicine.name', 'ASC');

      if (filters?.dateFrom) {
        usageQuery.andWhere('DATE(dispenseItem.createdAt) >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }

      if (filters?.dateTo) {
        usageQuery.andWhere('DATE(dispenseItem.createdAt) <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }

      if (medicineName) {
        usageQuery.andWhere('medicine.name ILIKE :medicineName', {
          medicineName: `%${medicineName}%`,
        });
      }

      if (facilityId) {
        usageQuery.andWhere('dispense.facility_id = :facilityId', {
          facilityId,
        });
      }

      if (!Number.isNaN(variantId) && variantId > 0) {
        usageQuery.andWhere('medicineVariant.id = :variantId', { variantId });
      }

      const usageRows = await usageQuery.getRawMany();

      let dateWiseRows: any[] = [];

      if (includeDateWiseUsage) {
        const dateWiseUsageQuery = itemRepository
          .createQueryBuilder('dispenseItem')
          .leftJoin('dispenseItem.medicineVariant', 'medicineVariant')
          .leftJoin('medicineVariant.medicine', 'medicine')
          .leftJoin('dispenseItem.dispense', 'dispense')
          .select('medicineVariant.id', 'medicine_variant_id')
          .addSelect('medicine.name', 'medicine_name')
          .addSelect('medicine.generic_name', 'medicine_generic_name')
          .addSelect('medicineVariant.strength', 'variant_strength')
          .addSelect('medicineVariant.unit', 'variant_unit')
          .addSelect('DATE(dispenseItem.createdAt)', 'usage_date')
          .addSelect('SUM(dispenseItem.dispensed_qty)', 'dispensed_qty')
          .groupBy('medicineVariant.id')
          .addGroupBy('medicine.name')
          .addGroupBy('medicine.generic_name')
          .addGroupBy('medicineVariant.strength')
          .addGroupBy('medicineVariant.unit')
          .addGroupBy('DATE(dispenseItem.createdAt)')
          .orderBy('usage_date', 'ASC');

        if (filters?.dateFrom) {
          dateWiseUsageQuery.andWhere('DATE(dispenseItem.createdAt) >= :dateFrom', {
            dateFrom: filters.dateFrom,
          });
        }

        if (filters?.dateTo) {
          dateWiseUsageQuery.andWhere('DATE(dispenseItem.createdAt) <= :dateTo', {
            dateTo: filters.dateTo,
          });
        }

        if (medicineName) {
          dateWiseUsageQuery.andWhere('medicine.name ILIKE :medicineName', {
            medicineName: `%${medicineName}%`,
          });
        }

        if (facilityId) {
          dateWiseUsageQuery.andWhere('dispense.facility_id = :facilityId', {
            facilityId,
          });
        }

        if (!Number.isNaN(variantId) && variantId > 0) {
          dateWiseUsageQuery.andWhere('medicineVariant.id = :variantId', {
            variantId,
          });
        }

        dateWiseRows = await dateWiseUsageQuery.getRawMany();
      }

      const stockQuery = medicineCountRepository
        .createQueryBuilder('medicineCount')
        .leftJoin('medicineCount.medicine', 'medicine')
        .leftJoin('medicineCount.medicineVariant', 'medicineVariant')
        .select('medicineVariant.id', 'medicine_variant_id')
        .addSelect('medicine.id', 'medicine_id')
        .addSelect('medicine.name', 'medicine_name')
        .addSelect('medicine.generic_name', 'medicine_generic_name')
        .addSelect('medicineVariant.strength', 'variant_strength')
        .addSelect('medicineVariant.unit', 'variant_unit')
        .addSelect('SUM(medicineCount.count)', 'remaining_stock')
        .groupBy('medicineVariant.id')
        .addGroupBy('medicine.id')
        .addGroupBy('medicine.name')
        .addGroupBy('medicine.generic_name')
        .addGroupBy('medicineVariant.strength')
        .addGroupBy('medicineVariant.unit');

      if (medicineName) {
        stockQuery.andWhere('medicine.name ILIKE :medicineName', {
          medicineName: `%${medicineName}%`,
        });
      }

      if (facilityId) {
        stockQuery.andWhere('medicineCount.facilityId = :facilityId', {
          facilityId,
        });
      }

      if (!Number.isNaN(variantId) && variantId > 0) {
        stockQuery.andWhere('medicineVariant.id = :variantId', { variantId });
      }

      const stockRows = await stockQuery.getRawMany();

      const dateWiseUsageMap = new Map<number, { date: string; quantity: number }[]>();

      for (const dateWiseRow of dateWiseRows) {
        const variantId = Number(dateWiseRow.medicine_variant_id);
        const existingRows = dateWiseUsageMap.get(variantId) || [];
        existingRows.push({
          date: dateWiseRow.usage_date,
          quantity: Number(dateWiseRow.dispensed_qty),
        });
        dateWiseUsageMap.set(variantId, existingRows);
      }

      const stockMap = new Map<number, number>();
      stockRows.forEach((stockRow) => {
        stockMap.set(
          Number(stockRow.medicine_variant_id),
          Number(stockRow.remaining_stock),
        );
      });

      const mergedRows = usageRows.map((usageRow) => {
        const currentVariantId = Number(usageRow.medicine_variant_id);
        const currentMedicineId = Number(usageRow.medicine_id);
        return {
          medicineId: currentMedicineId,
          medicineVariantId: currentVariantId,
          medicineName: usageRow.medicine_name,
          medicine: {
            id: currentMedicineId,
            name: usageRow.medicine_name,
            genericName: usageRow.medicine_generic_name ?? null,
          },
          variant: {
            id: currentVariantId,
            strength: usageRow.variant_strength ?? null,
            unit: usageRow.variant_unit ?? null,
          },
          totalQuantityDispensed: Number(usageRow.total_dispensed_qty),
          remainingStock: stockMap.get(currentVariantId) ?? 0,
          dateWiseUsage: includeDateWiseUsage
            ? dateWiseUsageMap.get(currentVariantId) || []
            : undefined,
        };
      });

      const count = mergedRows.length;
      const paginatedData = mergedRows.slice((page - 1) * limit, page * limit);
      const top5MedicinesByQuantityDispensed = [...mergedRows]
        .sort(
          (a, b) => b.totalQuantityDispensed - a.totalQuantityDispensed,
        )
        .slice(0, 5);

      return successResponse(
        {
          records: paginatedData,
          top5MedicinesByQuantityDispensed,
        },
        count === 0 ? 'No Data Found' : 'Medicine count report fetched successfully',
        200,
        page,
        limit,
        count,
      );
    } catch (error) {
      this.logger.error('Failed to fetch medicine count report', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Failed to fetch medicine count report',
      );
    }
  }

  // src/dispenser/dispenser.service.ts

  async createForEmergency(
    dispenserDto: CreateEmergencyDispenserDto,
    request: Request,
    transactionalEntityManager?: EntityManager,
  ): Promise<Dispenser> {
    try {
      const userId = ((request as any).user as any)?.sub;
      const userRole = ((request as any).user as any)?.role;
      const isDispenser = userRole === RoleName.DISPENSER;
      let dispenserWithRelations: Dispenser | null = null;

      if (!userId) {
        throw new UnauthorizedException('Unable to determine dispensing user.');
      }

      const runner = async (manager: EntityManager) => {
        const emergencyPatient = await manager.findOne(EmergencyPatient, {
          where: { id: dispenserDto.emergency_patient_id },
          relations: ['facility'],
        });

        if (!emergencyPatient) {
          throw new NotFoundException(
            `Emergency patient with ID ${dispenserDto.emergency_patient_id} not found in transaction`,
          );
        }

        const facilityId = emergencyPatient.facility?.id;
        if (!facilityId) {
          throw new BadRequestException(
            'Unable to determine facility for the emergency patient.',
          );
        }

        const operatingUser = new User();
        operatingUser.id = userId;

        const existingDispenser = await manager.findOne(Dispenser, {
          where: { emergencyPatient: { id: emergencyPatient.id } },
          loadEagerRelations: false,
        });

        const dispenser =
          existingDispenser ??
          manager.create(Dispenser, {
            remarks: dispenserDto.remarks,
            otcMedRequired: dispenserDto.otcMedRequired,
          });

        if (existingDispenser) {
          if (dispenserDto.remarks !== undefined) {
            dispenser.remarks = dispenserDto.remarks;
          }
          dispenser.updatedBy = operatingUser;
        } else {
          dispenser.dispensedBy = operatingUser;
          dispenser.createdBy = operatingUser;
        }

        dispenser.emergencyPatient = emergencyPatient;
        dispenser.facility =
          emergencyPatient.facility || ({ id: facilityId } as Facility);

        const dispenseItems: DispenseItem[] = [];
        const dispensedPrescriptions: Prescription[] = [];

        // Process each prescription item
        for (const itemDto of dispenserDto.items ?? []) {
          const prescription = await this.findPrescriptionForDispensing(
            manager,
            itemDto.prescription_id,
            emergencyPatient.id,
          );

          if (!prescription) {
            throw new NotFoundException(
              `Prescription with id ${itemDto.prescription_id} not found for this emergency patient`,
            );
          }

          const variant = prescription.medicineVariant;
          if (!variant) {
            throw new NotFoundException(
              `Medicine variant not found for prescription ${itemDto.prescription_id}`,
            );
          }

          // Calculate desired quantity
          const desiredQuantity = this.serviceUtility.calculateDesiredQuantity(
            variant,
            prescription,
          );

          if (desiredQuantity <= 0) {
            throw new BadRequestException(
              'Desired quantity must be greater than zero',
            );
          }

          let dispenseItemBatch: MedicineBatch | undefined;

          // ONLY DOCTOR STOCK DEDUCTION (No facility/batch deduction)
          if (!isDispenser) {
            const doctorStock = await manager.findOne(DoctorMedicineStock, {
              where: {
                doctor: { id: operatingUser.id },
                facility: { id: facilityId },
                medicineVariant: { id: variant.id },
              },
            });

            if (!doctorStock) {
              throw new NotFoundException(
                `Medicine ${variant.medicine?.name} not found in your stock. Please request commodity from store.`,
              );
            }

            if (doctorStock.quantity < desiredQuantity) {
              throw new BadRequestException(
                `Requested ${desiredQuantity} ${variant.medicine?.name}, only ${doctorStock.quantity} available in your stock`,
              );
            }

            // ✅ ONLY THIS DEDUCTION HAPPENS
            doctorStock.quantity -= desiredQuantity;
            doctorStock.updatedBy = operatingUser;
            await manager.save(doctorStock);

            // Just get a batch reference for dispense item
            const medicineBatches =
              variant.batches?.filter(
                (batch) => batch.facility?.id === facilityId,
              ) ?? [];

            if (medicineBatches.length > 0) {
              dispenseItemBatch = medicineBatches[0];
            }
          } else {
            throw new BadRequestException(
              'Emergency dispensing should be done by doctors only, not dispensers',
            );
          }

          // Create dispense item
          const dispenseItemData: Partial<DispenseItem> = {
            medicineVariant: variant,
            dispensed_qty: desiredQuantity,
            required_qty: desiredQuantity,
            otc: false,
            batch: dispenseItemBatch,
            medicineDosage: prescription.medicineDosage,
            medicineDuration: prescription.medicineDuration,
          };

          const dispenseItem = manager.create(DispenseItem, dispenseItemData);
          dispenseItem.dispense = dispenser;
          dispenseItem.createdBy = operatingUser;
          dispenseItems.push(dispenseItem);

          // Mark prescription as dispensed
          prescription.medicineDispensed = true;
          prescription.updatedBy = operatingUser;
          dispensedPrescriptions.push(prescription);
        }

        // Save dispensed prescriptions
        if (dispensedPrescriptions.length) {
          await this.markPrescriptionsDispensed(
            manager,
            dispensedPrescriptions,
            operatingUser,
          );
        }

        // Process OTC items (same logic - doctor stock only)
        if (dispenserDto.otc_items?.length) {
          const otcDispenseItems = await this.processOtcItemsForEmergency(
            manager,
            dispenserDto.otc_items,
            dispenser,
            operatingUser,
            emergencyPatient,
            facilityId,
            isDispenser,
          );
          dispenseItems.push(...otcDispenseItems);
        }

        if (dispenseItems.length) {
          dispenser.items = dispenseItems;
        }

        // Save dispenser
        const savedDispenser = await manager.save(dispenser);

        // Fetch with relations
        dispenserWithRelations = await this.findDispenserResponse(
          manager,
          savedDispenser.id,
          true,
        );

        return dispenserWithRelations;
      };

      if (transactionalEntityManager) {
        dispenserWithRelations = await runner(transactionalEntityManager);
      } else {
        await this.dispenserRepository.manager.transaction(async (manager) => {
          dispenserWithRelations = await runner(manager);
        });
      }

      return successResponse(
        dispenserWithRelations,
        'Emergency dispenser created successfully',
        201,
      );
    } catch (error) {
      this.logger.error('Emergency dispenser creation failed', error.stack);
      throw ExceptionUtility.generateException(
        error,
        'Emergency dispenser creation failed',
      );
    }
  }

  private async processOtcItemsForEmergency(
    transactionalEntityManager: EntityManager,
    otcItems: OtcDto[],
    dispenser: Dispenser,
    operatingUser: User,
    emergencyPatient: any,
    facilityId: number,
    isDispenser: boolean,
  ): Promise<DispenseItem[]> {
    const otcDispenseItems: DispenseItem[] = [];

    for (const otcItem of otcItems) {
      const variant = await transactionalEntityManager.findOne(
        MedicineVariant,
        {
          where: {
            id: otcItem.medicine_variant_id,
          },
          relations: ['batches', 'batches.facility', 'medicine'],
        },
      );

      if (!variant) {
        throw new NotFoundException(
          `OTC medicine variant ${otcItem.medicine_variant_id} not found`,
        );
      }

      const medicineCount = await transactionalEntityManager.findOne(
        MedicineCount,
        {
          where: {
            medicineVariantId: variant.id,
            facilityId,
            otc: true,
          },
        },
      );

      if (!medicineCount) {
        throw new NotFoundException(
          `OTC ${this.formatMedicineVariantLabel(variant)} not found in medicine count`,
        );
      }

      const desiredQuantity = otcItem.quantity;
      let dispenseItemBatch: MedicineBatch | undefined;

      if (!isDispenser) {
        const doctorStock = await transactionalEntityManager.findOne(
          DoctorMedicineStock,
          {
            where: {
              doctor: { id: operatingUser.id },
              facility: { id: facilityId },
              medicineVariant: { id: variant.id },
            },
          },
        );

        if (!doctorStock) {
          throw new NotFoundException(
            `OTC Medicine ${variant.medicine?.name} not found in your stock`,
          );
        }

        if (doctorStock.quantity < desiredQuantity) {
          throw new BadRequestException(
            `Requested ${desiredQuantity} OTC ${variant.medicine?.name}, only ${doctorStock.quantity} available in your stock`,
          );
        }

        //  Only deduct from doctor stock
        doctorStock.quantity -= desiredQuantity;
        doctorStock.updatedBy = operatingUser;
        await transactionalEntityManager.save(doctorStock);

        // Get batch reference only
        const medicineBatches =
          variant.batches?.filter(
            (batch) => batch.facility?.id === facilityId,
          ) ?? [];

        if (medicineBatches.length > 0) {
          dispenseItemBatch = medicineBatches[0];
        }
      } else {
        throw new BadRequestException(
          'Emergency OTC dispensing should be done by doctors only',
        );
      }

      // Create OTC dispense item
      const dispenseItemData: Partial<DispenseItem> = {
        medicineVariant: variant,
        dispensed_qty: desiredQuantity,
        required_qty: desiredQuantity,
        otc: true,
        batch: dispenseItemBatch,
      };

      const dispenseItem = transactionalEntityManager.create(
        DispenseItem,
        dispenseItemData,
      );
      dispenseItem.dispense = dispenser;
      dispenseItem.createdBy = operatingUser;
      otcDispenseItems.push(dispenseItem);
    }

    return otcDispenseItems;
  }
}
