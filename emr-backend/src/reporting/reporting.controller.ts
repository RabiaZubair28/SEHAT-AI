import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { ReportExportType, ReportType, RoleName } from 'src/common/enums/enums';
import { ReportingFilterDto } from './dto/reporting-filter.dto';
import { Response } from 'express';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtOrAuthGuard } from 'src/auth/jwt-or-auth.guard';

@ApiTags('Reporting')
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) { }

  @Get(':reportType')
  @UseGuards(JwtOrAuthGuard)
  @ApiOperation({
    summary: 'Get report by type',
    description:
      'Single reporting endpoint for all report types with optional filters. Super Admin/Admin/Head Office can optionally pass facilityId.',
  })
  @ApiParam({
    name: 'reportType',
    enum: ReportType,
    description:
      'Type of report (patients, single-patient, service, medicine, doctor, immunisation, delivery)',
  })
  public async getReportByType(
    @CurrentUser() user: any,
    @Param('reportType') reportType: string,
    @Query() filters: ReportingFilterDto,
    @Res() res: Response,
  ) {
    const isImmunisationReport = this.isImmunisationReportType(reportType);
    const userRole = user?.role as string | undefined;
    const reportingAdminRoles = [
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.HEAD_OFFICE,
      RoleName.FACILITY_INCHARGE,
    ] as string[];
    const privilegedRoles = [
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.HEAD_OFFICE,
    ] as string[];
    const isReportingAdmin = !!userRole && reportingAdminRoles.includes(userRole);

    if (!isReportingAdmin && userRole !== RoleName.VACCINATOR) {
      throw new ForbiddenException(
        'Reporting is only accessible to admin roles and vaccinator.',
      );
    }

    if (
      userRole === RoleName.VACCINATOR &&
      !isImmunisationReport
    ) {
      throw new ForbiddenException(
        'Vaccinator can only access immunisation report type.',
      );
    }

    this.validateImmunisationExportOnlyFilters(reportType, filters);

    if (
      isImmunisationReport &&
      userRole === RoleName.VACCINATOR
    ) {
      this.validateImmunisationDateRange(filters);
    }

    const vaccinatorFacilityUcId = Number(user?.facilityUcId);
    const vaccinatorScopeUcId =
      userRole === RoleName.VACCINATOR
        ? (Number.isNaN(vaccinatorFacilityUcId)
          ? undefined
          : vaccinatorFacilityUcId)
        : undefined;

    if (userRole === RoleName.VACCINATOR && vaccinatorScopeUcId === undefined) {
      throw new BadRequestException(
        'Vaccinator facility UC ID is required to generate immunisation report.',
      );
    }

    const requestedFacilityId = Number(filters?.facilityId ?? filters?.facility_id);
    const facilityId =
      userRole === RoleName.VACCINATOR
        ? undefined
        : privilegedRoles.includes(userRole)
          ? (Number.isNaN(requestedFacilityId) ? undefined : requestedFacilityId) ??
            user?.facilityId
          : user?.facilityId;
    const effectiveFilters: ReportingFilterDto & {
      scopeUcId?: number;
      isVaccinatorScope?: boolean;
    } = {
      ...filters,
      facilityId: facilityId,
      scopeUcId: vaccinatorScopeUcId,
      isVaccinatorScope: userRole === RoleName.VACCINATOR,
    };

    if (
      effectiveFilters.facilityId === undefined &&
      !privilegedRoles.includes(userRole) &&
      userRole !== RoleName.VACCINATOR
    ) {
      throw new BadRequestException(
        'Facility ID is required to generate reports.',
      );
    }
    if (
      filters?.exportType === ReportExportType.EXCEL ||
      filters?.exportType === ReportExportType.PDF
    ) {
      const exportedFile = await this.reportingService.exportReportByType(
        reportType,
        effectiveFilters,
      );
      res.setHeader('Content-Type', exportedFile.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${exportedFile.fileName}"`,
      );
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Cache-Control', 'no-store, no-transform');
      res.end(exportedFile.buffer);
      return;
    }

    return res.json(
      await this.reportingService.getReportByType(reportType, effectiveFilters),
    );
  }

  private isImmunisationReportType(reportType: string): boolean {
    const normalizedValue = String(reportType || '')
      .trim()
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/\s+/g, '-');

    return (
      normalizedValue === ReportType.IMMUNISATION ||
      normalizedValue === 'immunization'
    );
  }

  private validateImmunisationDateRange(filters: ReportingFilterDto): void {
    const now = new Date();
    const maxAllowedDate = new Date(now);
    maxAllowedDate.setHours(23, 59, 59, 999);

    const minAllowedDate = new Date(now);
    minAllowedDate.setMonth(minAllowedDate.getMonth() - 2);
    minAllowedDate.setHours(0, 0, 0, 0);

    const dateFrom = this.parseDateOnly(filters?.dateFrom, 'dateFrom');
    const dateTo = this.parseDateOnly(filters?.dateTo, 'dateTo');

    if (!dateFrom || !dateTo) {
      throw new BadRequestException(
        'dateFrom and dateTo are required for immunisation report type.',
      );
    }

    if (dateFrom > dateTo) {
      throw new BadRequestException(
        'dateFrom cannot be greater than dateTo for immunisation report type.',
      );
    }

    const maxRangeEnd = new Date(dateFrom);
    maxRangeEnd.setMonth(maxRangeEnd.getMonth() + 2);
    maxRangeEnd.setHours(23, 59, 59, 999);

    if (dateTo > maxRangeEnd) {
      throw new BadRequestException(
        'For immunisation report, date range cannot be greater than 2 months.',
      );
    }

    if (dateFrom < minAllowedDate || dateTo < minAllowedDate) {
      throw new BadRequestException(
        'For immunisation report, dates older than 2 months from today are not allowed.',
      );
    }

    if (dateFrom > maxAllowedDate || dateTo > maxAllowedDate) {
      throw new BadRequestException(
        'For immunisation report, future dates are not allowed.',
      );
    }
  }

  private parseDateOnly(
    value: string | undefined,
    fieldName: 'dateFrom' | 'dateTo',
  ): Date | null {
    if (!value) return null;
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    const parsed = dateOnlyPattern.test(value)
      ? new Date(`${value}T00:00:00.000Z`)
      : new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date.`);
    }

    return parsed;
  }

  private validateImmunisationExportOnlyFilters(
    reportType: string,
    filters: ReportingFilterDto,
  ): void {
    if (!filters?.immunisationType) {
      return;
    }

    if (!this.isImmunisationReportType(reportType)) {
      throw new BadRequestException(
        'immunisationType is only supported for immunisation report type.',
      );
    }

    if (
      filters.exportType !== ReportExportType.EXCEL &&
      filters.exportType !== ReportExportType.PDF
    ) {
      throw new BadRequestException(
        'immunisationType can only be used with exportType, dateFrom, and dateTo for download.',
      );
    }

    this.validateImmunisationDateRange(filters);
  }
}
