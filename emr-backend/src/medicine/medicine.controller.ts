import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { JwtUserAuthGuard } from 'src/auth/jwt-user-auth.guard';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MedicineCategories } from 'src/common/enums/enums';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@Controller('medicine')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) { }

  @Get()
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Retrieve a paginated list of medicines',
    description: 'Returns a list of medicines filtered by optional parameters.',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter medicines by name (partial match)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: MedicineCategories,
    description: 'Filter medicines by medicine category',
  })
  @ApiQuery({
    name: 'except_category',
    required: false,
    enum: MedicineCategories,
    description: 'Do not Filter medicines by medicine category',
  })
  @ApiQuery({
    name: 'is_otc',
    required: false,
    type: Boolean,
    description: 'Filter medicines by otc status',
  })
  @ApiQuery({
    name: 'contraceptive',
    required: false,
    type: Boolean,
    description: 'Filter medicines by contraceptive status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (defaults to 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (defaults to 100)',
  })
  getMedicines(
    @Req() request: any,
    @Query('name') name?: string,
    @Query('category') category?: MedicineCategories,
    @Query('except_category') except_category?: MedicineCategories,
    @Query('is_otc') is_otc?: boolean,
    @Query('contraceptive') contraceptive?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    return this.medicineService.getMedicines({
      name,
      category,
      except_category,
      is_otc,
      contraceptive,
      page,
      limit,
      requestRole: request?.user?.role,
    });
  }

  @Get('prescriptions')
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Retrieve prescribed medicines for a patient',
    description: 'Fetches all prescribed medicines linked to a patient',
  })
  @ApiQuery({
    name: 'patient_id',
    required: true,
    type: Number,
    description: 'Patient identifier',
  })
  getPatientPrescribedMedicines(
    @Req() request: Request,
    @Query('patient_id') patientId: number,
  ) {
    return this.medicineService.getPatientPrescribedMedicines(
      patientId,
      request,
    );
  }
}
