import type {
  PlaceOfDelivery,
  ModeOfDelivery,
  PreviousIllness,
  PastObstetricComplication,
  AllergyType,
  FamilyPlanningMethod,
  WarningSign,
  BloodGroup,
  PregnancyType,
  FetalMovement,
  FetalPresentation,
  FetalAttitude,
  PlacentaPosition,
  LabTestType,
} from "../data/constants";

export type Trimester = "First" | "Second" | "Third";

export type ReasonForEdit =
  | "Changing current LMP"
  | "Adding LMP for a new pregnancy";

export type DeliveryOutcome =
  | "Live birth"
  | "Still birth"
  | "Miscarriage"
  | "Induced abortion";

export type Complication =
  | "Hypertension"
  | "Diabetes"
  | "Heart disease"
  | "Bleeding disorder"
  | "C-section"
  | "Obstructed labour"
  | "Antepartum haemorrhage (APH)"
  | "Postpartum haemorrhage (PPH)"
  | "Preeclampsia"
  | "Eclampsia"
  | "Preterm labour"
  | "Severe abdominal pain"
  | "Vaginal bleeding"
  | "Decreased or loss of fetal movement"
  | "Collapse / convulsion"
  | "Severe headache (with or without visual disturbance)"
  | "Severe edema"
  | "Categorized as high risk during ANC"
  | "Anaemia / low Hb"
  | "Ectopic pregnancy"
  | "Placenta previa"
  | "Chorioamnionitis"
  | "Fetopelvic disproportion"
  | "Nuchal cord"
  | "Shoulder dystocia"
  | "Prolapsed umbilical cord"
  | "Uterine rupture"
  | "Amniotic fluid embolism"
  | "Meconium passed"
  | "Perinatal asphyxia"
  | "Intrauterine death"
  | "Inverted uterus"
  | "Puerperal sepsis"
  | "Intractable vomiting"
  | "Physical trauma"
  | "Mental trauma"
  | "Gastroenteritis"
  | "Vaginal discharge"
  | "Shortness of breath"
  | "Infections"
  | "Fever"
  | "Malaria"
  | "Jaundice"
  | "Other"
  | "None";

export type Albumin = "Negative" | "Positive";

export type UltrasoundReportings =
  | "Ectopic Pregnancies Detected"
  | "Twin Pregnancies Detected"
  | "Missed Abortion"
  | "RPOC after Termination of pregnancy"
  | "Oligohydramnios"
  | "Congenital Anomalies"
  | "Neural Tube Defects"
  | "Placenta Previa"
  | "Placenta Abruptio"
  | "Molar Pregnancy"
  | "Intrauterine Death"
  | "Polyhydramnios"
  | "Intrauterine Growth Restriction (IUGR)"
  | "Others"
  | "None"
  | "Normal";

export type CtgReporting =
  | "Normal/Reactive"
  | "Suspicious"
  | "Abnormal/Non-Reactive";

export type LabTestUrgency = "Routine" | "Urgent";

export type OtherPrescriptionCategory = "Medicine" | "Supplement";

export interface PreviousPregnancyVisitData {
  id: number;
  place_of_delivery: PlaceOfDelivery | null;
  outcome: DeliveryOutcome | null;
  mode_of_delivery: ModeOfDelivery | null;
  complication: Complication[] | null;
  otherComplication: string | null;
}

export interface PregnancyInfoVisitData {
  id: number;
  gravidity: number;
  parity: number;
  lmp: string;
  abortion: number;
  gestational_age: number;
  reason_for_edit: ReasonForEdit | null;
  expected_date_of_delivery: string;
  trimester: Trimester;
  previous_pregnancies: PreviousPregnancyVisitData[] | null;
}

export interface MedicalSurgicalHistoryVisitData {
  id: number;
  previousIllness: PreviousIllness[] | null;
  past_obstetric_complication: PastObstetricComplication[] | null;
  previous_surgery: boolean | null;
  previous_surgery_details: string | null;
  known_allergies: boolean | null;
  allergy_details: AllergyType[] | null;
  previous_medication: boolean | null;
  previous_medication_details: string | null;
  used_family_planning: boolean;
  family_planning_methods: FamilyPlanningMethod[] | null;
  prior_blood_transfusion: boolean;
}

export interface AncVitalAssessmentVisitData {
  id: number;
  weight: number;
  height: number;
  temperature: number;
  pulse: number;
  body_mass_index: number;
  change_in_weight: number;
  systolic_bp: number;
  diastolic_bp: number;
  respiratory_rate: number;
  spo2: number;
  blood_group: BloodGroup | null;
  haemoglobin: number;
  fundal_height: number | null;
  blood_sugar_random: number | null;
  albumin_urine_dipstick: Albumin | null;
  muac: number;
  warning_signs: WarningSign[] | null;
  otherWarningSign: string | null;
}

export interface LabTestItemVisitData {
  name: LabTestType;
  urgency: LabTestUrgency;
  other?: string;
}

export interface DiagnosisVisitData {
  id: number;
  screenedRubella: boolean;
  rubellaPositive: boolean | null;
  screenedHepB: boolean;
  hepBPositive: boolean | null;
  screenedHepC: boolean;
  hepCPositive: boolean | null;
  screenedThalassemia: boolean;
  thalassemiaPositive: boolean | null;
  screenedHiv: boolean;
  hivPositive: boolean | null;
  prescribedLabTest: boolean;
  labTestsPrescribed: LabTestItemVisitData[] | null;
}

export interface UltrasoundVisitData {
  id: number;
  requiresUltrasound: boolean;
  ultrasoundMachineAvailable: boolean | null;
  typeOfPregnancy: PregnancyType | null;
  fetalMovement: FetalMovement | null;
  fetalPresentation: FetalPresentation | null;
  attitude: FetalAttitude | null;
  placenta: PlacentaPosition | null;
  amnioticFluidIndex: number | null;
  fetalHeartRate: number | null;
  fundalHeight: number | null;
  ultrasoundReporting: UltrasoundReportings[] | null;
  otherUltrasoundReporting: string | null;
  ultrasoundObservations: string | null;
}

export interface CtgVisitData {
  id: number;
  requiresCtg: boolean;
  ctgMachineAvailable: boolean;
  ctgReporting: CtgReporting | null;
  ctgObservations: string | null;
  ctgRemarks: string | null;
}

export interface MedicineVisitData {
  id: number;
  name: string;
  category: string;
}

export interface MedicineVariantVisitData {
  id: number;
  strength: string;
  unit: string;
  medicine: MedicineVisitData;
}

export interface PrescriptionVisitData {
  id: number;
  medicineDosage: string | null;
  medicineDuration: number | null;
  medicineInstruction: string | null;
  medicineVariant: MedicineVariantVisitData;
}

export interface OtherPrescriptionVisitData {
  id: number;
  name: string;
  medicineDosage: string | null;
  medicineDuration: number | null;
  medicineInstruction: string | null;
  category: OtherPrescriptionCategory | null;
}

export interface AncVisitResponseDto {
  pregnancyInfo: PregnancyInfoVisitData | null;
  ancMedicalSurgicalHistory: MedicalSurgicalHistoryVisitData | null;
  ancVitalAssessment: AncVitalAssessmentVisitData | null;
  diagnosis: DiagnosisVisitData | null;
  ultrasound: UltrasoundVisitData | null;
  ctg: CtgVisitData | null;
  prescriptions: PrescriptionVisitData[] | null;
  otherPrescriptions: OtherPrescriptionVisitData[] | null;
}

export interface GetAncVisitResponse {
  success: boolean;
  status: number;
  data: {
    anc: AncVisitResponseDto | null;
    pnc: null;
    opd: null;
    delivery: null;
    dispenser: null;
    nutrition: null;
    familyPlanning: null;
    immunization: null;
  };
  message: string;
}
