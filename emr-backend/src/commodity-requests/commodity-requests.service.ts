import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { CommodityRequest } from './entities/commodity-request.entity';
import { CommodityRequestItem } from './entities/commodity-request-item.entity';
import { CreateCommodityRequestDto } from './dto/create-commodity-request.dto';
import {
  MedicineVariantInfo,
  RequestResponseDto,
  RequestItemResponseDto,
} from './dto/request-response.dto';
import { FilterRequestDto } from './dto/filter-request.dto';
import { UpdateCommodityRequestStatusDto } from './dto/update-commodity-request.dto';
import { IssuedTo, RequestStatus, RoleName } from 'src/common/enums/enums';
import { MedicineInventoryResponseDto } from './dto/inventory-response.dto';
import { RequestStatisticsDto } from './dto/statistics-response.dto';
import { User } from 'src/users/entities/user.entity';
import { DoctorMedicineStock } from 'src/medicine/entities/doctor-medicine-stock.entity';
import { Role } from 'src/roles/entities/role.entity';
import { MedicineCount } from 'src/medicine-batch/entities/medicine-count.entity';
import { Facility } from 'src/facilities/entities/facility.entity';

@Injectable()
export class CommodityRequestService {
  constructor(
    @InjectRepository(CommodityRequest)
    private readonly requestRepository: Repository<CommodityRequest>,
    @InjectRepository(CommodityRequestItem)
    private readonly requestItemRepository: Repository<CommodityRequestItem>,
    @InjectRepository(MedicineVariant)
    private readonly medicineVariantRepository: Repository<MedicineVariant>,
    @InjectRepository(MedicineBatch)
    private readonly medicineBatchRepository: Repository<MedicineBatch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DoctorMedicineStock)
    private readonly doctorStockRepository: Repository<DoctorMedicineStock>,
    @InjectRepository(MedicineCount)
    private readonly medicineCountRepository: Repository<MedicineCount>,
  ) {}

  async createCommodityRequest(
    dto: CreateCommodityRequestDto,
    req: Request,
  ): Promise<RequestResponseDto> {
    const userId = (req as any)?.user?.sub;

    const requestUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'facility'],
    });

    if (!requestUser) {
      throw new NotFoundException('User not found');
    }

    const requestUserRole = requestUser.role.name;

    if (requestUserRole === RoleName.DISPENSER) {
      throw new BadRequestException(
        'Dispenser cannot raise commodity requests',
      );
    }

    if (!requestUser.facility?.id) {
      throw new BadRequestException(
        'Requester must be assigned to a facility',
      );
    }

    const variantIds = dto.items.map((item) => item.medicineVariantId);

    const variants = await this.medicineVariantRepository.find({
      where: { id: In(variantIds) },
      relations: ['medicine'],
    });

    if (variants.length !== variantIds.length) {
      throw new NotFoundException('One or more medicine variants not found');
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const dispenserUser = await this.userRepository.findOne({
      where: {
        role: {
          name: RoleName.DISPENSER,
        },
        facility: {
          id: requestUser.facility.id,
        },
      },
      relations: ['role', 'facility'],
      order: { id: 'ASC' },
    });

    if (!dispenserUser) {
      throw new NotFoundException(
        'No dispenser found for requester facility',
      );
    }

    const dispenserUserId = dispenserUser.id;

    const request = this.requestRepository.create({
      initiatorRole: requestUserRole,
      requesterId: userId,
      facilityId: requestUser.facility.id,
      requesterName: requestUserRole,
      notes: dto.notes,
      status: RequestStatus.PENDING,
      issuedTo: IssuedTo.DISPENSER,
      issuedToStaffId: dispenserUserId,
    });

    request.items = dto.items.map((itemDto) => {
      const medicineVariant = variantMap.get(itemDto.medicineVariantId);
      if (!medicineVariant) {
        throw new NotFoundException(
          `Medicine variant id: ${itemDto.medicineVariantId} not found`,
        );
        ``;
      }

      const item = new CommodityRequestItem();
      item.medicineVariant = medicineVariant;
      item.medicineVariantId = medicineVariant.id;
      item.quantityRequested = itemDto.quantityRequested;
      item.status = RequestStatus.PENDING;
      item.purpose = itemDto.purpose;

      return item;
    });

    const savedRequest: CommodityRequest =
      await this.requestRepository.save(request);

    const reloadedRequest = await this.requestRepository.findOne({
      where: { id: savedRequest.id },
      relations: [
        'items',
        'items.medicineVariant',
        'items.medicineVariant.medicine',
      ],
    });

    if (!reloadedRequest) {
      throw new NotFoundException('Failed to reload saved request');
    }

    return this.mapToResponseDto(reloadedRequest);
  }

  async getRequests(
    filters: FilterRequestDto,
    req: Request,
  ): Promise<RequestResponseDto[]> {
    const userId = (req as any)?.user?.sub;

    const requestUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'facility'],
    });

    if (!requestUser) {
      throw new NotFoundException('User not found');
    }

    const requestUserRole = requestUser.role.name;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.items', 'item')
      .leftJoinAndSelect('item.medicineVariant', 'variant')
      .leftJoinAndSelect('variant.medicine', 'medicine');

    this.applyCommodityRequestAccessScope(queryBuilder, requestUser);

    if (filters.status) {
      queryBuilder.andWhere('request.status = :status', {
        status: filters.status,
      });
    }

    if (filters.initiatorRole) {
      queryBuilder.andWhere('request.initiatorRole = :initiatorRole', {
        initiatorRole: filters.initiatorRole,
      });
    }

    if (filters.requesterId) {
      queryBuilder.andWhere('request.requesterId = :requesterId', {
        requesterId: filters.requesterId,
      });
    }

    if (filters.facilityId) {
      queryBuilder.andWhere('request.facilityId = :filterFacilityId', {
        filterFacilityId: filters.facilityId,
      });
    }

    if (filters.medicineId) {
      queryBuilder.andWhere('medicine.id = :medicineId', {
        medicineId: filters.medicineId,
      });
    }

    if (filters.medicineVariantId) {
      queryBuilder.andWhere('item.medicineVariantId = :medicineVariantId', {
        medicineVariantId: filters.medicineVariantId,
      });
    }

    if (filters.contraceptiveOnly) {
      queryBuilder.andWhere('medicine.contraceptive = :contraceptive', {
        contraceptive: true,
      });
    }

    if (filters.medicineOnly) {
      queryBuilder.andWhere('medicine.contraceptive = :contraceptive', {
        contraceptive: false,
      });
    }

    if (filters.category) {
      queryBuilder.andWhere('medicine.category = :category', {
        category: filters.category,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'request.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(medicine.name LIKE :search OR medicine.generic_name LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.orderBy('request.createdAt', 'DESC');

    const requests = await queryBuilder.getMany();
    return requests.map((request) => this.mapToResponseDto(request));
  }

  async getRequestById(id: number, req: Request): Promise<RequestResponseDto> {
    const userId = (req as any)?.user?.sub;

    const requestUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'facility'],
    });

    if (!requestUser) {
      throw new NotFoundException('User not found');
    }

    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.items', 'item')
      .leftJoinAndSelect('item.medicineVariant', 'variant')
      .leftJoinAndSelect('variant.medicine', 'medicine')
      .where('request.id = :id', { id });

    this.applyCommodityRequestAccessScope(queryBuilder, requestUser);

    const request = await queryBuilder.getOne();

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    return this.mapToResponseDto(request);
  }

  async getRequestsByRequester(
    requesterId: number,
    req: Request,
  ): Promise<RequestResponseDto[]> {
    return this.getRequests({ requesterId }, req);
  }

  async updateRequestStatus(
    id: number,
    dto: UpdateCommodityRequestStatusDto,
    req: Request,
  ): Promise<RequestResponseDto> {
    const userId = (req as any)?.user?.sub;

    const requestUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'facility'],
    });

    if (!requestUser) {
      throw new NotFoundException('Requested user not found');
    }

    const requestUserRole = requestUser?.role.name;

    if (!this.canProcessCommodityRequests(requestUserRole)) {
      throw new BadRequestException(
        'Only dispensers and admin-level users can process requests',
      );
    }

    const request = await this.requestRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.medicineVariant',
        'items.medicineVariant.medicine',
      ],
    });

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be updated');
    }

    for (const itemUpdate of dto.items) {
      const item = request.items.find((i) => i.id === itemUpdate.itemId);

      if (!item) {
        throw new NotFoundException(
          `Item with ID ${itemUpdate.itemId} not found in request`,
        );
      }

      if (
        itemUpdate.quantityDispensed !== undefined &&
        itemUpdate.quantityDispensed > item.quantityRequested
      ) {
        throw new BadRequestException(
          `Quantity dispensed (${itemUpdate.quantityDispensed}) cannot exceed quantity requested (${item.quantityRequested}) for item ${item.id}`,
        );
      }

      if (itemUpdate.status === RequestStatus.APPROVED) {
        await this.validateInventoryAvailability(
          item.medicineVariant.medicine.name,
          item.medicineVariantId,
          itemUpdate.quantityDispensed || item.quantityRequested,
          requestUser.facility,
        );
      }

      item.status = itemUpdate.status;

      if (itemUpdate.quantityDispensed !== undefined) {
        item.quantityDispensed = itemUpdate.quantityDispensed;
      } else if (itemUpdate.status === RequestStatus.APPROVED) {
        item.quantityDispensed = item.quantityRequested;
      }

      if (itemUpdate.notes) {
        item.notes = itemUpdate.notes;
      }

      if (
        itemUpdate.status === RequestStatus.APPROVED &&
        item.quantityDispensed &&
        item.quantityDispensed < item.quantityRequested
      ) {
        item.status = RequestStatus.PARTIALLY_FULFILLED;
      }

      await this.requestItemRepository.save(item);

      if (
        item.status === RequestStatus.APPROVED ||
        item.status === RequestStatus.PARTIALLY_FULFILLED
      ) {
        await this.updateInventoryAndAddToDoctorStock(
          item.medicineVariant.medicine.name,
          item.medicineVariantId,
          item.quantityDispensed || item.quantityRequested,
          requestUser,
          request.requesterId,
        );
      }
    }

    request.status = dto.status;
    request.processedById = requestUser.id;
    request.processedAt = new Date();
    request.issuedToStaffId = request.requesterId;
    request.issuedTo = this.getIssuedToFromRole(request.requesterName);

    if (dto.rejectionReason) {
      request.rejectionReason = dto.rejectionReason;
    }

    if (dto.notes) {
      request.notes = dto.notes;
    }

    const itemStatuses = request.items.map((i) => i.status);
    const allApproved = itemStatuses.every((s) => s === RequestStatus.APPROVED);
    const allRejected = itemStatuses.every((s) => s === RequestStatus.REJECTED);
    const hasPartial = itemStatuses.some(
      (s) => s === RequestStatus.PARTIALLY_FULFILLED,
    );

    if (allApproved) {
      request.status = RequestStatus.APPROVED;
    } else if (allRejected) {
      request.status = RequestStatus.REJECTED;
    } else if (
      hasPartial ||
      itemStatuses.some((s) => s === RequestStatus.APPROVED)
    ) {
      request.status = RequestStatus.PARTIALLY_FULFILLED;
    }

    request.approvedBy = this.getApprovedByValue(request.status, requestUser);

    if (request.status === RequestStatus.REJECTED) {
      request.rejectedBy = this.getUserDisplayName(requestUser);
    }

    const updatedRequest = await this.requestRepository.save(request);
    return this.mapToResponseDto(updatedRequest);
  }

  private async validateInventoryAvailability(
    medicineName: string,
    variantId: number,
    quantity: number,
    facility: Facility,
  ): Promise<void> {
    const medicineCount = await this.medicineCountRepository.findOne({
      where: {
        medicineVariantId: variantId,
        facility: { id: facility.id },
      },
    });

    if (!medicineCount) {
      throw new NotFoundException(
        `${medicineName} not found`,
      );
    }

    if (medicineCount?.count < quantity) {
      throw new BadRequestException(
        `Insufficient inventory for variant ${variantId} ${medicineName} . Available: ${medicineCount.count}, Requested: ${quantity}`,
      );
    }
  }

  private async updateInventoryAndAddToDoctorStock(
    medicineName: string,
    variantId: number,
    quantity: number,
    resquetUser: User,
    issuedToId: number,
  ): Promise<void> {
    const medicineCount = await this.medicineCountRepository.findOne({
      where: {
        medicineVariantId: variantId,
        facility: { id: resquetUser.facility.id },
      },
      relations: ['medicine'],
    });
    if (!medicineCount) {
      throw new NotFoundException(
        `${medicineName} not found`,
      );
    }

    medicineCount.count -= quantity;
    await this.medicineCountRepository.save(medicineCount);

    await this.doctorStockRepository.save(
      await this.doctorStockRepository.create({
        doctor: { id: issuedToId },
        facility: { id: resquetUser.facility.id },
        medicineVariant: { id: variantId },
        quantity,
      }),
    );
  }

  async getMedicineInventory(
    req: Request,
    contraceptiveOnly?: boolean,
    name?: string,
  ): Promise<MedicineInventoryResponseDto[]> {
    const userId = (req as any)?.user?.sub;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const requestUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'facility'],
    });

    if (!requestUser) {
      throw new NotFoundException('User not found');
    }

    if (this.usesFacilityInventory(requestUser.role.name)) {
      const queryBuilder = this.medicineCountRepository
        .createQueryBuilder('medicineCount')
        .innerJoinAndSelect('medicineCount.medicineVariant', 'variant')
        .innerJoinAndSelect('medicineCount.medicine', 'medicine')
        .where('medicineCount.facility_id = :facilityId', {
          facilityId: requestUser.facility.id,
        })
        .andWhere('medicineCount.count > 0');

      if (name && name.trim()) {
        queryBuilder.andWhere('medicine.name ILIKE :name', {
          name: `%${name.trim()}%`,
        });
      }

      if (contraceptiveOnly !== undefined) {
        queryBuilder.andWhere('medicine.contraceptive = :contraceptive', {
          contraceptive: contraceptiveOnly,
        });
      }

      queryBuilder
        .orderBy('medicine.name', 'ASC')
        .addOrderBy('variant.strength', 'ASC');
      console.log(queryBuilder.getSql());
      const medicineCounts = await queryBuilder.getMany();
      const variantIds = medicineCounts.map((item) => item.medicineVariantId);
      const batchCountsRaw = variantIds.length
        ? await this.medicineBatchRepository
            .createQueryBuilder('batch')
            .select('batch.variant_id', 'variantId')
            .addSelect('COUNT(batch.id)', 'batchCount')
            .where('batch.facility_id = :facilityId', {
              facilityId: requestUser.facility.id,
            })
            .andWhere('batch.stock_quantity > 0')
            .andWhere('batch.expiry_date > :today', { today: new Date() })
            .andWhere('batch.variant_id IN (:...variantIds)', { variantIds })
            .groupBy('batch.variant_id')
            .getRawMany<{ variantId: string; batchCount: string }>()
        : [];
      const batchCountByVariant = new Map<number, number>(
        batchCountsRaw.map((item) => [
          Number(item.variantId),
          Number(item.batchCount),
        ]),
      );
      const medicineMap = new Map<number, MedicineInventoryResponseDto>();

      medicineCounts.forEach((medicineCount) => {
        const variant = medicineCount.medicineVariant;
        const medicine = medicineCount.medicine;
        const medicineId = medicine.id;

        if (!medicineMap.has(medicineId)) {
          medicineMap.set(medicineId, {
            medicineId,
            medicineName: medicine.name,
            genericName: medicine.generic_name,
            category: medicine.category,
            isContraceptive: medicine.contraceptive,
            variants: [],
          });
        }

        const medicineDto = medicineMap.get(medicineId)!;
        const existingVariant = medicineDto.variants.find(
          (item) => item.variantId === variant.id,
        );
        const availableBatches = batchCountByVariant.get(variant.id) ?? 0;

        if (existingVariant) {
          existingVariant.totalQuantity += medicineCount.count;
          existingVariant.availableBatches = Math.max(
            existingVariant.availableBatches,
            availableBatches,
          );
        } else {
          medicineDto.variants.push({
            variantId: variant.id,
            strength: variant.strength,
            unit: variant.unit,
            totalQuantity: medicineCount.count,
            availableBatches,
          });
        }
      });

      return Array.from(medicineMap.values());
    }

    const stocks = await this.doctorStockRepository
      .createQueryBuilder('stock')
      .innerJoinAndSelect('stock.medicineVariant', 'variant')
      .innerJoinAndSelect('variant.medicine', 'medicine')
      .where('stock.doctor_id = :doctorId', { doctorId: requestUser.id })
      .andWhere('stock.facility_id = :facilityId', {
        facilityId: requestUser.facility.id,
      })
      .andWhere('stock.quantity > 0');

    if (name && name.trim()) {
      stocks.andWhere('medicine.name ILIKE :name', {
        name: `%${name.trim()}%`,
      });
    }

    const stocksData = await stocks
      .orderBy('medicine.name', 'ASC')
      .addOrderBy('variant.strength', 'ASC')
      .getMany();

    const medicineMap = new Map<number, MedicineInventoryResponseDto>();

    stocksData.forEach((stock) => {
      const variant = stock.medicineVariant;
      const medicine = variant?.medicine;
      if (!variant || !medicine) return;

      const medicineId = medicine.id;
      const variantId = variant.id;

      // Initialize medicine in map if missing
      if (!medicineMap.has(medicineId)) {
        medicineMap.set(medicineId, {
          medicineId,
          medicineName: medicine.name ?? 'Unknown',
          genericName: medicine.generic_name,
          category: medicine.category ?? 'Unknown',
          isContraceptive: medicine.contraceptive ?? false,
          variants: [],
          totalQuantity: 0, // track total quantity per medicine
        } as MedicineInventoryResponseDto & { totalQuantity: number });
      }

      const medicineDto = medicineMap.get(
        medicineId,
      )! as MedicineInventoryResponseDto & { totalQuantity: number };

      // Aggregate medicine total
      medicineDto.totalQuantity += stock.quantity ?? 0;

      // Check if variant already exists
      let variantDto = medicineDto.variants.find(
        (v) => v.variantId === variantId,
      );
      if (variantDto) {
        variantDto.totalQuantity += stock.quantity ?? 0;
      } else {
        medicineDto.variants.push({
          variantId,
          strength: variant.strength ?? 'Unknown',
          unit: variant.unit ?? 'Unknown',
          totalQuantity: stock.quantity ?? 0,
          availableBatches: 1,
        });
      }
    });

    return Array.from(medicineMap.values());
  }

  async getContraceptiveInventory(
    req: Request,
  ): Promise<MedicineInventoryResponseDto[]> {
    return this.getMedicineInventory(req, true);
  }

  async getNonContraceptiveInventory(
    req: Request,
  ): Promise<MedicineInventoryResponseDto[]> {
    return this.getMedicineInventory(req, false);
  }

  async getRequestStatistics(
    requesterId?: number,
  ): Promise<RequestStatisticsDto> {
    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoin('request.items', 'item')
      .leftJoin('item.medicineVariant', 'variant')
      .leftJoin('variant.medicine', 'medicine');

    if (requesterId) {
      queryBuilder.where('request.requesterId = :requesterId', { requesterId });
    }

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      partiallyFulfilledRequests,
      contraceptiveRequests,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere('request.status = :status', { status: RequestStatus.PENDING })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('request.status = :status', {
          status: RequestStatus.APPROVED,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('request.status = :status', {
          status: RequestStatus.REJECTED,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('request.status = :status', {
          status: RequestStatus.PARTIALLY_FULFILLED,
        })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('medicine.contraceptive = :contraceptive', {
          contraceptive: true,
        })
        .getCount(),
    ]);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      partiallyFulfilledRequests,
      contraceptiveRequests,
      medicineRequests: totalRequests - contraceptiveRequests,
    };
  }

  private mapToResponseDto(request: CommodityRequest): RequestResponseDto {
    const items: RequestItemResponseDto[] = request.items.map((item) => {
      let medicineVariant: MedicineVariantInfo | undefined;
      if (item.medicineVariant && item.medicineVariant.medicine) {
        medicineVariant = {
          id: item.medicineVariant.id,
          medicineName: item.medicineVariant.medicine.name,
          genericName: item.medicineVariant.medicine.generic_name,
          strength: item.medicineVariant.strength,
          category: item.medicineVariant.medicine.category,
          isContraceptive: item.medicineVariant.medicine.contraceptive,
          unit: item.medicineVariant.unit,
        };
      }

      if (!medicineVariant) {
        throw new NotFoundException(
          `Medicine variant not found for item ${item.id}`,
        );
      }

      return {
        id: item.id,
        medicineVariant,
        quantityRequested: item.quantityRequested,
        quantityDispensed: item.quantityDispensed,
        status: item.status,
        notes: item.notes,
        purpose: item.purpose,
      };
    });

    const totalQuantityRequested = items.reduce(
      (sum, item) => sum + item.quantityRequested,
      0,
    );
    const totalQuantityDispensed = items.reduce(
      (sum, item) => sum + (item.quantityDispensed || 0),
      0,
    );

    return {
      id: request.id,
      initiatorRole: request.initiatorRole,
      requesterId: request.requesterId,
      facilityId: request.facilityId,
      requesterName: this.formatRoleName(request.initiatorRole),
      issuedTo: this.formatRoleName(request.issuedTo),
      issueFrom: 'Dispenser',
      issuedToStaffId: request.issuedToStaffId,
      items,
      status: request.status,
      processedById: request.processedById,
      approvedBy: request.approvedBy,
      rejectedBy: request.rejectedBy,
      processedAt: request.processedAt,
      rejectionReason: request.rejectionReason,
      notes: request.notes,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      totalItems: items.length,
      totalQuantityRequested,
      totalQuantityDispensed,
    };
  }
  private formatRoleName(value: string): string {
    if (!value) return '';

    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  private getIssuedToFromRole(roleName: string): IssuedTo {
    const roleUpper = roleName.toUpperCase().replace(/\s+/g, '_');

    switch (roleUpper) {
      case 'SUPER_ADMIN':
        return IssuedTo.SUPER_ADMIN;
      case 'ADMIN':
        return IssuedTo.ADMIN;
      case 'FACILITY_INCHARGE':
        return IssuedTo.FACILITY_INCHARGE;
      case 'REGISTRATION_CLERK':
        return IssuedTo.REGISTRATION_CLERK;
      case 'SBA':
        return IssuedTo.SBA;
      case 'MEDICAL_OFFICER_MALE':
        return IssuedTo.MEDICAL_OFFICER_MALE;
      case 'MEDICAL_OFFICER_FEMALE':
        return IssuedTo.MEDICAL_OFFICER_FEMALE;
      case 'VACCINATOR':
        return IssuedTo.VACCINATOR;
      case 'DISPENSER':
        return IssuedTo.DISPENSER;
      default:
        return IssuedTo.DISPENSER;
    }
  }

  private applyCommodityRequestAccessScope(
    queryBuilder: SelectQueryBuilder<CommodityRequest>,
    requestUser: User,
  ): void {
    if (!requestUser.facility?.id) {
      throw new BadRequestException(
        'User must be assigned to a facility',
      );
    }

    queryBuilder.andWhere('request.facilityId = :facilityId', {
      facilityId: requestUser.facility.id,
    });
  }

  private canProcessCommodityRequests(roleName: string): boolean {
    return (
      roleName === RoleName.DISPENSER || this.isAdminLevelRole(roleName)
    );
  }

  private usesFacilityInventory(roleName: string): boolean {
    return this.canProcessCommodityRequests(roleName);
  }

  private getApprovedByValue(
    status: RequestStatus,
    user: User,
  ): string | null {
    if (
      status !== RequestStatus.APPROVED &&
      status !== RequestStatus.PARTIALLY_FULFILLED
    ) {
      return null;
    }

    return this.getUserDisplayName(user);
  }

  private getUserDisplayName(user: User): string {
    return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  }

  private isAdminLevelRole(roleName: string): boolean {
    return [
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.FACILITY_INCHARGE,
      RoleName.HEAD_OFFICE,
    ].includes(roleName as RoleName);
  }

  private isFacilityScopedRequestProcessor(roleName: string): boolean {
    return [
      RoleName.ADMIN,
      RoleName.FACILITY_INCHARGE,
      RoleName.DISPENSER,
    ].includes(roleName as RoleName);
  }
}
