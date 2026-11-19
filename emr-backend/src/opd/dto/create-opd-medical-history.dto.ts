import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
    IsEnum,
    ValidateIf,
} from 'class-validator';
import { AssociatedConditions, AllergyType, PastObstetricComplication, PresentingComplaints, PreviousIllness } from 'src/common/enums/enums';

export class CreateOPDMedicalHistory {
    @ApiProperty({
        enum: PresentingComplaints,
        enumName: 'PresentingComplaints',
        isArray: true,
        description: 'List of presenting complaints',
        example: [PresentingComplaints.FEVER, PresentingComplaints.COUGH],
    })
    @IsArray()
    @IsEnum(PresentingComplaints, { each: true })
    presentingComplaints: PresentingComplaints[];

    @ApiProperty({
        required: false,
        description: 'Required when presentingComplaints includes OTHER',
        example: 'Headache and nausea',
    })
    @IsOptional()
    @ValidateIf((o) =>
        Array.isArray(o.presentingComplaints) &&
        o.presentingComplaints.includes(PresentingComplaints.OTHER)
    )
    @IsString()
    presentingComplaintsOther?: string;

    @ApiProperty({
        enum: PreviousIllness,
        enumName: 'PreviousIllness',
        isArray: true,
        description: 'Previous illnesses',
        example: [PreviousIllness.HEPATITIS_HBV_HCV_HDV, PreviousIllness.HYPERTENSION],
    })
    @IsArray()
    @IsEnum(PreviousIllness, { each: true })
    previousIllness: PreviousIllness[];

    @ApiProperty({
        required: false,
        description: "Other Previous Illness",
        example: 'Thyroid disorder',
    })
    @IsOptional()
    @ValidateIf((o) =>
        Array.isArray(o.previousIllness) &&
        o.previousIllness.includes(PreviousIllness.OTHER)
    )
    @IsString()
    otherPreviousIllness?: string;

    @ApiProperty({
        enum: AssociatedConditions,
        isArray: true,
        description: 'Associated medical conditions',
        example: [AssociatedConditions.HYPERTENSION],
    })
    @IsArray()
    @IsEnum(AssociatedConditions, { each: true })
    associatedConditions: AssociatedConditions[];

    @ApiProperty({
        required: false,
        description: "Other associated conditions",
        example: 'Migraine',
    })
    @IsOptional()
    @ValidateIf((o) =>
        Array.isArray(o.associatedConditions) &&
        o.associatedConditions.includes(PreviousIllness.OTHER)
    )
    @IsString()
    otherAssociatedConditions?: string;

    @ApiProperty({
        description: 'Does the patient have known allergies?',
        example: true,
    })
    @IsBoolean()
    known_allergies: boolean;

    @ApiProperty({
        required: false,
        description: 'Types of allergies',
        enum: AllergyType,
        isArray: true,
        example: [AllergyType.POLLEN, AllergyType.DUST],
    })
    @IsOptional()
    @IsEnum(AllergyType, { each: true })
    @IsArray()
    @ValidateIf(o => o.known_allergies === true)
    allergy?: AllergyType[];

    @ApiProperty({
        description: 'Does the patient take medications regularly?',
        example: true,
    })
    @IsBoolean()
    previous_medication: boolean;

    @ApiProperty({
        required: false,
        description: 'Details of previous medications',
        example: 'Metformin 500mg daily',
    })
    @ValidateIf((o) => o.previous_medication === true)
    @IsString()
    previous_medication_details?: string;

    @ApiProperty({
        required: false,
        description: 'Has the patient experienced obstetric complications?',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    obstetricComplication?: boolean;

    @ApiProperty({
        required: false,
        enum: PastObstetricComplication,
        isArray: true,
        description: 'Details of obstetric complications',
        example: [PastObstetricComplication.ANEMIA_LOW_HB, PastObstetricComplication.BLEEDING_DISORDER],
    })
    @ValidateIf((o) => o.obstetricComplication === true)
    @IsArray()
    @IsEnum(PastObstetricComplication, { each: true })
    obstetricComplicationDetails?: PastObstetricComplication[];

    @ApiProperty({
        required: false,
        description: 'Other obstetric complication if any',
        example: 'Rare complication',
    })
    @IsOptional()
    @ValidateIf((o) =>
        Array.isArray(o.obstetricComplicationDetails) &&
        o.obstetricComplicationDetails.includes(PastObstetricComplication.OTHER)
    )
    @IsString()
    otherObstetricComplicationDetails?: string;

    @ApiProperty({
        description: 'Has the patient undergone any surgery previously?',
        example: true,
    })
    @IsBoolean()
    previousSurgery: boolean;

    @ApiProperty({
        required: false,
        description: 'Details of previous surgeries',
        example: 'Appendectomy in 2018',
    })
    @ValidateIf((o) => o.previousSurgery === true)
    @IsString()
    previousSurgeryDetails?: string;
}
