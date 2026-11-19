import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ImmunisationReportFilterType,
  ReportExportType,
  ReportType,
} from 'src/common/enums/enums';
import { DeliveryService } from 'src/delivery/delivery.service';
import { DispenserService } from 'src/dispenser/dispenser.service';
import { DoctorsService } from 'src/doctors/doctors.service';
import { ImmunisationService } from 'src/immunisation/immunisation.service';
import { PatientsService } from 'src/patients/patients.service';
import {
  ReportingFilterDto,
} from './dto/reporting-filter.dto';
import { VisitService } from 'src/visit/entities/visit.service';
import * as ExcelJS from 'exceljs';

type ExportSection = {
  title: string;
  rows: Record<string, any>[];
};

type ReportExportFile = {
  fileName: string;
  contentType: string;
  buffer: Buffer;
};

@Injectable()
export class ReportingService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly visitService: VisitService,
    private readonly dispenserService: DispenserService,
    private readonly doctorsService: DoctorsService,
    private readonly immunisationService: ImmunisationService,
    private readonly deliveryService: DeliveryService,
  ) {}

  public async getReportByType(
    reportType: string,
    filters: ReportingFilterDto,
  ) {
    const normalizedReportType = this.normalizeReportType(reportType);
    let response: any;

    switch (normalizedReportType) {
      case ReportType.PATIENTS:
        response = await this.patientsService.getAllPatientsReport(filters);
        break;

      case ReportType.SINGLE_PATIENT:
        response = await this.patientsService.getSinglePatientReport(filters);
        break;

      case ReportType.SERVICE:
        response = await this.visitService.getServiceReport(filters);
        break;

      case ReportType.MEDICINE:
        response = await this.dispenserService.getMedicineCountReport(filters);
        break;

      case ReportType.DOCTOR:
        response = await this.doctorsService.getDoctorActivityReport(filters);
        break;

      case ReportType.IMMUNISATION:
        response = await this.immunisationService.getImmunisationReport(filters);
        break;

      case ReportType.DELIVERY:
        response = await this.deliveryService.getDeliveryReport(filters);
        break;

      default:
        throw new BadRequestException(`Unsupported report type: ${reportType}`);
    }

    return response;
  }

  public async exportReportByType(
    reportType: string,
    filters: ReportingFilterDto,
  ): Promise<ReportExportFile> {
    const exportType = filters?.exportType;
    if (!exportType) {
      throw new BadRequestException(
        'exportType is required for file export (PDF or EXCEL).',
      );
    }

    const normalizedReportType = this.normalizeReportType(reportType);
    const exportFilters = {
      ...filters,
      exportType: undefined,
    };
    const reportResponse = await this.getReportByType(reportType, exportFilters);
    const sections = this.buildExportSections(
      normalizedReportType,
      reportResponse?.data,
      reportResponse,
    );

    if (exportType === ReportExportType.EXCEL) {
      return {
        fileName: this.buildExportFileName(normalizedReportType, 'xlsx'),
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: await this.buildExcelBuffer(sections),
      };
    }

    if (exportType === ReportExportType.PDF) {
      return {
        fileName: this.buildExportFileName(normalizedReportType, 'pdf'),
        contentType: 'application/pdf',
        buffer: this.buildPdfBuffer(normalizedReportType, sections),
      };
    }

    throw new BadRequestException(
      `Unsupported export type: ${String(exportType)}`,
    );
  }

  private buildExportFileName(
    reportType: ReportType,
    extension: 'xlsx' | 'pdf',
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${reportType}-report-${timestamp}.${extension}`;
  }

  private buildExportSections(
    reportType: ReportType,
    data: any,
    reportResponse?: any,
  ): ExportSection[] {
    if (!data) {
      return [{ title: 'Report', rows: [] }];
    }

    switch (reportType) {
      case ReportType.PATIENTS:
        return [
          {
            title: 'Patient Records',
            rows: this.toRows(data),
          },
          {
            title: 'Patient Summary',
            rows: this.toRows({
              exportedRows: Array.isArray(data) ? data.length : 0,
              totalMatchingPatients: reportResponse?.count ?? data?.length ?? 0,
              page: reportResponse?.page ?? '',
              limit: reportResponse?.limit ?? '',
              totalMaleCount: reportResponse?.summary?.totalMaleCount ?? 0,
              totalFemaleCount: reportResponse?.summary?.totalFemaleCount ?? 0,
            }),
          },
          {
            title: 'Facility Wise Gender Count',
            rows: this.toRows(reportResponse?.summary?.facilityWiseGenderCount),
          },
        ];

      case ReportType.SINGLE_PATIENT:
        return [
          { title: 'Patient', rows: this.toRows(data.patient) },
          { title: 'Visit History', rows: this.toRows(data.visitHistory) },
          { title: 'Services Taken', rows: this.toRows(data.servicesTaken) },
          {
            title: 'Medicines Prescribed',
            rows: this.toRows(data.medicinesPrescribed),
          },
          {
            title: 'Immunisation Records',
            rows: this.toRows(data.immunisationRecords),
          },
          { title: 'Delivery History', rows: this.toRows(data.deliveryHistory) },
        ];

      case ReportType.SERVICE:
        return [
          { title: 'Service Records', rows: this.toRows(data.records) },
          { title: 'Service Usage Summary', rows: this.toRows(data.usageSummary) },
          {
            title: 'Services Count Per Facility',
            rows: this.toRows(data.servicesCountPerFacility),
          },
          {
            title: 'Usage Count Per Service Per Facility',
            rows: this.toRows(data.usageCountPerServicePerFacility),
          },
        ];

      case ReportType.MEDICINE:
        return [
          {
            title: 'Medicine Usage Records',
            rows: this.toRows(data.records),
          },
          {
            title: 'Top 5 Medicines By Quantity Dispensed',
            rows: this.toRows(data.top5MedicinesByQuantityDispensed),
          },
        ];

      case ReportType.DOCTOR:
        return [
          {
            title: 'Doctor Activity Records',
            rows: this.toRows(data.records),
          },
          {
            title: 'Doctor Facility Summary',
            rows: this.toRows(data.facilitySummary),
          },
        ];

      case ReportType.IMMUNISATION:
        if (this.isImmunisationTypeExportData(data)) {
          return [
            {
              title: `${data.reportFilterType} Records`,
              rows: this.toRows(data.records),
            },
            {
              title: 'Immunisation Summary',
              rows: this.toRows({
                reportFilterType: data.reportFilterType,
                recordCount: data.recordCount,
                distinctPatientCount: data.distinctPatientCount,
                dateFrom: data.dateFrom,
                dateTo: data.dateTo,
              }),
            },
          ];
        }

        return [
          {
            title: 'Immunisation Records',
            rows: this.toRows(data.records),
          },
          {
            title: 'Immunisation Summary',
            rows: this.toRows({
              reportFilterType: data.reportFilterType,
              distinctPatientCount: data.distinctPatientCount,
              distinctVaccineCount: data.distinctVaccineCount,
              mostUsedVaccine: data.mostUsedVaccine,
            }),
          },
          {
            title: 'Vaccine Summary',
            rows: this.toRows(data.vaccineSummary),
          },
        ];

      case ReportType.DELIVERY:
        return [
          {
            title: 'Delivery Records',
            rows: this.toRows(data.records),
          },
          {
            title: 'Delivery Type Summary',
            rows: this.toRows(data.deliverySummary?.typeSummary),
          },
          {
            title: 'Daily Delivery Summary',
            rows: this.toRows(data.deliverySummary?.dailySummary),
          },
        ];

      default:
        return [{ title: 'Report', rows: this.toRows(data) }];
    }
  }

  private toRows(value: any): Record<string, any>[] {
    if (value === null || value === undefined) return [];

    if (Array.isArray(value)) {
      return value.map((item) => this.toFlatRow(item));
    }

    if (typeof value === 'object') {
      return [this.toFlatRow(value)];
    }

    return [{ value }];
  }

  private toFlatRow(value: any): Record<string, any> {
    if (value === null || value === undefined) return {};
    if (typeof value !== 'object') return { value };

    const flattened: Record<string, any> = {};
    this.flattenObject(value, '', flattened);
    return flattened;
  }

  private flattenObject(
    source: any,
    prefix: string,
    output: Record<string, any>,
  ) {
    if (source === null || source === undefined) return;

    if (source instanceof Date) {
      output[prefix || 'value'] = source.toISOString();
      return;
    }

    if (Array.isArray(source)) {
      output[prefix || 'value'] = source
        .map((item) =>
          typeof item === 'object' ? JSON.stringify(item) : String(item),
        )
        .join(', ');
      return;
    }

    if (typeof source !== 'object') {
      output[prefix || 'value'] = source;
      return;
    }

    const entries = Object.entries(source);
    if (!entries.length) {
      output[prefix || 'value'] = '';
      return;
    }

    for (const [key, value] of entries) {
      const childKey = prefix ? `${prefix}.${key}` : key;
      if (
        value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        !Array.isArray(value)
      ) {
        this.flattenObject(value, childKey, output);
      } else {
        output[childKey] =
          value instanceof Date ? value.toISOString() : value ?? '';
      }
    }
  }

  private async buildExcelBuffer(sections: ExportSection[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EMR System';
    workbook.created = new Date();

    sections.forEach((section, index) => {
      const worksheet = workbook.addWorksheet(
        this.sanitizeWorksheetName(section.title, index),
      );
      const rows = section.rows || [];
      worksheet.properties.defaultRowHeight = 18;
      worksheet.views = [{ state: 'frozen', ySplit: 3 }];
      worksheet.addRow([section.title]);

      if (!rows.length) {
        const noDataRow = worksheet.addRow(['No data found']);
        noDataRow.font = { italic: true, color: { argb: 'FF666666' } };
        worksheet.mergeCells(1, 1, 1, 2);
        worksheet.getCell(1, 1).font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 12,
        };
        worksheet.getCell(1, 1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F4E78' },
        };
        return;
      }

      const columnKeys = Array.from(
        rows.reduce<Set<string>>((set, row) => {
          Object.keys(row || {}).forEach((key) => set.add(key));
          return set;
        }, new Set<string>()),
      );

      worksheet.columns = columnKeys.map((key, columnIndex) => ({
        key,
        width: Math.min(Math.max(this.formatColumnHeader(key).length + 4, 16), 45),
        style: {
          alignment: {
            vertical: 'top',
            horizontal: columnIndex === 0 ? 'left' : 'left',
            wrapText: true,
          },
        },
      }));

      worksheet.mergeCells(1, 1, 1, columnKeys.length);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 12,
      };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' },
      };
      titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

      const generatedRow = worksheet.addRow([
        `Generated At: ${new Date().toISOString()}`,
      ]);
      worksheet.mergeCells(2, 1, 2, columnKeys.length);
      generatedRow.font = {
        italic: true,
        size: 10,
        color: { argb: 'FF555555' },
      };

      const headerRow = worksheet.getRow(3);
      headerRow.values = columnKeys.map((key) => this.formatColumnHeader(key));
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F75B5' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
      headerRow.height = 20;

      rows.forEach((rawRow) => {
        const normalizedRow = this.normalizeRowForExport(rawRow, columnKeys);
        const dataRow = worksheet.addRow(normalizedRow);
        if (dataRow.number % 2 === 0) {
          dataRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF7FBFF' },
          };
        }
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            left: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } },
            right: { style: 'thin', color: { argb: 'FFE5E5E5' } },
          };
          const normalizedText = String(cell.value ?? '');
          if (this.looksLikeIsoDate(normalizedText)) {
            cell.value = new Date(normalizedText);
            cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
          }
        });
      });

      worksheet.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: 3, column: columnKeys.length },
      };
    });

    const workbookBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(workbookBuffer)
      ? workbookBuffer
      : Buffer.from(workbookBuffer as ArrayBuffer);
  }

  private sanitizeWorksheetName(name: string, index: number): string {
    const safeName = String(name || `Sheet${index + 1}`)
      .replace(/[\[\]\*\/\\\?\:]/g, ' ')
      .trim();
    const normalized = safeName || `Sheet${index + 1}`;
    return normalized.slice(0, 31);
  }

  private buildPdfBuffer(reportType: ReportType, sections: ExportSection[]): Buffer {
    const lines: string[] = [];
    lines.push('EMR REPORT EXPORT');
    lines.push(`Report Type: ${this.formatColumnHeader(reportType)}`);
    lines.push(`Generated At: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('------------------------------------------------------------');
    lines.push('');

    for (const section of sections) {
      lines.push(`SECTION: ${section.title.toUpperCase()}`);
      lines.push('------------------------------------------------------------');

      if (!section.rows?.length) {
        lines.push('No data found');
        lines.push('');
        continue;
      }

      for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex += 1) {
        const row = section.rows[rowIndex];
        lines.push(`Record ${rowIndex + 1}`);
        Object.entries(row || {}).forEach(([key, value]) => {
          const entryLine = `${this.formatColumnHeader(key)}: ${this.valueToText(
            value,
          )}`;
          this.wrapLine(entryLine, 95).forEach((wrappedLine) =>
            lines.push(`  ${wrappedLine}`),
          );
        });
        lines.push('');
      }

      lines.push('');
    }

    const pages = this.paginateLines(lines, 48);
    return this.createMultiPagePdf(pages);
  }

  private valueToText(value: any): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private wrapLine(value: string, maxLength: number): string[] {
    const text = String(value || '');
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > maxLength) {
      chunks.push(remaining.slice(0, maxLength));
      remaining = remaining.slice(maxLength);
    }
    if (remaining.length) chunks.push(remaining);
    return chunks;
  }

  private formatColumnHeader(value: string): string {
    return String(value || '')
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private normalizeRowForExport(
    row: Record<string, any>,
    keys: string[],
  ): Record<string, string | number | boolean | Date> {
    const normalized: Record<string, string | number | boolean | Date> = {};
    keys.forEach((key) => {
      const value = row?.[key];
      if (value === null || value === undefined) {
        normalized[key] = '';
        return;
      }
      if (value instanceof Date) {
        normalized[key] = value;
        return;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        normalized[key] = value;
        return;
      }
      if (typeof value === 'object') {
        normalized[key] = JSON.stringify(value);
        return;
      }
      normalized[key] = String(value);
    });
    return normalized;
  }

  private looksLikeIsoDate(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
    const parsed = Date.parse(value);
    return !Number.isNaN(parsed);
  }

  private escapePdfText(value: string): string {
    return String(value)
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private paginateLines(lines: string[], linesPerPage: number): string[][] {
    if (!lines.length) return [['No data found']];
    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage));
    }
    return pages;
  }

  private buildPageContentStream(lines: string[]): string {
    return [
      'BT',
      '/F1 10 Tf',
      '14 TL',
      '45 790 Td',
      ...lines.map((line, index) =>
        `${index === 0 ? '' : 'T* '}(${this.escapePdfText(line)}) Tj`.trim(),
      ),
      'ET',
    ].join('\n');
  }

  private createMultiPagePdf(pages: string[][]): Buffer {
    const objects: string[] = [];
    const addObject = (content: string): number => {
      objects.push(content);
      return objects.length;
    };

    const pagesObjectId = addObject('');
    const fontObjectId = addObject(
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    );
    const pageObjectIds: number[] = [];

    for (const pageLines of pages) {
      const contentStream = this.buildPageContentStream(pageLines);
      const contentObjectId = addObject(
        `<< /Length ${Buffer.byteLength(
          contentStream,
          'utf8',
        )} >>\nstream\n${contentStream}\nendstream`,
      );

      const pageObjectId = addObject(
        `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      );

      pageObjectIds.push(pageObjectId);
    }

    objects[pagesObjectId - 1] = `<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(' ')}] /Count ${pageObjectIds.length} >>`;

    const catalogObjectId = addObject(
      `<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`,
    );

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (let i = 0; i < objects.length; i += 1) {
      offsets[i + 1] = Buffer.byteLength(pdf, 'utf8');
      pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, 'utf8');
  }

  private isImmunisationTypeExportData(
    data: any,
  ): data is {
    reportFilterType: ImmunisationReportFilterType;
    records: Record<string, any>[];
    recordCount: number;
    distinctPatientCount: number;
    dateFrom?: string;
    dateTo?: string;
  } {
    return (
      !!data &&
      Object.values(ImmunisationReportFilterType).includes(data.reportFilterType) &&
      Array.isArray(data.records)
    );
  }

  private normalizeReportType(reportType: string): ReportType {
    const normalizedValue = String(reportType || '')
      .trim()
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/\s+/g, '-');

    const reportTypeMap: Record<string, ReportType> = {
      patients: ReportType.PATIENTS,
      patient: ReportType.PATIENTS,
      'single-patient': ReportType.SINGLE_PATIENT,
      'singlepatient': ReportType.SINGLE_PATIENT,
      service: ReportType.SERVICE,
      services: ReportType.SERVICE,
      medicine: ReportType.MEDICINE,
      medicines: ReportType.MEDICINE,
      doctor: ReportType.DOCTOR,
      doctors: ReportType.DOCTOR,
      immunisation: ReportType.IMMUNISATION,
      immunization: ReportType.IMMUNISATION,
      delivery: ReportType.DELIVERY,
      deliveries: ReportType.DELIVERY,
    };

    const resolvedType = reportTypeMap[normalizedValue];

    if (!resolvedType) {
      throw new BadRequestException(
        `Invalid report type. Allowed values: ${Object.values(ReportType).join(', ')}`,
      );
    }

    return resolvedType;
  }
}
