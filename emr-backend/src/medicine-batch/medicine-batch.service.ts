import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { MedicineCount } from './entities/medicine-count.entity';
import { DispenseItem } from 'src/dispenser/entities/dispense-item.entity';
import { AddMedicineBatchDto } from './dto/add-medicine-batch.dto';
import { UpdateMedicineBatchDto } from './dto/update-medicine-batch.dto';
import { GetMedicineBatchFilterDto } from './dto/get-medicine-batch-filter.dto';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ApiResponseMessages } from 'src/common/api-messages.constants';
import { MedicineStatus, RoleName } from 'src/common/enums/enums';
import { MEDICINE_THRESHOLD, TIME_DIFF } from 'src/common/app.constants';
import { User } from 'src/users/entities/user.entity';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { MedicineBatchResponseDto } from './dto/medicine-batch-response.dto';

@Injectable()
export class MedicineBatchService {
  private readonly logger: Logger = new Logger(MedicineBatchService.name);

  constructor(
    @InjectRepository(MedicineBatch)
    private readonly medicineBatchRepository: Repository<MedicineBatch>,
    @InjectRepository(DispenseItem)
    private readonly dispenseItemRepository: Repository<DispenseItem>,
    private readonly dataSource: DataSource,
  ) { }

  async create(
    addMedicineBatchDtos: AddMedicineBatchDto[],
    role: string,
    userFacilityId: number,
    currentUserId: number,
  ): Promise<MedicineBatch[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedBatches: MedicineBatch[] = [];

      // Process each batch in the array
      for (const addMedicineBatchDto of addMedicineBatchDtos) {
        const facilityId = this.getFacilityId(role, addMedicineBatchDto.facilityId, userFacilityId);

        const medicineBatch = this.medicineBatchRepository.create();

        // Set relations
        medicineBatch.variant = { id: addMedicineBatchDto.variantId } as any;
        medicineBatch.facility = { id: facilityId } as any;
        medicineBatch.medicine = { id: addMedicineBatchDto.medicineId } as any;

        medicineBatch.batch_number = addMedicineBatchDto.batchNumber;
        medicineBatch.expiry_date = new Date(addMedicineBatchDto.expiryDate);

        if (addMedicineBatchDto.purchaseDate) {
          medicineBatch.purchase_date = new Date(addMedicineBatchDto.purchaseDate);
        }

        medicineBatch.stock_quantity = addMedicineBatchDto.stockQuantity;
        medicineBatch.status = MedicineStatus.ACTIVE;
        medicineBatch.createdBy = { id: currentUserId } as User;

        const savedBatch = await queryRunner.manager.save(medicineBatch);
        savedBatches.push(savedBatch);

        // Update medicine count within the transaction
        await this.updateMedicineCountInTransaction(
          queryRunner,
          addMedicineBatchDto.medicineId,
          addMedicineBatchDto.variantId,
          facilityId,
          addMedicineBatchDto.stockQuantity,
          addMedicineBatchDto.limitQuantity,
          addMedicineBatchDto.otc,
        );
      }

      await queryRunner.commitTransaction();

      return savedBatches;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error creating medicine batches:', error);
      ExceptionUtility.generateException(
        error,
        ApiResponseMessages.MEDICINE_BATCH_CREATE_ERROR,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ): Promise<MedicineBatchResponseDto> {
    const batch = await this.medicineBatchRepository
      .createQueryBuilder('batch')
      .select([
        'batch.id',
        'batch.batch_number',
        'batch.expiry_date',
        'batch.purchase_date',
        'batch.stock_quantity',
        'batch.status',
        'batch.createdAt',
        'batch.updatedAt',
        'batch.facility_id',
        'variant.id',
        'variant.unit',
        'variant.strength',
        'medicineCount.otc',
        'medicineCount.limit_quantity',
        'facility.id',
        'facility.name',
        'medicine.id',
        'medicine.name',
      ])
      .leftJoin('batch.variant', 'variant')
      .leftJoin(
        'variant.medicineCount',
        'medicineCount',
        'medicineCount.facility_id = batch.facility_id',
      )
      .leftJoin('batch.facility', 'facility')
      .leftJoin('batch.medicine', 'medicine')
      .where('batch.id = :id', { id })
      .getOne();

    if (!batch) {
      throw new NotFoundException(ApiResponseMessages.MEDICINE_BATCH_NOT_FOUND);
    }

    this.checkFacilityAccess(batch as MedicineBatch, user);

    return {
      ...batch,
      isEditable: this.isEditable(batch, user),
      isDeletable: this.isDeletable(batch, user),
    } as MedicineBatchResponseDto;
  }

  private async findBatchEntity(
    id: number,
  ): Promise<Omit<MedicineBatch, 'dispenseItems'>> {
    const batch = await this.medicineBatchRepository.findOne({
      where: { id },
      relations: {
        facility: true,
        medicine: true,
        variant: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(ApiResponseMessages.MEDICINE_BATCH_NOT_FOUND);
    }

    return batch;
  }

  private isWithinTimeLimit(createdAt: Date, user: AuthenticatedUser): boolean {
    if (user.role === RoleName.SUPER_ADMIN) return true;

    const timeDifferenceInHours =
      ExceptionUtility.timeDifferenceInHoursFromCreation(createdAt);

    return timeDifferenceInHours < TIME_DIFF;
  }

  private isEditable(batch: MedicineBatch, user: AuthenticatedUser): boolean {
    if (user.role === RoleName.SUPER_ADMIN) return true;
    if (!this.isWithinTimeLimit(batch.createdAt, user)) return false;

    return batch.facility.id === user.facilityId;
  }

  private isDeletable(batch: MedicineBatch, user: AuthenticatedUser): boolean {
    return this.isEditable(batch, user);
  }

  private checkFacilityAccess(
    batch: Omit<MedicineBatch, 'dispenseItems'>,
    user: AuthenticatedUser,
  ): void {
    if (user.role === RoleName.SUPER_ADMIN) return;
    if (batch.facility.id !== user.facilityId) {
      throw new ForbiddenException(
        ApiResponseMessages.MEDICINE_BATCH_FACILITY_ACCESS,
      );
    }
  }

  async update(
    id: number,
    updateDto: UpdateMedicineBatchDto,
    user: AuthenticatedUser,
  ): Promise<MedicineBatchResponseDto> {
    const batch = await this.findBatchEntity(id);

    this.checkFacilityAccess(batch, user);

    if (!this.isWithinTimeLimit(batch.createdAt, user)) {
      throw new ConflictException(
        ApiResponseMessages.MEDICINE_BATCH_TIME_LIMIT,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updateDto.stockQuantity !== batch.stock_quantity) {
        await this.updateStockQuantity(
          queryRunner,
          batch,
          updateDto.stockQuantity,
        );
      }

      await this.updateMedicineCountMetadata(
        queryRunner,
        batch,
        updateDto.otc,
        updateDto.limitQuantity,
      );

      // update batch fields
      batch.batch_number = updateDto.batchNumber;
      batch.expiry_date = new Date(updateDto.expiryDate);
      batch.purchase_date = new Date(updateDto.purchaseDate);
      batch.stock_quantity = updateDto.stockQuantity;
      batch.updatedBy = { id: user.sub } as User;

      await queryRunner.manager.save(batch);
      await queryRunner.commitTransaction();

      return this.findOne(id, user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error updating medicine batch:', error);
      ExceptionUtility.generateException(
        error,
        ApiResponseMessages.MEDICINE_BATCH_UPDATE_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(
    id: number,
    user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const batch = await this.findBatchEntity(id);

    this.checkFacilityAccess(batch, user);

    if (!this.isWithinTimeLimit(batch.createdAt, user)) {
      throw new ConflictException(
        ApiResponseMessages.MEDICINE_BATCH_TIME_LIMIT,
      );
    }

    const dispensedCount = await this.dispenseItemRepository
      .createQueryBuilder('dispenseItem')
      .select('COUNT(dispenseItem.id)', 'count')
      .where('dispenseItem.batch_id = :batchId', { batchId: batch.id })
      .getRawOne();

    if (Number(dispensedCount?.count ?? 0) > 0) {
      throw new BadRequestException(
        ApiResponseMessages.MEDICINE_BATCH_HAS_DISPENSED_ITEMS,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const medicineCount = await queryRunner.manager.findOne(MedicineCount, {
        where: {
          medicineId: batch.medicine.id,
          medicineVariantId: batch.variant.id,
          facilityId: batch.facility.id,
        },
      });

      if (medicineCount) {
        /**
         * stock_quantity is the quantity received; MedicineCount.count is the running
         * balance, net of dispenses and approved commodity requests.
         *
         * Deleting removes the full batch quantity from the count, so if count is lower
         * than stock_quantity, part of this batch has already been issued.
         *
         * Unlike dispense_items, commodity_request_items do not track batch_id, so this
         * can only be enforced per medicine variant and facility, not per batch.
         */
        if (medicineCount.count < batch.stock_quantity) {
          throw new BadRequestException(
            ApiResponseMessages.MEDICINE_BATCH_DELETE_STOCK_ISSUED,
          );
        }

        medicineCount.count -= batch.stock_quantity;
        await queryRunner.manager.save(medicineCount);
      }

      await queryRunner.manager.remove(batch);
      await queryRunner.commitTransaction();

      return { success: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error deleting medicine batch:', error);
      ExceptionUtility.generateException(
        error,
        ApiResponseMessages.MEDICINE_BATCH_DELETE_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async updateStockQuantity(
    queryRunner: QueryRunner,
    batch: Omit<MedicineBatch, 'dispenseItems'>,
    newStockQuantity: number,
  ): Promise<void> {
    const totalDispensed = await this.dispenseItemRepository
      .createQueryBuilder('dispenseItem')
      .select('COALESCE(SUM(dispenseItem.dispensed_qty), 0)', 'total')
      .where('dispenseItem.batch_id = :batchId', { batchId: batch.id })
      .getRawOne();

    const dispensed = Number(totalDispensed?.total ?? 0);

    if (newStockQuantity < dispensed) {
      throw new BadRequestException(
        `${ApiResponseMessages.MEDICINE_BATCH_STOCK_BELOW_DISPENSED} (${dispensed}) from this batch.`,
      );
    }

    const adjustment = newStockQuantity - batch.stock_quantity;

    const medicineCount = await queryRunner.manager.findOne(MedicineCount, {
      where: {
        medicineId: batch.medicine.id,
        medicineVariantId: batch.variant.id,
        facilityId: batch.facility.id,
      },
    });

    if (medicineCount) {
      /**
       * stock_quantity is the quantity received; MedicineCount.count is the running
       * balance, net of dispenses and approved commodity requests.
       *
       * A reduction must not exceed the remaining count, otherwise the count
       * would become negative (i.e. the new stock would be lower than what has
       * already been issued).
       *
       * Unlike dispense_items, commodity_request_items do not track batch_id, so this
       * can only be enforced per medicine variant and facility, not per batch.
       */
      const alreadyIssued = batch.stock_quantity - medicineCount.count;

      if (adjustment < 0 && newStockQuantity < alreadyIssued) {
        throw new BadRequestException(
          `${ApiResponseMessages.MEDICINE_BATCH_STOCK_ISSUED_VIA_REQUESTS} (${alreadyIssued}).`,
        );
      }

      medicineCount.count += adjustment;
      await queryRunner.manager.save(medicineCount);
    }
  }

  private async updateMedicineCountMetadata(
    queryRunner: QueryRunner,
    batch: Omit<MedicineBatch, 'dispenseItems'>,
    otc: boolean,
    limitQuantity?: number,
  ): Promise<void> {
    const medicineCount = await queryRunner.manager.findOne(MedicineCount, {
      where: {
        medicineId: batch.medicine.id,
        medicineVariantId: batch.variant.id,
        facilityId: batch.facility.id,
      },
    });

    if (medicineCount) {
      medicineCount.otc = otc;

      if (otc && limitQuantity !== undefined) {
        medicineCount.limit_quantity = limitQuantity;
      } else if (!otc) {
        medicineCount.limit_quantity = null;
      }

      await queryRunner.manager.save(medicineCount);
    }
  }

  private getFacilityId(role: string, dtoFacilityId: number | undefined, userFacilityId: number): number {
    if (role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN) {
      if (dtoFacilityId === undefined) {
        throw new BadRequestException('facilityId is required for Admin and Super Admin roles');
      }
      // Admin or Super Admin can specify facilityId
      return dtoFacilityId;
    } else {
      // All other roles use their own facility
      return userFacilityId;
    }
  }

  private async updateMedicineCountInTransaction(
    queryRunner: any,
    medicineId: number,
    variantId: number,
    facilityId: number,
    stockQuantity: number,
    limitQuantity?: number,
    otc?: boolean,
  ): Promise<void> {
    try {
      // Find existing medicine count record
      const existingCount = await queryRunner.manager.findOne(MedicineCount, {
        where: {
          medicineId,
          medicineVariantId: variantId,
          facilityId,
        },
      });

      if (existingCount) {
        // Update existing count by adding the new stock quantity
        existingCount.count += stockQuantity;
        if (limitQuantity !== undefined) {
          existingCount.limit_quantity = limitQuantity;
        }
        if (otc !== undefined) {
          existingCount.otc = otc;
        }
        if (existingCount.email_threshold === null || existingCount.email_threshold === undefined) {
          existingCount.email_threshold = MEDICINE_THRESHOLD;
        }
        await queryRunner.manager.save(existingCount);
      } else {
        // Create new medicine count record
        const newCount = queryRunner.manager.create(MedicineCount, {
          medicineId,
          medicineVariantId: variantId,
          facilityId,
          count: stockQuantity,
          otc: otc ?? false,
          limit_quantity: limitQuantity ?? null,
          email_threshold: MEDICINE_THRESHOLD,
        });
        await queryRunner.manager.save(newCount);
      }
    } catch (error) {
      this.logger.error('Error updating medicine count:', error);
      throw error;
    }
  }

  async findAll(
    user: AuthenticatedUser,
    filterDto: GetMedicineBatchFilterDto,
  ): Promise<{
    data: (MedicineBatch & { isEditable: boolean; isDeletable: boolean })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 10, facilityId, medicineId, contraceptive } = filterDto;
      const role = user.role;
      const userFacilityId = user.facilityId;

      const queryBuilder = this.medicineBatchRepository
        .createQueryBuilder('medicineBatch')
        .leftJoinAndSelect('medicineBatch.variant', 'variant')
        .leftJoinAndSelect(
          'variant.medicineCount',
          'medicineCount',
          'medicineCount.facility_id = medicineBatch.facility_id AND medicineCount.medicine_id = medicineBatch.medicine_id',
        )
        .leftJoinAndSelect('medicineBatch.facility', 'facility')
        .leftJoinAndSelect('medicineBatch.medicine', 'medicine');

      // Apply role-based filtering
      if (role === RoleName.SUPER_ADMIN || role === RoleName.ADMIN) {
        // Admin and Super Admin can see all batches
        // Apply facility filter if provided
        if (facilityId) {
          queryBuilder.andWhere('medicineBatch.facility.id = :facilityId', { facilityId });
        }
      } else if (role === RoleName.FACILITY_INCHARGE || role === RoleName.DISPENSER) {
        // Facility Incharge and Dispenser can only see batches from their facility
        queryBuilder.andWhere('medicineBatch.facility.id = :userFacilityId', { userFacilityId });
      } else {
        // Regular users - no access (return empty)
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      // Apply medicine filter if provided
      if (medicineId) {
        queryBuilder.andWhere('medicineBatch.medicine.id = :medicineId', { medicineId });
      }

      if (contraceptive !== undefined) {
        queryBuilder.andWhere('medicine.contraceptive = :contraceptive', { contraceptive });
      }

      // Apply ordering and pagination
      queryBuilder
        .orderBy('medicineBatch.updatedAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      const dataWithFlags = data.map((batch) => ({
        ...batch,
        isEditable: this.isEditable(batch, user),
        isDeletable: this.isDeletable(batch, user),
      }));

      return {
        data: dataWithFlags,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Error fetching medicine batches:', error);
      ExceptionUtility.generateException(
        error,
        'Failed to fetch medicine batches',
      );
      throw error;
    }
  }
}
