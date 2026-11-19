export const SERVICES_STATUS = {
  REGISTERED: "registered",
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  COMPLETED: "completed",
  RESUMED: "resumed",
  STARTED: "started",
  CONTINUE: "continue",
  REFERRED_IN: "referred_in",
  REFERRED_OUT: "referred_out",
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
};

export const VISIT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  DISPATCHED: "dispatched",
  REFERRED_OUT: "referred_out",
};

export enum ServiceType {
  OPD = "OPD",
  ANC = "ANC",
  DELIVERY = "DELIVERY",
  PNC = "PNC",
  FAMILY_PLANNING = "FAMILY_PLANNING",
  IMMUNISATION = "IMMUNISATION",
  NUTRITION = "NUTRITION",
  MEDICINE_DISPENSING = "MEDICINE_DISPENSING",
}

export enum BloodGroup {
  A_POSITIVE = "A +ve",
  A_NEGATIVE = "A -ve",
  B_POSITIVE = "B +ve",
  B_NEGATIVE = "B -ve",
  AB_POSITIVE = "AB +ve",
  AB_NEGATIVE = "AB -ve",
  O_POSITIVE = "O +ve",
  O_NEGATIVE = "O -ve",
}

export const BLOOD_GROUP_OPTIONS = [
  { label: BloodGroup.A_POSITIVE, value: BloodGroup.A_POSITIVE },
  { label: BloodGroup.A_NEGATIVE, value: BloodGroup.A_NEGATIVE },
  { label: BloodGroup.B_POSITIVE, value: BloodGroup.B_POSITIVE },
  { label: BloodGroup.B_NEGATIVE, value: BloodGroup.B_NEGATIVE },
  { label: BloodGroup.AB_POSITIVE, value: BloodGroup.AB_POSITIVE },
  { label: BloodGroup.AB_NEGATIVE, value: BloodGroup.AB_NEGATIVE },
  { label: BloodGroup.O_POSITIVE, value: BloodGroup.O_POSITIVE },
  { label: BloodGroup.O_NEGATIVE, value: BloodGroup.O_NEGATIVE },
];

export const YES_NO_OPTIONS = [
  { label: "Yes", value: true },
  { label: "No", value: false },
] as const;

export const REFERRAL_TYPES = [
  { label: "Referral within facility", value: "internal" },
  { label: "Referral outside the facility", value: "external" },
] as const;

export enum PatientDignosis {
  AVAILABLE = "Available",
  FOLLOW_UP_REQUIRED = "Requires a follow-up",
}

export const PATIENT_DIGNOSES_STATUS = [
  { label: PatientDignosis.AVAILABLE, value: PatientDignosis.AVAILABLE },
  {
    label: PatientDignosis.FOLLOW_UP_REQUIRED,
    value: PatientDignosis.FOLLOW_UP_REQUIRED,
  },
];

export enum PrescriptionType {
  MEDICINE = "medicine",
  SUPPLEMENT = "supplement",
}

export const PRESCRIPTION_TYPE_OPTIONS = [
  { id: 1, label: "Supplement", value: PrescriptionType.SUPPLEMENT },
  { id: 2, label: "Medicine", value: PrescriptionType.MEDICINE },
];

export enum MedicineOptions {
  PARACETAMOL = "Paracetamol",
  IBUPROFEN = "Ibuprofen",
  AMOXICILLIN = "Amoxicillin",
  CETIRIZINE = "Cetirizine",
  METFORMIN = "Metformin",
}

export const MEDICINE_OPTIONS = [
  { label: MedicineOptions.PARACETAMOL, value: MedicineOptions.PARACETAMOL },
  { label: MedicineOptions.IBUPROFEN, value: MedicineOptions.IBUPROFEN },
  { label: MedicineOptions.AMOXICILLIN, value: MedicineOptions.AMOXICILLIN },
  { label: MedicineOptions.CETIRIZINE, value: MedicineOptions.CETIRIZINE },
  { label: MedicineOptions.METFORMIN, value: MedicineOptions.METFORMIN },
];

export const VALIDATION_RANGES = {
  WEIGHT: { min: 25, max: 200 },
  WEIGHT_UNDER14: { min: 2, max: 200 },
  BABY_WEIGHT: { min: 2.5, possible: { min: 2, max: 4.5 } },
  GRAVIDITY: { min: 0, max: 20 },
  FUNDAL_HEIGHT_VITALS_ASSESSMENT: { min: 10, max: 50 },
  FUNDAL_HEIGHT: { min: 12, max: 40 },
  TEMPERATURE: {
    normal: { min: 97, max: 100 },
    possible: { min: 95, max: 108 },
  },
  RESPIRATORY_RATE: {
    normal: { min: 12, max: 20 },
    possible: { min: 5, max: 60 },
  },
  TEMPERATURE_NEWBORN: {
    normal: { min: 96, max: 100 },
    possible: { min: 95, max: 108 },
  },
  HAEMOGLOBIN_ANC: {
    firstTrimester: { min: 11 },
    secondTrimester: { min: 10.5 },
    thirdTrimester: { min: 11 },
    max: 15,
    min: 3,
    possible: { min: 3, max: 20 },
    possible_delivery: { min: 3, max: 18 },
  },
  HAEMOGLOBIN_PNC: {
    max: 18,
    min: 3,
    high: 15,
    low: 9.9,
    veryLow: 7,
    possible: { min: 3, max: 18 },
  },

  BLOOD_SUGAR: { min: 60, max: 140, possible: { min: 40, max: 400 } },
  BLOOD_SUGAR_PNC: { min: 60, max: 120, possible: { min: 50, max: 400 } },
  BLOOD_PRESSURE: {
    systolic: { min: 90, max: 140 },
    diastolic: { min: 60, max: 90 },
    systolic_possible: { min: 50, max: 300 },
    diastolic_possible: { min: 20, max: 200 },
  },
  MUAC: { normal: { min: 23 }, possible: { min: 5, max: 60 } },
  MUAC_ANC: { normal: { min: 23 }, possible: { min: 10, max: 60 } },
  MUAC_PNC: { normal: { min: 21 }, possible: { min: 10, max: 60 } },
  MUAC_NUTRITION: { normal: { min: 23 }, possible: { min: 7, max: 60 } },
  MUAC_NEWBORN: { normal: { min: 9.5 }, possible: { min: 7, max: 14 } },
  MUAC_VITALS: { max: 12.5 },
  SPO2: {
    normal: { min: 95 },
    possible: { min: 50, max: 100 },
    possible_delivery: { min: 0, max: 100 },
    normal_delivery: { min: 80 },
  },

  SPO2_PNC: {
    normal: { min: 80 },
    possible: { min: 50, max: 100 },
  },
  SPO2_VITALS: {
    normal: { max: 95 },
    possible: { min: 50, max: 100 },
  },
  PULSE_VITALS: {
    normal: { min: 70, max: 115 },
    possible: { min: 20, max: 220 },
  },
  PULSE: {
    normal: { min: 60, max: 120 },
    possible: { min: 20, max: 220 },
  },
  PULSE_DELIVERY: {
    normal: { min: 70, max: 115 },
    possible: { min: 20, max: 220 },
  },

  PULSE_PNC: {
    normal: { min: 70, max: 115 },
    possible: { min: 20, max: 200 },
  },

  PULSE_OPD: {
    normal: { min: 70, max: 115 },
    possible: { min: 20, max: 200 },
  },
  AMNIOTIC_FLUID_INDEX: {
    possible: { min: 2, max: 40 },
    normal: { min: 5, max: 25 },
  },
  FETAL_HEART_RATE: {
    normal: { min: 110, max: 160 },
    possible: { min: 80, max: 200 },
  },
  FETAL_HEART_RATE_DELIVERY: {
    normal: { min: 110, max: 160 },
    possible: { min: 60, max: 220 },
  },
  BMI: {
    low: 18,
    high: 30,
  },
  PARITY_HIGH_RISK: 5,
  PREGNANCY_WEEK: {
    normal: { max: 37 },
    possible: { min: 1, max: 42 },
  },
  CERVICAL_DILATION: { min: 1, max: 10 },
  HEAD_CIRCUMFERENCE: { min: 30, max: 45 },
} as const;

//anc specific constants
export enum PlaceOfDelivery {
  PUBLIC_FACILITY = "Public health facility",
  PRIVATE_FACILITY = "Private health facility",
  HOME = "Home",
  INFORMAL_DELIVERY_CENTER = "Informal delivery center",
}

export const PLACE_OF_DELIVERY_OPTIONS = [
  {
    id: 1,
    label: PlaceOfDelivery.PUBLIC_FACILITY,
    value: PlaceOfDelivery.PUBLIC_FACILITY,
  },
  {
    id: 2,
    label: PlaceOfDelivery.PRIVATE_FACILITY,
    value: PlaceOfDelivery.PRIVATE_FACILITY,
  },
  { id: 3, label: PlaceOfDelivery.INFORMAL_DELIVERY_CENTER, value: PlaceOfDelivery.INFORMAL_DELIVERY_CENTER },
  { id: 4, label: PlaceOfDelivery.HOME, value: PlaceOfDelivery.HOME },
];

export enum PregnancyOutcome {
  LIVE_BIRTH = "Live birth",
  STILL_BIRTH = "Still birth",
  MISCARRIAGE = "Miscarriage",
  INDUCED_ABORTION = "Induced abortion",
}

export const TrimesterOptions = [
  { label: "First", value: "First" },
  { label: "Second", value: "Second" },
  { label: "Third", value: "Third" },
];

export const PREGNANCY_OUTCOME_OPTIONS = [
  {
    id: 1,
    label: PregnancyOutcome.LIVE_BIRTH,
    value: PregnancyOutcome.LIVE_BIRTH,
  },
  {
    id: 2,
    label: PregnancyOutcome.STILL_BIRTH,
    value: PregnancyOutcome.STILL_BIRTH,
  },
  {
    id: 3,
    label: PregnancyOutcome.MISCARRIAGE,
    value: PregnancyOutcome.MISCARRIAGE,
  },
  {
    id: 4,
    label: PregnancyOutcome.INDUCED_ABORTION,
    value: PregnancyOutcome.INDUCED_ABORTION,
  },
];

export enum ModeOfDelivery {
  NORMAL_VAGINAL = "Normal Vaginal Delivery",
  ASSISTED_DELIVERY = "Assisted delivery (Vacuum/Forceps)",
  C_SECTION = "C-Section",
  NOT_APPLICABLE = "Not Applicable",
}

export const MODE_OF_DELIVERY_OPTIONS = [
  {
    id: 1,
    label: ModeOfDelivery.NORMAL_VAGINAL,
    value: ModeOfDelivery.NORMAL_VAGINAL,
  },
  {
    id: 2,
    label: ModeOfDelivery.ASSISTED_DELIVERY,
    value: ModeOfDelivery.ASSISTED_DELIVERY,
  },
  { id: 3, label: ModeOfDelivery.C_SECTION, value: ModeOfDelivery.C_SECTION },
  {
    id: 4,
    label: ModeOfDelivery.NOT_APPLICABLE,
    value: ModeOfDelivery.NOT_APPLICABLE,
  },
];

export enum TRIMISTER_TYPES {
  FIRST = "First",
  SECOND = "Second",
  THIRD = "Third",
}

export enum PregnancyComplication {
  HIGH_RISK_ANC = "Categorized as high risk during ANC",
  ANAEMIA = "Anaemia / low Hb",
  HYPERTENSION = "Hypertension",
  DIABETES = "Diabetes",
  HEART_DISEASE = "Heart disease",
  BLEEDING_DISORDER = "Bleeding disorder",
  C_SECTION = "C-section",
  OBSTRUCTED_LABOR = "Obstructed labour",
  ANTEPARTUM_HAEMORRHAGE = "Antepartum haemorrhage (APH)",
  POSTPARTUM_HAEMORRHAGE = "Postpartum haemorrhage (PPH)",
  PREECLAMPSIA = "Preeclampsia",
  ECLAMPSIA = "Eclampsia",
  PRETERM_LABOR = "Preterm labour",
  SEVERE_ABDOMINAL_PAIN = "Severe abdominal pain",
  VAGINAL_BLEEDING = "Vaginal bleeding",
  DECREASED_FETAL_MOVEMENT = "Decreased or loss of fetal movement",
  COLLAPSE_CONVULSION = "Collapse / convulsion",
  SEVERE_HEADACHE = "Severe headache (with or without visual disturbance)",
  SEVERE_EDEMA = "Severe edema",
  ECTOPIC_PREGNANCY = "Ectopic pregnancy",
  PLACENTA_PREVIA = "Placenta previa",
  CHORIOAMNIONITIS = "Chorioamnionitis",
  FETOPELVIC_DISPROPORTION = "Fetopelvic disproportion",
  NUCHAL_CORD = "Nuchal cord",
  SHOULDER_DYSTOCIA = "Shoulder dystocia",
  PROLAPSED_UMBILICAL_CORD = "Prolapsed umbilical cord",
  UTERINE_RUPTURE = "Uterine rupture",
  AMNIOTIC_FLUID_EMBOLISM = "Amniotic fluid embolism",
  MECONIUM_PASSED = "Meconium passed",
  PERINATAL_ASPHYXIA = "Perinatal asphyxia",
  INTRAUTERINE_DEATH = "Intrauterine death",
  INVERTED_UTERUS = "Inverted uterus",
  PUERPERAL_SEPSIS = "Puerperal sepsis",
  INTRACTABLE_VOMITING = "Intractable vomiting",
  PHYSICAL_TRAUMA = "Physical trauma",
  MENTAL_TRAUMA = "Mental trauma",
  GASTROENTERITIS = "Gastroenteritis",
  VAGINAL_DISCHARGE = "Vaginal discharge",
  SHORTNESS_OF_BREATH = "Shortness of breath",
  INFECTIONS = "Infections",
  FEVER = "Fever",
  MALARIA = "Malaria",
  JAUNDICE = "Jaundice",
  OTHER = "Other",
  NONE = "None",
}

export const PREGNANCY_COMPLICATION_OPTIONS = Object.values(
  PregnancyComplication,
).map((complication, index) => ({
  id: index + 1,
  label: complication,
  value: complication,
}));

export enum PreviousIllness {
  ACUTE_FLACCID_PARALYSIS = "Acute Flaccid Paralysis",
  MUMPS = "Mumps",
  MEASLES = "Measles",
  NEONATAL_TETANUS = "Neonatal Tetanus",
  DIPHTHERIA = "Diphtheria",
  TUBERCULOSIS = "Tuberculosis",
  TYPHOID_FEVER = "Typhoid Fever",
  PERTUSSIS = "Pertussis",
  ACUTE_DIARRHEA_NON_CHOLERA = "Acute Diarrhea (Non-Cholera)",
  ACUTE_WATERY_DIARRHEA_CHOLERA = "Acute Watery Diarrhea (Cholera)",
  ACUTE_JAUNDICE_SYNDROME = "Acute Jaundice Syndrome (Hepatitis A & E)",
  NAEGLERIA_FOWLERI = "Naegleria Fowleri",
  CHICKENPOX = "Chickenpox",
  PNEUMONIA_LRTI = "Pneumonia/LRTI",
  SARI = "Severe Acute Respiratory Infection (SARI)",
  MALARIA = "Malaria",
  DENGUE_FEVER = "Dengue Fever",
  CHIKUNGUNYA = "Chikungunya",
  CCHF = "Crimean Congo Hemorrhagic Fever (CCHF)",
  HEPATITIS_B_C_D = "Hepatitis (HBV, HCV, HDV)",
  HIV_AIDS = "HIV/AIDS",
  UNUSUAL_EVENT = "Any other unusual event",
  LEISHMANIASIS = "Leishmaniasis",
  BLOODY_DIARRHEA = "Bloody Diarrhea (Dysentery)",
  RABIES = "Rabies",
  STIS = "STIs",
  LEPROSY = "Leprosy",
  MENINGITIS = "Meningitis",
  RHEUMATIC_FEVER = "Rheumatic Fever",
  SNAKE_BITE = "Snake Bite",
  SCABIES = "Scabies",
  PUO = "Pyrexia of Unknown Origin (PUO)",
  HYPERTENSION = "Hypertension",
  DIABETES = "Diabetes",
  HEART_DISEASE = "Ischemic heart disease/MI",
  HEART_FAILURE = "Heart failure",
  STROKE = "Stroke",
  ASTHMA = "Asthma",
  COPD = "COPD",
  HEPATITIS_B = "Hepatitis B",
  HEPATITIS_C = "Hepatitis C",
  CKD = "Chronic kidney disease",
  THYROID_DISEASE = "Thyroid disease",
  DYSLIPIDEMIA = "Dyslipidemia",
  ANEMIA = "Anemia",
  BLEEDING_DISORDER = "Bleeding/clotting disorder",
  PEPTIC_ULCER = "Peptic ulcer",
  EPILEPSY = "Epilepsy / Seizure disorder",
  HIV = "HIV",
  AUTOIMMUNE_DISEASE = "Autoimmune disease",
  CANCER = "Cancer",
  MAJOR_SURGERY = "Major surgery",
  PSYCHIATRIC = "Psychiatric-related",
  OTHER = "Other",
  NONE = "None",
}

export enum PastObstetricComplication {
  HYPERTENSION = "Hypertension",
  DIABETES = "Diabetes",
  HEART_DISEASE = "Heart disease",
  BLEEDING_DISORDER = "Bleeding disorder",
  C_SECTION = "C-Section",
  OBSTRUCTED_LABOUR = "Obstructed labour",
  ANTEPARTUM_HEMORRHAGE = "Antepartum haemorrhage (APH)",
  POSTPARTUM_HEMORRHAGE = "Postpartum haemorrhage (PPH)",
  PREECLAMPSIA = "Preeclampsia",
  ECLAMPSIA = "Eclampsia",
  PRETERM_LABOUR = "Preterm labour",
  SEVERE_ABDOMINAL_PAIN = "Severe abdominal pain",
  VAGINAL_BLEEDING = "Vaginal bleeding",
  DECREASED_FETAL_MOVEMENT = "Decreased or loss of fetal movement",
  COLLAPSE_CONVULSION = "Collapse / convulsion",
  SEVERE_HEADACHE = "Severe headache (with or without visual disturbance)",
  SEVERE_EDEMA = "Severe edema",
  HIGH_RISK_ANC = "Categorized as high risk during ANC",
  ANEMIA_LOW_HB = "Anaemia / low Hb",
  ECTOPIC_PREGNANCY = "Ectopic pregnancy",
  PLACENTA_PREVIA = "Placenta previa",
  CHORIOAMNIONITIS = "Chorioamnionitis",
  FETOPELVIC_DISPROPORTION = "Fetopelvic disproportion",
  NUCHAL_CORD = "Nuchal cord",
  SHOULDER_DYSTOCIA = "Shoulder dystocia",
  PROLAPSED_UMBILICAL_CORD = "Prolapsed umbilical cord",
  UTERINE_RUPTURE = "Uterine rupture",
  AMNIOTIC_FLUID_EMBOLISM = "Amniotic fluid embolism",
  MECONIUM_PASSED = "Meconium passed",
  PERINATAL_ASPHYXIA = "Perinatal asphyxia",
  INTRAUTERINE_DEATH = "Intrauterine death",
  INVERTED_UTERUS = "Inverted uterus",
  PUERPERAL_SEPSIS = "Puerperal sepsis",
  INTRACTABLE_VOMITING = "Intractable vomiting",
  PHYSICAL_TRAUMA = "Physical trauma",
  MENTAL_TRAUMA = "Mental trauma",
  GASTROENTERITIS = "Gastroenteritis",
  VAGINAL_DISCHARGE = "Vaginal discharge",
  SHORTNESS_OF_BREATH = "Shortness of breath",
  INFECTIONS = "Infections",
  FEVER = "Fever",
  MALARIA = "Malaria",
  JAUNDICE = "Jaundice",
  OTHER = "Other",
  NONE = "None",
}

export enum PatientsOpdFinalDiagnosis {
  FOLLOW_UP_REQUIRED = "Requires a follow-up",
  AVAILABLE = "Available",
}

export const PAST_OBSTETRIC_COMPLICATION_OPTIONS = Object.values(
  PastObstetricComplication,
).map((illness, index) => ({
  id: index + 1,
  label: illness,
  value: illness,
}));

export const PREVIOUS_ILLNESS_OPTIONS = Object.values(PreviousIllness).map(
  (illness, index) => ({
    id: index + 1,
    label: illness,
    value: illness,
  }),
);

export enum AllergyType {
  POLLEN = "Pollen",
  DUST = "Dust",
  PENICILLIN = "Penicillin",
  OTHER = "Other",
}

export const ALLERGY_TYPE_OPTIONS = [
  { label: AllergyType.POLLEN, value: AllergyType.POLLEN },
  { label: AllergyType.DUST, value: AllergyType.DUST },
  { label: AllergyType.PENICILLIN, value: AllergyType.PENICILLIN },
  { label: AllergyType.OTHER, value: AllergyType.OTHER },
];

export enum FamilyPlanningMethod {
  PILLS = "Pills",
  INJECTABLES = "Injectables",
  IMPLANT = "Implant",
  IUCD = "IUCD",
}

export const FAMILY_PLANNING_METHOD_OPTIONS = [
  { id: 1, value: FamilyPlanningMethod.PILLS },
  { id: 2, value: FamilyPlanningMethod.INJECTABLES },
  { id: 3, value: FamilyPlanningMethod.IMPLANT },
  { id: 4, value: FamilyPlanningMethod.IUCD },
];

export enum WarningSign {
  INTRACTABLE_VOMITING = "Intractable vomiting",
  PHYSICAL_TRAUMA = "Physical Trauma",
  MENTAL_TRAUMA = "Mental Trauma",
  SEVERE_HEADACHE = "Severe Headache",
  GASTROENTERITIS = "Gastroenteritis",
  SEVERE_ABDOMEN_PAIN = "Severe Abdomen Pain",
  VAGINAL_DISCHARGE = "Vaginal Discharge",
  SHORTNESS_OF_BREATH = "Shortness of breath",
  LOSS_OF_FETAL_MOVEMENT = "Loss of fetal movement",
  INFECTIONS = "Infections",
  FEVER = "Fever",
  MALARIA = "Malaria",
  JAUNDICE = "Jaundice",
  OTHER = "Other",
  NONE = "None",
}

export const WARNING_SIGNS_PNC = [
  { label: "Heavy vaginal bleeding", value: "Heavy vaginal bleeding" },
  { label: "Respiratory difficulty", value: "Respiratory difficulty" },
  {
    label: "Convulsions/loss of consciousness",
    value: "Convulsions/loss of consciousness",
  },
  {
    label: "Severe headache with blurred vision",
    value: "Severe headache with blurred vision",
  },
  { label: "Severe abdominal pain", value: "Severe abdominal pain" },
  {
    label: "Foul smelling vaginal discharge",
    value: "Foul smelling vaginal discharge",
  },
  { label: "Urinary problem", value: "Urinary problem" },
  { label: "Fever", value: "Fever" },
  { label: "PPD", value: "PPD" },
  { label: "Vaginal tears", value: "Vaginal tears" },
  { label: "Pain in calf", value: "Pain in calf" },
  {
    label: "Hallucinations/Indication of self harm tendencies",
    value: "Hallucinations/Indication of self harm tendencies",
  },
  { label: "Other", value: "Other" },
  { label: "None", value: "None" },
] as const;

export const WARNING_SIGN_OPTIONS = [
  {
    id: 1,
    value: WarningSign.INTRACTABLE_VOMITING,
    label: WarningSign.INTRACTABLE_VOMITING,
  },
  {
    id: 2,
    value: WarningSign.PHYSICAL_TRAUMA,
    label: WarningSign.PHYSICAL_TRAUMA,
  },
  { id: 3, value: WarningSign.MENTAL_TRAUMA, label: WarningSign.MENTAL_TRAUMA },
  {
    id: 4,
    value: WarningSign.SEVERE_HEADACHE,
    label: WarningSign.SEVERE_HEADACHE,
  },
  {
    id: 5,
    value: WarningSign.GASTROENTERITIS,
    label: WarningSign.GASTROENTERITIS,
  },
  {
    id: 6,
    value: WarningSign.SEVERE_ABDOMEN_PAIN,
    label: WarningSign.SEVERE_ABDOMEN_PAIN,
  },
  {
    id: 7,
    value: WarningSign.VAGINAL_DISCHARGE,
    label: WarningSign.VAGINAL_DISCHARGE,
  },
  {
    id: 8,
    value: WarningSign.SHORTNESS_OF_BREATH,
    label: WarningSign.SHORTNESS_OF_BREATH,
  },
  {
    id: 9,
    value: WarningSign.LOSS_OF_FETAL_MOVEMENT,
    label: WarningSign.LOSS_OF_FETAL_MOVEMENT,
  },
  { id: 10, value: WarningSign.INFECTIONS, label: WarningSign.INFECTIONS },
  { id: 11, value: WarningSign.FEVER, label: WarningSign.FEVER },
  { id: 12, value: WarningSign.MALARIA, label: WarningSign.MALARIA },
  { id: 13, value: WarningSign.JAUNDICE, label: WarningSign.JAUNDICE },
  { id: 14, value: WarningSign.OTHER, label: WarningSign.OTHER },
  { id: 15, value: WarningSign.NONE, label: WarningSign.NONE },
];

export const WARNING_SIGNS_ANC = [
  { label: "Hypertension", value: "Hypertension" },
  { label: "Diabetes", value: "Diabetes" },
  { label: "Heart disease", value: "Heart disease" },
  { label: "Bleeding disorder", value: "Bleeding disorder" },
  { label: "C-section", value: "C-section" },
  { label: "Obstructed labour", value: "Obstructed labour" },
  {
    label: "Antepartum haemorrhage (APH)",
    value: "Antepartum haemorrhage (APH)",
  },
  {
    label: "Postpartum haemorrhage (PPH)",
    value: "Postpartum haemorrhage (PPH)",
  },
  { label: "Preeclampsia", value: "Preeclampsia" },
  { label: "Eclampsia", value: "Eclampsia" },
  { label: "Preterm labour", value: "Preterm labour" },
  { label: "Severe abdominal pain", value: "Severe abdominal pain" },
  { label: "Vaginal bleeding", value: "Vaginal bleeding" },
  {
    label: "Decreased or loss of fetal movement",
    value: "Decreased or loss of fetal movement",
  },
  { label: "Collapse / convulsion", value: "Collapse / convulsion" },
  {
    label: "Severe headache (with or without visual disturbance)",
    value: "Severe headache (with or without visual disturbance)",
  },
  { label: "Severe edema", value: "Severe edema" },
  {
    label: "Categorized as high risk during ANC",
    value: "Categorized as high risk during ANC",
  },
  { label: "Anaemia / low Hb", value: "Anaemia / low Hb" },
  { label: "Ectopic pregnancy", value: "Ectopic pregnancy" },
  { label: "Placenta previa", value: "Placenta previa" },
  { label: "Chorioamnionitis", value: "Chorioamnionitis" },
  { label: "Fetopelvic disproportion", value: "Fetopelvic disproportion" },
  { label: "Nuchal cord", value: "Nuchal cord" },
  { label: "Shoulder dystocia", value: "Shoulder dystocia" },
  { label: "Prolapsed umbilical cord", value: "Prolapsed umbilical cord" },
  { label: "Uterine rupture", value: "Uterine rupture" },
  { label: "Amniotic fluid embolism", value: "Amniotic fluid embolism" },
  { label: "Meconium passed", value: "Meconium passed" },
  { label: "Perinatal asphyxia", value: "Perinatal asphyxia" },
  { label: "Intrauterine death", value: "Intrauterine death" },
  { label: "Inverted uterus", value: "Inverted uterus" },
  { label: "Puerperal sepsis", value: "Puerperal sepsis" },
  { label: "Intractable vomiting", value: "Intractable vomiting" },
  { label: "Physical trauma", value: "Physical trauma" },
  { label: "Mental trauma", value: "Mental trauma" },
  { label: "Gastroenteritis", value: "Gastroenteritis" },
  { label: "Vaginal discharge", value: "Vaginal discharge" },
  { label: "Shortness of breath", value: "Shortness of breath" },
  { label: "Infections", value: "Infections" },
  { label: "Fever", value: "Fever" },
  { label: "Malaria", value: "Malaria" },
  { label: "Jaundice", value: "Jaundice" },
  { label: "Other", value: "Other" },
  { label: "None", value: "None" },
];

export enum PregnancyType {
  SINGLE = "Single",
  TWINS = "Twins",
  TRIPLETS = "Triplets",
  QUADRUPLETS = "Quadruplets",
}

export const PREGNANCY_TYPE_OPTIONS = [
  { id: 1, value: PregnancyType.SINGLE, label: PregnancyType.SINGLE },
  { id: 2, value: PregnancyType.TWINS, label: PregnancyType.TWINS },
  { id: 3, value: PregnancyType.TRIPLETS, label: PregnancyType.TRIPLETS },
  { id: 4, value: PregnancyType.QUADRUPLETS, label: PregnancyType.QUADRUPLETS },
];

export enum FetalMovement {
  PRESENT = "Present",
  ABSENT = "Absent",
}

export const FETAL_MOVEMENT_OPTIONS = [
  { id: 1, value: FetalMovement.PRESENT, label: FetalMovement.PRESENT },
  { id: 2, value: FetalMovement.ABSENT, label: FetalMovement.ABSENT },
];

export enum FetalPresentation {
  LONGITUDINAL = "Longitudinal",
  CEPHALIC = "Cephalic",
  BREECH = "Breech",
  SHOULDER = "Shoulder",
  TRANSVERSE = "Transverse",
}

export const FETAL_PRESENTATION_OPTIONS = [
  {
    id: 1,
    value: FetalPresentation.LONGITUDINAL,
    label: FetalPresentation.LONGITUDINAL,
  },
  {
    id: 2,
    value: FetalPresentation.CEPHALIC,
    label: FetalPresentation.CEPHALIC,
  },
  { id: 3, value: FetalPresentation.BREECH, label: FetalPresentation.BREECH },
  {
    id: 4,
    value: FetalPresentation.SHOULDER,
    label: FetalPresentation.SHOULDER,
  },
  {
    id: 5,
    value: FetalPresentation.TRANSVERSE,
    label: FetalPresentation.TRANSVERSE,
  },
];

export enum FetalAttitude {
  FLEXED = "Flexed",
  NEUTRAL = "Neutral",
  EXTENDED = "Extended",
}

export const FETAL_ATTITUDE_OPTIONS = [
  { id: 1, value: FetalAttitude.FLEXED, label: FetalAttitude.FLEXED },
  { id: 2, value: FetalAttitude.NEUTRAL, label: FetalAttitude.NEUTRAL },
  { id: 3, value: FetalAttitude.EXTENDED, label: FetalAttitude.EXTENDED },
];

export enum PlacentaPosition {
  POSTERIOR = "Posterior",
  ANTERIOR = "Anterior",
  FUNDAL = "Fundal",
  LATERAL = "Lateral",
}

export const PLACENTA_POSITION_OPTIONS = [
  {
    id: 1,
    value: PlacentaPosition.POSTERIOR,
    label: PlacentaPosition.POSTERIOR,
  },
  { id: 2, value: PlacentaPosition.ANTERIOR, label: PlacentaPosition.ANTERIOR },
  { id: 3, value: PlacentaPosition.FUNDAL, label: PlacentaPosition.FUNDAL },
  { id: 4, value: PlacentaPosition.LATERAL, label: PlacentaPosition.LATERAL },
];

export enum UltrasoundFinding {
  ECTOPIC_PREGNANCY = "Ectopic Pregnancies Detected",
  TWIN_PREGNANCY = "Twin Pregnancies Detected",
  MISSED_ABORTION = "Missed Abortion",
  RPOC = "RPOC after Termination of pregnancy",
  OLIGOHYDRAMNIOS = "Oligohydramnios",
  CONGENITAL_ANOMALIES = "Congenital Anomalies",
  NEURAL_TUBE_DEFECTS = "Neural Tube Defects",
  PLACENTA_PREVIA = "Placenta Previa",
  PLACENTA_ABRUPTIO = "Placenta Abruptio",
  MOLAR_PREGNANCY = "Molar Pregnancy",
  INTRAUTERINE_DEATH = "Intrauterine Death",
  POLYHYDRAMNIOS = "Polyhydramnios",
  IUGR = "Intrauterine Growth Restriction (IUGR)",
  OTHERS = "Others",
  NORMAL = "Normal",
}

export const ULTRASOUND_FINDING_OPTIONS = [
  {
    id: 1,
    value: UltrasoundFinding.ECTOPIC_PREGNANCY,
    label: UltrasoundFinding.ECTOPIC_PREGNANCY,
  },
  {
    id: 2,
    value: UltrasoundFinding.TWIN_PREGNANCY,
    label: UltrasoundFinding.TWIN_PREGNANCY,
  },
  {
    id: 3,
    value: UltrasoundFinding.MISSED_ABORTION,
    label: UltrasoundFinding.MISSED_ABORTION,
  },
  { id: 4, value: UltrasoundFinding.RPOC, label: UltrasoundFinding.RPOC },
  {
    id: 5,
    value: UltrasoundFinding.OLIGOHYDRAMNIOS,
    label: UltrasoundFinding.OLIGOHYDRAMNIOS,
  },
  {
    id: 6,
    value: UltrasoundFinding.CONGENITAL_ANOMALIES,
    label: UltrasoundFinding.CONGENITAL_ANOMALIES,
  },
  {
    id: 7,
    value: UltrasoundFinding.NEURAL_TUBE_DEFECTS,
    label: UltrasoundFinding.NEURAL_TUBE_DEFECTS,
  },
  {
    id: 8,
    value: UltrasoundFinding.PLACENTA_PREVIA,
    label: UltrasoundFinding.PLACENTA_PREVIA,
  },
  {
    id: 9,
    value: UltrasoundFinding.PLACENTA_ABRUPTIO,
    label: UltrasoundFinding.PLACENTA_ABRUPTIO,
  },
  {
    id: 10,
    value: UltrasoundFinding.MOLAR_PREGNANCY,
    label: UltrasoundFinding.MOLAR_PREGNANCY,
  },
  {
    id: 11,
    value: UltrasoundFinding.INTRAUTERINE_DEATH,
    label: UltrasoundFinding.INTRAUTERINE_DEATH,
  },
  {
    id: 12,
    value: UltrasoundFinding.POLYHYDRAMNIOS,
    label: UltrasoundFinding.POLYHYDRAMNIOS,
  },
  { id: 13, value: UltrasoundFinding.IUGR, label: UltrasoundFinding.IUGR },
  { id: 14, value: UltrasoundFinding.OTHERS, label: UltrasoundFinding.OTHERS },
  { id: 15, value: UltrasoundFinding.NORMAL, label: UltrasoundFinding.NORMAL },
];

export enum CTGReactivity {
  NORMAL_REACTIVE = "Normal/Reactive",
  SUSPICIOUS = "Suspicious",
  ABNORMAL_NON_REACTIVE = "Abnormal/Non-Reactive",
}

export const CTG_REACTIVITY_OPTIONS = [
  {
    id: 1,
    value: CTGReactivity.NORMAL_REACTIVE,
    label: CTGReactivity.NORMAL_REACTIVE,
  },
  { id: 2, value: CTGReactivity.SUSPICIOUS, label: CTGReactivity.SUSPICIOUS },
  {
    id: 3,
    value: CTGReactivity.ABNORMAL_NON_REACTIVE,
    label: CTGReactivity.ABNORMAL_NON_REACTIVE,
  },
];

export enum SupplementType {
  IRON_FOLIC_ACID = "Iron-Folic Acid, Iron, Folic Acid",
  CALCIUM = "Calcium supplements",
  MULTIPLE_MICRONUTRIENT = "Multiple Micronutrient Supplements",
}

export const SUPPLEMENT_TYPE_OPTIONS = [
  {
    id: 1,
    value: SupplementType.IRON_FOLIC_ACID,
    label: SupplementType.IRON_FOLIC_ACID,
  },
  { id: 2, value: SupplementType.CALCIUM, label: SupplementType.CALCIUM },
  {
    id: 3,
    value: SupplementType.MULTIPLE_MICRONUTRIENT,
    label: SupplementType.MULTIPLE_MICRONUTRIENT,
  },
];

export enum RouteOfAdministration {
  ORAL = "Oral",
  INTRAVENOUS = "Intravenous",
  INTRAMUSCULAR = "Intramuscular",
  SUBCUTANEOUS = "Subcutaneous",
  TOPICAL = "Topical",
  OTHER = "Other",
}

export const MEDICINE_STRENGTHS = [
  { label: "50 mg", value: "50mg" },
  { label: "75 mg", value: "75mg" },
  { label: "100 mg", value: "100mg" },
  { label: "150 mg", value: "150mg" },
  { label: "250 mg", value: "250mg" },
  { label: "300 mg", value: "300mg" },
  { label: "500 mg", value: "500mg" },
  { label: "1 g", value: "1g" },
  { label: "2 g", value: "2g" },
  { label: "5 g", value: "5g" },
];

export const ROUTE_OF_ADMINISTRATION_OPTIONS = [
  {
    id: 1,
    value: RouteOfAdministration.ORAL,
    label: RouteOfAdministration.ORAL,
  },
  {
    id: 2,
    value: RouteOfAdministration.INTRAVENOUS,
    label: RouteOfAdministration.INTRAVENOUS,
  },
  {
    id: 3,
    value: RouteOfAdministration.INTRAMUSCULAR,
    label: RouteOfAdministration.INTRAMUSCULAR,
  },
  {
    id: 4,
    value: RouteOfAdministration.SUBCUTANEOUS,
    label: RouteOfAdministration.SUBCUTANEOUS,
  },
  {
    id: 5,
    value: RouteOfAdministration.TOPICAL,
    label: RouteOfAdministration.TOPICAL,
  },
  {
    id: 6,
    value: RouteOfAdministration.OTHER,
    label: RouteOfAdministration.OTHER,
  },
];

export enum UrineAlbuminResult {
  NEGATIVE = "Negative",
  POSITIVE = "Positive",
}

export const URINE_ALBUMIN_OPTIONS = [
  {
    id: 1,
    value: UrineAlbuminResult.NEGATIVE,
    label: UrineAlbuminResult.NEGATIVE,
  },
  {
    id: 2,
    value: UrineAlbuminResult.POSITIVE,
    label: UrineAlbuminResult.POSITIVE,
  },
];

export enum LabTestType {
  CBC = "Complete Blood Count (CBC)",
  ESR = "ESR",
  RBS = "Random Blood Sugar (RBS)",
  FBS = "Fasting Blood Sugar (FBS)",
  HBA1C = "HbA1c",
  RENAL_FUNCTION = "Renal Function Tests (Urea, Creatinine)",
  ELECTROLYTES = "Electrolytes (Na, K, Cl)",
  LFT = "Liver Function Tests (LFTs)",
  LIPID_PROFILE = "Lipid Profile",
  URINE_ROUTINE = "Urine Routine Examination (Urine RE)",
  URINE_PREGNANCY = "Urine Pregnancy Test (β-hCG)",
  STOOL_ROUTINE = "Stool Routine Examination",
  MALARIA_TEST = "Malaria Test",
  DENGUE = "Dengue NS1 / IgM",
  HEPATITIS_B = "Hepatitis B (HBsAg)",
  HEPATITIS_C = "Hepatitis C (Anti-HCV)",
  HIV_TEST = "HIV Test",
  TFT = "Thyroid Function Test (TSH)",
  COVID_TEST = "COVID-19 Antigen / PCR",
  BLOOD_GROUP = "Blood Group & Rh Type",
  OTHER = "Other",
}

export const LAB_TEST_TYPE_OPTIONS = Object.values(LabTestType).map(
  (test, index) => ({
    id: index + 1,
    label: test,
    value: test,
  }),
);

// Delivery dropdowns

export enum MembraneRuptureHours {
  ONE_TO_EIGHTEEN = "1-18 hours",
  MORE_THAN_EIGHTEEN = "More than 18 hours",
}

export const MEMBRANE_RUPTURE_HOURS_OPTIONS = [
  { id: 1, value: MembraneRuptureHours.ONE_TO_EIGHTEEN, label: "1-18 hours" },
  {
    id: 2,
    value: MembraneRuptureHours.MORE_THAN_EIGHTEEN,
    label: "More than 18 hours",
  },
];

export enum AmnioticFluidColor {
  CLEAR = "Clear",
  YELLOW = "Yellow",
  GREEN = "Green",
}

export const AMNIOTIC_FLUID_COLOR_OPTIONS = [
  { id: 1, value: AmnioticFluidColor.CLEAR, label: AmnioticFluidColor.CLEAR },
  { id: 2, value: AmnioticFluidColor.YELLOW, label: AmnioticFluidColor.YELLOW },
  { id: 3, value: AmnioticFluidColor.GREEN, label: AmnioticFluidColor.GREEN },
];

export enum DeliverySymptom {
  SEVERE_VAGINAL_BLEEDING = "Severe vaginal bleeding",
  BREATHING_DIFFICULTY = "Breathing difficulty",
  HIGH_FEVER = "High fever (above 101 F)",
  SEVERE_HEADACHE = "Severe headache",
  BLURRED_VISION = "Blurred vision",
  CONVULSIONS = "Convulsions/loss of consciousness",
  FOUL_DISCHARGE = "Foul-smelling discharge/fluid from vagina",
  DECREASED_FETAL_MOVEMENT = "Decrease/absent fetal movements",
  MECONIUM_FLUID = "Leaking of greenish/brownish (meconium-stained) fluid from the vagina",
  NONE = "None",
}

export const DELIVERY_SYMPTOM_OPTIONS = [
  {
    id: 1,
    label: DeliverySymptom.SEVERE_VAGINAL_BLEEDING,
    value: DeliverySymptom.SEVERE_VAGINAL_BLEEDING,
  },
  {
    id: 2,
    label: DeliverySymptom.BREATHING_DIFFICULTY,
    value: DeliverySymptom.BREATHING_DIFFICULTY,
  },
  {
    id: 3,
    label: DeliverySymptom.HIGH_FEVER,
    value: DeliverySymptom.HIGH_FEVER,
  },
  {
    id: 4,
    label: DeliverySymptom.SEVERE_HEADACHE,
    value: DeliverySymptom.SEVERE_HEADACHE,
  },
  {
    id: 5,
    label: DeliverySymptom.BLURRED_VISION,
    value: DeliverySymptom.BLURRED_VISION,
  },
  {
    id: 6,
    label: DeliverySymptom.CONVULSIONS,
    value: DeliverySymptom.CONVULSIONS,
  },
  {
    id: 7,
    label: DeliverySymptom.FOUL_DISCHARGE,
    value: DeliverySymptom.FOUL_DISCHARGE,
  },
  {
    id: 8,
    label: DeliverySymptom.DECREASED_FETAL_MOVEMENT,
    value: DeliverySymptom.DECREASED_FETAL_MOVEMENT,
  },
  {
    id: 9,
    label: DeliverySymptom.MECONIUM_FLUID,
    value: DeliverySymptom.MECONIUM_FLUID,
  },
  {
    id: 10,
    label: DeliverySymptom.NONE,
    value: DeliverySymptom.NONE,
  },
];

export enum DeliveryReferral {
  MOTHER = "Mother",
  CHILD = "Child",
}

export const DELIVERY_REFERRAL = [
  { id: 1, label: DeliveryReferral.MOTHER, value: DeliveryReferral.MOTHER },
  { id: 2, label: DeliveryReferral.CHILD, value: DeliveryReferral.CHILD },
];

export const DELIVERY_REFERRAL_CHILD = [
  { id: 1, label: "baby 1", value: "FIRST_CHILD" },
  { id: 2, label: "baby 2", value: "SECOND_CHILD" },
];

export enum TypeOfDelivery {
  NORMAL = "Normal Vaginal Delivery",
  ASSISTED = "Assisted Delivery (Vacuum/Forceps)",
  C_SECTION = "C-Section",
  MISCARRIAGE = "Miscarriage",
  INDUCED_ABORTION = "Induced Abortion",
}

export const TYPE_OF_DELIVERY_OPTIONS = [
  { id: 1, value: TypeOfDelivery.NORMAL, label: TypeOfDelivery.NORMAL },
  {
    id: 2,
    value: TypeOfDelivery.ASSISTED,
    label: TypeOfDelivery.ASSISTED,
  },
  { id: 3, value: TypeOfDelivery.C_SECTION, label: TypeOfDelivery.C_SECTION },
  {
    id: 4,
    value: TypeOfDelivery.MISCARRIAGE,
    label: TypeOfDelivery.MISCARRIAGE,
  },
  {
    id: 5,
    value: TypeOfDelivery.INDUCED_ABORTION,
    label: TypeOfDelivery.INDUCED_ABORTION,
  },
];

export enum CSectionReason {
  PREVIOUS_CESAREAN = "Previous cesarean",
  ARREST_OF_LABOUR = "Arrest of labour",
  FETAL_DISTRESS = "Fetal distress",
  PLACENTA_PREVIA = "Placenta previa",
  MALPRESENTATION = "Malpresentation",
  PREECLAMPSIA_ECLAMPSIA = "Pre-eclampsia/eclampsia",
  FAILED_INSTRUMENTAL = "Failed instrumental delivery",
  OTHER = "Other",
}

export const C_SECTION_REASON_OPTIONS = [
  {
    id: 1,
    value: CSectionReason.PREVIOUS_CESAREAN,
    label: CSectionReason.PREVIOUS_CESAREAN,
  },
  {
    id: 2,
    value: CSectionReason.ARREST_OF_LABOUR,
    label: CSectionReason.ARREST_OF_LABOUR,
  },
  {
    id: 3,
    value: CSectionReason.FETAL_DISTRESS,
    label: CSectionReason.FETAL_DISTRESS,
  },
  {
    id: 4,
    value: CSectionReason.PLACENTA_PREVIA,
    label: CSectionReason.PLACENTA_PREVIA,
  },
  {
    id: 5,
    value: CSectionReason.MALPRESENTATION,
    label: CSectionReason.MALPRESENTATION,
  },
  {
    id: 6,
    value: CSectionReason.PREECLAMPSIA_ECLAMPSIA,
    label: CSectionReason.PREECLAMPSIA_ECLAMPSIA,
  },
  {
    id: 7,
    value: CSectionReason.FAILED_INSTRUMENTAL,
    label: CSectionReason.FAILED_INSTRUMENTAL,
  },
  { id: 8, value: CSectionReason.OTHER, label: CSectionReason.OTHER },
];

export enum MotherCondition {
  ALIVE_HEALTHY = "Alive and healthy",
  ALIVE_UNHEALTHY = "Alive and unhealthy",
  DEAD = "Dead",
  REFERRED_DURING_DELIVERY = "Referred during delivery",
}

export const MOTHER_CONDITION_OPTIONS = [
  {
    id: 1,
    value: MotherCondition.ALIVE_HEALTHY,
    label: MotherCondition.ALIVE_HEALTHY,
  },
  {
    id: 2,
    value: MotherCondition.ALIVE_UNHEALTHY,
    label: MotherCondition.ALIVE_UNHEALTHY,
  },
  { id: 3, value: MotherCondition.DEAD, label: MotherCondition.DEAD },
  {
    id: 4,
    value: MotherCondition.REFERRED_DURING_DELIVERY,
    label: MotherCondition.REFERRED_DURING_DELIVERY,
  },
];

export enum PostDeliverySymptom {
  FOUL_DISCHARGE = "Foul smelling vaginal discharge",
  SEVERE_BLEEDING = "Severe bleeding",
  THIRD_DEGREE_TEAR = "Third degree perineal tear",
  FOURTH_DEGREE_TEAR = "Fourth degree perineal tear",
  NONE = "None",
}

export const POST_DELIVERY_SYMPTOM_OPTIONS = [
  {
    id: 1,
    label: PostDeliverySymptom.FOUL_DISCHARGE,
    value: PostDeliverySymptom.FOUL_DISCHARGE,
  },
  {
    id: 2,
    label: PostDeliverySymptom.SEVERE_BLEEDING,
    value: PostDeliverySymptom.SEVERE_BLEEDING,
  },
  {
    id: 3,
    label: PostDeliverySymptom.THIRD_DEGREE_TEAR,
    value: PostDeliverySymptom.THIRD_DEGREE_TEAR,
  },
  {
    id: 4,
    label: PostDeliverySymptom.FOURTH_DEGREE_TEAR,
    value: PostDeliverySymptom.FOURTH_DEGREE_TEAR,
  },
  {
    id: 5,
    label: PostDeliverySymptom.NONE,
    value: PostDeliverySymptom.NONE,
  },
];

export enum ImmediateStep {
  OXYTOCIN = "Oxytocin administered within 1 min",
  PLACENTA = "Placenta and membrane delivered",
  WELL_CONTRACTED = "Well contracted uterus",
  EARLY_INITIATION = "Early initiation of breastfeeding process",
}

export const IMMEDIATE_STEPS_OPTIONS = [
  {
    id: 1,
    label: "Oxytocin administered within 1 min",
    value: ImmediateStep.OXYTOCIN,
  },
  {
    id: 2,
    label: "Placenta and membrane delivered",
    value: ImmediateStep.PLACENTA,
  },
  {
    id: 3,
    label: "Well contracted uterus",
    value: ImmediateStep.WELL_CONTRACTED,
  },
  {
    id: 4,
    label: "Early initiation of breastfeeding process",
    value: ImmediateStep.EARLY_INITIATION,
  },
];

export enum DeliveryComplication {
  APH = "APH",
  PPH = "PPH",
  CORD_PROLAPSE = "Cord prolapse",
  ECLAMPSIA = "Eclampsia",
  PREECLAMPSIA = "Pre-eclampsia",
  SHOULDER_DYSTOCIA = "Shoulder dystocia",
  PROLONGED_OBSTRUCTED_LABOR = "Prolonged / Obstructed Labor",
  RUPTURE_UTERUS = "Rupture uterus",
  SEPSIS = "Sepsis",
  OTHER = "Other",
  NONE = "None",
}

export const DELIVERY_COMPLICATION_OPTIONS = [
  { id: 1, label: DeliveryComplication.APH, value: DeliveryComplication.APH },
  { id: 2, label: DeliveryComplication.PPH, value: DeliveryComplication.PPH },
  {
    id: 3,
    label: DeliveryComplication.CORD_PROLAPSE,
    value: DeliveryComplication.CORD_PROLAPSE,
  },
  {
    id: 4,
    label: DeliveryComplication.ECLAMPSIA,
    value: DeliveryComplication.ECLAMPSIA,
  },
  {
    id: 5,
    label: DeliveryComplication.PREECLAMPSIA,
    value: DeliveryComplication.PREECLAMPSIA,
  },
  {
    id: 6,
    label: DeliveryComplication.SHOULDER_DYSTOCIA,
    value: DeliveryComplication.SHOULDER_DYSTOCIA,
  },
  {
    id: 7,
    label: DeliveryComplication.PROLONGED_OBSTRUCTED_LABOR,
    value: DeliveryComplication.PROLONGED_OBSTRUCTED_LABOR,
  },
  {
    id: 8,
    label: DeliveryComplication.RUPTURE_UTERUS,
    value: DeliveryComplication.RUPTURE_UTERUS,
  },
  {
    id: 9,
    label: DeliveryComplication.SEPSIS,
    value: DeliveryComplication.SEPSIS,
  },
  {
    id: 10,
    label: DeliveryComplication.OTHER,
    value: DeliveryComplication.OTHER,
  },
  {
    id: 11,
    label: DeliveryComplication.NONE,
    value: DeliveryComplication.NONE,
  },
];

export enum MedicineAdministered {
  ANTIHYPERTENSIVE = "Antihypertensive",
  ANTIBIOTICS = "Antibiotics",
  MAGNESIUM_SULPHATE = "Magnesium sulphate",
  INJ_HYDROCORTISONE = "Inj Hydrocortisone",
  INJ_HEMACEL = "Inj Hemacel",
  INJ_DEXAMETHASONE = "Inj Dexamethasone",
  INJ_SODA_BICARB = "Inj Soda Bicarb",
  VENTOLIN_SOLUTION = "Ventolin solution",
  INJ_ADRENALINE = "Inj Adrenaline",
  INJ_RINGER_LACTATE = "Inj ringer lactate",
  INJ_OXYTOCIN = "Inj oxytocin",
  INJ_MISOPROSTO = "Inj misoprosto",
  INJ_TRANSAMINE = "Inj transamine",
}

export const MEDICINE_ADMINISTERED_OPTIONS = [
  {
    id: 1,
    label: MedicineAdministered.ANTIHYPERTENSIVE,
    value: MedicineAdministered.ANTIHYPERTENSIVE,
  },
  {
    id: 2,
    label: MedicineAdministered.ANTIBIOTICS,
    value: MedicineAdministered.ANTIBIOTICS,
  },
  {
    id: 3,
    label: MedicineAdministered.MAGNESIUM_SULPHATE,
    value: MedicineAdministered.MAGNESIUM_SULPHATE,
  },
  {
    id: 4,
    label: MedicineAdministered.INJ_HYDROCORTISONE,
    value: MedicineAdministered.INJ_HYDROCORTISONE,
  },
  {
    id: 5,
    label: MedicineAdministered.INJ_HEMACEL,
    value: MedicineAdministered.INJ_HEMACEL,
  },
  {
    id: 6,
    label: MedicineAdministered.INJ_DEXAMETHASONE,
    value: MedicineAdministered.INJ_DEXAMETHASONE,
  },
  {
    id: 7,
    label: MedicineAdministered.INJ_SODA_BICARB,
    value: MedicineAdministered.INJ_SODA_BICARB,
  },
  {
    id: 8,
    label: MedicineAdministered.VENTOLIN_SOLUTION,
    value: MedicineAdministered.VENTOLIN_SOLUTION,
  },
  {
    id: 9,
    label: MedicineAdministered.INJ_ADRENALINE,
    value: MedicineAdministered.INJ_ADRENALINE,
  },
  {
    id: 10,
    label: MedicineAdministered.INJ_RINGER_LACTATE,
    value: MedicineAdministered.INJ_RINGER_LACTATE,
  },
  {
    id: 11,
    label: MedicineAdministered.INJ_OXYTOCIN,
    value: MedicineAdministered.INJ_OXYTOCIN,
  },
  {
    id: 12,
    label: MedicineAdministered.INJ_MISOPROSTO,
    value: MedicineAdministered.INJ_MISOPROSTO,
  },
  {
    id: 13,
    label: MedicineAdministered.INJ_TRANSAMINE,
    value: MedicineAdministered.INJ_TRANSAMINE,
  },
];

export enum CauseOfDeath {
  APH = "APH",
  PPH = "PPH",
  CORD_PROLAPSE = "Cord prolapse",
  ECLAMPSIA = "Eclampsia",
  PREECLAMPSIA = "Pre-eclampsia",
  SHOULDER_DYSTOCIA = "Shoulder dystocia",
  PROLONGED_OBSTRUCTED_LABOR = "Prolonged / Obstructed Labor",
  RUPTURE_UTERUS = "Rupture uterus",
  SEPSIS = "Sepsis",
  OTHER_OBSTETRIC = "Other obstetric cause",
  OTHER_NON_OBSTETRIC = "Other non-obstetric cause",
}

export const CAUSE_OF_DEATH_OPTIONS = [
  { id: 1, label: CauseOfDeath.APH, value: CauseOfDeath.APH },
  { id: 2, label: CauseOfDeath.PPH, value: CauseOfDeath.PPH },
  {
    id: 3,
    label: CauseOfDeath.CORD_PROLAPSE,
    value: CauseOfDeath.CORD_PROLAPSE,
  },
  { id: 4, label: CauseOfDeath.ECLAMPSIA, value: CauseOfDeath.ECLAMPSIA },
  { id: 5, label: CauseOfDeath.PREECLAMPSIA, value: CauseOfDeath.PREECLAMPSIA },
  {
    id: 6,
    label: CauseOfDeath.SHOULDER_DYSTOCIA,
    value: CauseOfDeath.SHOULDER_DYSTOCIA,
  },
  {
    id: 7,
    label: CauseOfDeath.PROLONGED_OBSTRUCTED_LABOR,
    value: CauseOfDeath.PROLONGED_OBSTRUCTED_LABOR,
  },
  {
    id: 8,
    label: CauseOfDeath.RUPTURE_UTERUS,
    value: CauseOfDeath.RUPTURE_UTERUS,
  },
  { id: 9, label: CauseOfDeath.SEPSIS, value: CauseOfDeath.SEPSIS },
  {
    id: 10,
    label: CauseOfDeath.OTHER_OBSTETRIC,
    value: CauseOfDeath.OTHER_OBSTETRIC,
  },
  {
    id: 11,
    label: CauseOfDeath.OTHER_NON_OBSTETRIC,
    value: CauseOfDeath.OTHER_NON_OBSTETRIC,
  },
];

export enum NewbornSex {
  MALE = "M",
  FEMALE = "F",
}

export const NEWBORN_SEX_OPTIONS = [
  { id: 1, label: "Male", value: NewbornSex.MALE },
  { id: 2, label: "Female", value: NewbornSex.FEMALE },
];

export enum NewbornCondition {
  ALIVE_HEALTHY = "Alive and healthy",
  ALIVE_UNHEALTHY = "Alive and unhealthy",
  DEAD_AFTER_DELIVERY = "Dead after delivery",
  INTRAUTERINE_DEATH = "Intrauterine death",
}

export const NEWBORN_CONDITION_OPTIONS = [
  {
    id: 1,
    value: NewbornCondition.ALIVE_HEALTHY,
    label: NewbornCondition.ALIVE_HEALTHY,
  },
  {
    id: 2,
    value: NewbornCondition.ALIVE_UNHEALTHY,
    label: NewbornCondition.ALIVE_UNHEALTHY,
  },
  {
    id: 3,
    value: NewbornCondition.DEAD_AFTER_DELIVERY,
    label: NewbornCondition.DEAD_AFTER_DELIVERY,
  },
  {
    id: 4,
    value: NewbornCondition.INTRAUTERINE_DEATH,
    label: NewbornCondition.INTRAUTERINE_DEATH,
  },
];

export enum NewbornSymptom {
  RESPIRATORY_DISTRESS = "Respiratory distress",
  MOANING = "Moaning",
  CONVULSIONS = "Convulsions",
  POOR_MOVEMENT = "Poor movement on stimulation",
  NOT_BREASTFEEDING = "Not breastfeeding well",
  JAUNDICE = "Jaundice",
  OTHER = "Other",
  NONE = "None",
}

//Family Planning Options
export const CLIENT_TYPE_OPTIONS = [
  { id: 1, value: "Walk-in", label: "Walk-in" },
  { id: 2, value: "Referred by LHW", label: "Referred by LHW" },
  {
    id: 3,
    value: "Referred by health provider",
    label: "Referred by health provider",
  },
];

export const LAST_PREGNANCY_OPTIONS = [
  { id: 1, value: "Within 48 hours", label: "Within 48 hours" },
  {
    id: 2,
    value: "More than 48 hours to 6 weeks",
    label: "More than 48 hours to 6 weeks",
  },
  {
    id: 3,
    value: "More than 6 weeks to 6 months",
    label: "More than 6 weeks to 6 months",
  },
  {
    id: 4,
    value: "More than 6 months to 1 year",
    label: "More than 6 months to 1 year",
  },
  {
    id: 5,
    value: "More than 1 year to 2 years",
    label: "More than 1 year to 2 years",
  },
  { id: 6, value: "More than 2 years", label: "More than 2 years" },
];

export const FAMILY_PLANNING_PILLS_OPTIONS = [
  { id: 1, value: "Oral pills (COC)", label: "Oral pills (COC)" },
  { id: 2, value: "Oral pills (POP)", label: "Oral pills (POP)" },
  {
    id: 3,
    value: "Emergency Contraceptive Pill",
    label: "Emergency Contraceptive Pill",
  },
  { id: 4, value: "Condoms", label: "Condoms" },
  { id: 5, value: "Diaphragm", label: "Diaphragm" },
  { id: 6, value: "IUCD", label: "IUCD" },
  { id: 7, value: "Implant (Jadelle)", label: "Implant (Jadelle)" },
  {
    id: 8,
    value: "Injectable (Sayana Press)",
    label: "Injectable (Sayana Press)",
  },
  {
    id: 9,
    value: "Injectable (3 month injection)",
    label: "Injectable (3 month injection)",
  },
  { id: 10, value: "Vasectomy", label: "Vasectomy" },
  { id: 11, value: "Tubal ligation", label: "Tubal ligation" },
  {
    id: 12,
    value: "Injectable DepoProvera",
    label: "Injectable DepoProvera",
  },
  {
    id: 13,
    value: "Injectable Net-En",
    label: "Injectable Net-En",
  },
];

export enum FamilyPlanningService {
  FAMILY_PLANNING_SERVICES = "Family Planning Services",
  LARC_REMOVAL = "LARC Removal",
}

export const FAMILY_PLANNING_SERVICE_OPTIONS = [
  {
    id: 1,
    value: FamilyPlanningService.FAMILY_PLANNING_SERVICES,
    label: FamilyPlanningService.FAMILY_PLANNING_SERVICES,
  },
  {
    id: 2,
    value: FamilyPlanningService.LARC_REMOVAL,
    label: FamilyPlanningService.LARC_REMOVAL,
  },
];

export enum ClientCategory {
  FAMILY_PLANNING_METHOD = "Family Planning Method",
  COUNSELING = "Counseling",
}

export const CLIENT_CATEGORY_OPTIONS = [
  {
    id: 1,
    value: ClientCategory.FAMILY_PLANNING_METHOD,
    label: ClientCategory.FAMILY_PLANNING_METHOD,
  },
  {
    id: 2,
    value: ClientCategory.COUNSELING,
    label: ClientCategory.COUNSELING,
  },
];

export enum TypeOfContraception {
  SHORT_TERM = "Short term",
  LARC = "LARC",
}

export const TYPE_OF_CONTRACEPTION_OPTIONS = [
  {
    id: 1,
    value: TypeOfContraception.SHORT_TERM,
    label: TypeOfContraception.SHORT_TERM,
  },
  {
    id: 2,
    value: TypeOfContraception.LARC,
    label: TypeOfContraception.LARC,
  },
  // {
  //   id: 3,
  //   value: TypeOfContraception.PERMANENT,
  //   label: TypeOfContraception.PERMANENT,
  // },
];

export const SHORT_TERM_METHOD_OPTIONS = [
  { id: 1, value: "Rubber Condom", label: "Rubber Condom" },
  { id: 2, value: "COC", label: "COC" },
  { id: 3, value: "POP", label: "POP" },
  { id: 4, value: "ECP", label: "ECP" },
  { id: 5, value: "3 months Inj Depo", label: "3 months Inj Depo" },
  {
    id: 6,
    value: "3 months Inj Sayana Press",
    label: "3 months Inj Sayana Press",
  },
];

export const LARC_METHOD_OPTIONS = [
  { id: 7, value: "Copper-T", label: "Copper-T" },
  { id: 8, value: "Multiload", label: "Multiload" },
  { id: 9, value: "Jadelle", label: "Jadelle" },
  { id: 10, value: "Implanon", label: "Implanon" },
  { id: 11, value: "Implanon NXT", label: "Implanon NXT" },
];

// export enum PermenantMethodTypes {
//   TUBAL_LIGATION = "Tubal ligation (CS for female)",
//   VASECTOMY = "Vasectomy (CS for male)",
// }

// export const PERMANENT_METHOD_OPTIONS = [
//   {
//     id: 12,
//     value: PermenantMethodTypes.TUBAL_LIGATION,
//     label: PermenantMethodTypes.TUBAL_LIGATION,
//   },
//   {
//     id: 13,
//     value: PermenantMethodTypes.VASECTOMY,
//     label: PermenantMethodTypes.VASECTOMY,
//   },
// ];

export const PERIOD_OF_SERVICE_OPTIONS = [
  {
    id: 1,
    value: "Less than 3 months",
    label: "Less than 3 months",
  },
  {
    id: 2,
    value: "More than 3 months to 6 months",
    label: "More than 3 months to 6 months",
  },
  {
    id: 3,
    value: "More than 6 months to 1 year",
    label: "More than 6 months to 1 year",
  },
  { id: 4, value: "Less than 2 years", label: "Less than 2 years" },
  { id: 5, value: "Less than 3 years", label: "Less than 3 years" },
  { id: 6, value: "More than 3 years", label: "More than 3 years" },
];

export const REASON_FOR_REMOVAL_OPTIONS = [
  {
    id: 1,
    value: "Wanted to get pregnant",
    label: "Wanted to get pregnant",
  },
  {
    id: 2,
    value: "Husband disapproval",
    label: "Husband disapproval",
  },
  { id: 3, value: "Side effects", label: "Side effects" },
  { id: 4, value: "Complication", label: "Complication" },
  {
    id: 5,
    value: "Completion of period",
    label: "Completion of period",
  },
  {
    id: 6,
    value: "Opting for another method",
    label: "Opting for another method",
  },
];

export const NEWBORN_SYMPTOM_OPTIONS = [
  {
    id: 1,
    label:
      "Respiratory distress (e.g., chest in-drawing, grunting, fast breathing)",
    value: NewbornSymptom.RESPIRATORY_DISTRESS,
  },
  { id: 2, label: "Moaning", value: NewbornSymptom.MOANING },
  { id: 3, label: "Convulsions", value: NewbornSymptom.CONVULSIONS },
  {
    id: 4,
    label: "Poor movement on stimulation",
    value: NewbornSymptom.POOR_MOVEMENT,
  },
  {
    id: 5,
    label: "Not breastfeeding well",
    value: NewbornSymptom.NOT_BREASTFEEDING,
  },
  { id: 6, label: "Jaundice", value: NewbornSymptom.JAUNDICE },
  { id: 7, label: "Other", value: NewbornSymptom.OTHER },
  { id: 8, label: "None", value: NewbornSymptom.NONE },
];

export enum NewbornMedication {
  OPV = "OPV",
  HEP_B = "Hep B",
}

export const NEWBORN_MEDICATION_OPTIONS = [
  { id: 2, label: "OPV", value: NewbornMedication.OPV },
  { id: 3, label: "Hep B", value: NewbornMedication.HEP_B },
];

export enum NewbornCauseOfDeath {
  BIRTH_TRAUMA = "Birth Trauma",
  HYPOTHERMIA = "Hypothermia",
  PREMATURITY = "Prematurity",
  BIRTH_ASPHYXIA = "Birth asphyxia",
  SEPSIS = "Sepsis",
  OTHER = "Other",
}

export const NEWBORN_CAUSE_OF_DEATH_OPTIONS = [
  {
    id: 1,
    label: NewbornCauseOfDeath.BIRTH_TRAUMA,
    value: NewbornCauseOfDeath.BIRTH_TRAUMA,
  },
  {
    id: 2,
    label: NewbornCauseOfDeath.HYPOTHERMIA,
    value: NewbornCauseOfDeath.HYPOTHERMIA,
  },
  {
    id: 3,
    label: NewbornCauseOfDeath.PREMATURITY,
    value: NewbornCauseOfDeath.PREMATURITY,
  },
  {
    id: 4,
    label: NewbornCauseOfDeath.BIRTH_ASPHYXIA,
    value: NewbornCauseOfDeath.BIRTH_ASPHYXIA,
  },
  {
    id: 5,
    label: NewbornCauseOfDeath.SEPSIS,
    value: NewbornCauseOfDeath.SEPSIS,
  },
  { id: 6, label: NewbornCauseOfDeath.OTHER, value: NewbornCauseOfDeath.OTHER },
];

export const SIGNS_OF_HIGH_RISK_PREGNANCY = [
  { label: "Hypertension", value: "Hypertension" },
  { label: "Diabetes", value: "Diabetes" },
  { label: "Heart disease", value: "Heart disease" },
  { label: "Bleeding disorder", value: "Bleeding disorder" },
  { label: "C-section", value: "C-section" },
  { label: "Obstructed labour", value: "Obstructed labour" },
  {
    label: "Antepartum haemorrhage (APH)",
    value: "Antepartum haemorrhage (APH)",
  },
  {
    label: "Postpartum haemorrhage (PPH)",
    value: "Postpartum haemorrhage (PPH)",
  },
  { label: "Preeclampsia", value: "Preeclampsia" },
  { label: "Eclampsia", value: "Eclampsia" },
  { label: "Preterm labour", value: "Preterm labour" },
  { label: "Severe abdominal pain", value: "Severe abdominal pain" },
  { label: "Vaginal bleeding", value: "Vaginal bleeding" },
  {
    label: "Decreased or loss of fetal movement",
    value: "Decreased or loss of fetal movement",
  },
  { label: "Collapse / convulsion", value: "Collapse / convulsion" },
  {
    label: "Severe headache (with or without visual disturbance)",
    value: "Severe headache (with or without visual disturbance)",
  },
  { label: "Severe edema", value: "Severe edema" },
  {
    label: "Categorized as high risk during ANC",
    value: "Categorized as high risk during ANC",
  },
  { label: "Anaemia / low Hb", value: "Anaemia / low Hb" },
  { label: "Ectopic pregnancy", value: "Ectopic pregnancy" },
  { label: "Placenta previa", value: "Placenta previa" },
  { label: "Chorioamnionitis", value: "Chorioamnionitis" },
  { label: "Fetopelvic disproportion", value: "Fetopelvic disproportion" },
  { label: "Nuchal cord", value: "Nuchal cord" },
  { label: "Shoulder dystocia", value: "Shoulder dystocia" },
  { label: "Prolapsed umbilical cord", value: "Prolapsed umbilical cord" },
  { label: "Uterine rupture", value: "Uterine rupture" },
  { label: "Amniotic fluid embolism", value: "Amniotic fluid embolism" },
  { label: "Meconium passed", value: "Meconium passed" },
  { label: "Perinatal asphyxia", value: "Perinatal asphyxia" },
  { label: "Intrauterine death", value: "Intrauterine death" },
  { label: "Inverted uterus", value: "Inverted uterus" },
  { label: "Puerperal sepsis", value: "Puerperal sepsis" },
  { label: "Intractable vomiting", value: "Intractable vomiting" },
  { label: "Physical trauma", value: "Physical trauma" },
  { label: "Mental trauma", value: "Mental trauma" },
  { label: "Gastroenteritis", value: "Gastroenteritis" },
  { label: "Vaginal discharge", value: "Vaginal discharge" },
  { label: "Shortness of breath", value: "Shortness of breath" },
  { label: "Infections", value: "Infections" },
  { label: "Fever", value: "Fever" },
  { label: "Malaria", value: "Malaria" },
  { label: "Jaundice", value: "Jaundice" },
  { label: "Other", value: "Other" },
  { label: "None", value: "None" },
];

export enum DischargeChecklistItem {
  APPLIED = "Applied chlorhexidine on cord",
  COUNSELLED = "Counselled on exclusive breastfeeding",
  INITIATED = "Initiated breastfeeding process within one hour",
  COUNSELLED_FAMILY_PLANNING = "Counselled on family planning",
  PROVIDED = "Provided family planning commodities",
  EXPLAINED_WARNING_SIGNS = "Explained warning signs for mother and child to patient",
}

export const DISCHARGE_CHECKLIST_OPTIONS = [
  {
    id: 1,
    value: DischargeChecklistItem.APPLIED,
    label: "Applied chlorhexidine on cord",
  },
  {
    id: 2,
    value: DischargeChecklistItem.COUNSELLED,
    label: "Counselled on exclusive breastfeeding",
  },
  {
    id: 3,
    value: DischargeChecklistItem.INITIATED,
    label: "Initiated breastfeeding process within one hour",
  },
  {
    id: 4,
    value: DischargeChecklistItem.COUNSELLED_FAMILY_PLANNING,
    label: "Counselled on family planning",
  },
  {
    id: 5,
    value: DischargeChecklistItem.PROVIDED,
    label: "Provided family planning commodities",
  },
  {
    id: 6,
    value: DischargeChecklistItem.EXPLAINED_WARNING_SIGNS,
    label: "Explained warning signs for mother and child to patient",
  },
];

// Opd
export const PROVISIONAL_DIAGNOSIS = [
  { id: 1, label: "Malaria", value: "Malaria" },
  { id: 2, label: "Dengue", value: "Dengue" },
  { id: 3, label: "COVID-19", value: "COVID-19" },
  { id: 4, label: "Typhoid", value: "Typhoid" },
  { id: 5, label: "Tuberculosis", value: "Tuberculosis" },
];

export const PRESENTING_COMPLAINTS_OPTIONS = [
  { label: "Fever", value: "Fever" },
  { label: "Pain", value: "Pain" },
  { label: "Swelling or Mass", value: "Swelling or Mass" },
  { label: "Dyspnea", value: "Dyspnea" },
  { label: "Cough", value: "Cough" },
  { label: "Vomitting", value: "Vomitting" },
  { label: "Diarrhea", value: "Diarrhea" },
  { label: "Fits", value: "Fits" },
  { label: "Weakness", value: "Weakness" },
  { label: "Headache", value: "Headache" },
  { label: "Other", value: "Other" },
];

export const ASSOSSIATED_CONDITIONS = [
  { id: 1, label: "Hypertension", value: "Hypertension" },
  { id: 2, label: "Diabetes", value: "Diabetes" },
  { id: 3, label: "Thyroid disorder", value: "Thyroid disorder" },
  { id: 4, label: "Dyslipidemia", value: "Dyslipidemia" },
  { id: 5, label: "Anemia", value: "Anemia" },
  { id: 6, label: "Asthma", value: "Asthma" },
  { id: 7, label: "COPD", value: "COPD" },
  { id: 8, label: "Chronic kidney disease", value: "Chronic kidney disease" },
  { id: 9, label: "Hepatitis B", value: "Hepatitis B" },
  { id: 10, label: "Hepatitis C", value: "Hepatitis C" },
  { id: 11, label: "HIV", value: "HIV" },
  { id: 12, label: "Tuberculosis", value: "Tuberculosis" },
  {
    id: 13,
    label: "Epilepsy / Seizure disorder",
    value: "Epilepsy / Seizure disorder",
  },
  {
    id: 14,
    label: "Bleeding/clotting disorder",
    value: "Bleeding/clotting disorder",
  },
  { id: 15, label: "Autoimmune disease", value: "Autoimmune disease" },
  { id: 16, label: "Heart failure", value: "Heart failure" },
  {
    id: 17,
    label: "Ischemic heart disease / MI",
    value: "Ischemic heart disease / MI",
  },
  { id: 18, label: "Stroke", value: "Stroke" },
  { id: 19, label: "Major surgery", value: "Major surgery" },
  { id: 20, label: "Psychiatric condition", value: "Psychiatric condition" },
  { id: 21, label: "Other", value: "Other" },
  { id: 22, label: "None", value: "None" },
];

export const URGENCY_OPTIONS = [
  { id: 1, label: "Routine", value: "Routine" },
  { id: 2, label: "Urgent", value: "Urgent" },
];

export const DEHYDRATION_LEVELS = [
  { id: 1, label: "Mild", value: "Mild" },
  { id: 2, label: "Moderate", value: "Moderate" },
  { id: 3, label: "Severe", value: "Severe" },
  { id: 4, label: "Not Applicable", value: "Not Applicable" },
];

export enum ImmunizationStatus {
  COMPLETED = "Completed",
  TO_BE_SCHEDULED = "To be scheduled",
}

export const IMMUNIZATION_STATUS_OPTIONS = [
  {
    id: 1,
    value: ImmunizationStatus.COMPLETED,
    label: ImmunizationStatus.COMPLETED,
  },
  {
    id: 2,
    value: ImmunizationStatus.TO_BE_SCHEDULED,
    label: ImmunizationStatus.TO_BE_SCHEDULED,
  },
];

export const LEVEL_OF_CARE = [
  { label: "Primary", value: "Primary" },
  { label: "Secondary", value: "Secondary" },
  { label: "Tertiary", value: "Tertiary" },
];

export const FAMILY_PLANNING_METHODS_VITALS = [
  { label: "Rubber Condom", value: "Rubber Condom" },
  { label: "COC", value: "COC" },
  { label: "POP", value: "POP" },
  { label: "ECP", value: "ECP" },
  { label: "3 months Inj Depo", value: "3 months Inj Depo" },
  { label: "3 months Inj Sayana Press", value: "3 months Inj Sayana Press" },
  { label: "Copper-T", value: "Copper-T" },
  { label: "Multiload", value: "Multiload" },
  { label: "Jadelle", value: "Jadelle" },
  { label: "Implanon", value: "Implanon" },
  { label: "Implanon NXT", value: "Implanon NXT" },
  {
    label: "Tubal ligation (CS for female)",
    value: "Tubal ligation (CS for female)",
  },
  { label: "Vasectomy (CS for male)", value: "Vasectomy (CS for male)" },
];

//Nutrition
export const PATIENT_REFFERAL_OPTIONS = [
  { label: "Refer by LHW", value: "Refer by LHW" },
  { label: "Referred by another site", value: "Referred by another site" },
  { label: "Direct from community", value: "Direct from community" },
];

export const PATIENT_ADDMISSION_REASONS = [
  { label: "Relapse", value: "Relapse" },
  {
    label: "Transfer from stabilisation centre",
    value: "Transfer from stabilisation centre",
  },
  { label: "Return after default", value: "Return after default" },
  { label: "Other", value: "Other" },
];

export const EDEMA_OPTIONS = [
  { label: "Mild", value: "Mild" },
  { label: "Moderate", value: "Moderate" },
  { label: "Severe", value: "Severe" },
  { label: "No edema", value: "No edema" },
];

export const NUTRITION_COMPLICATIONS = [
  {
    label: "No appetite for RUTF/anorexia",
    value: "No appetite for RUTF/anorexia",
  },
  { label: "Hypothermia", value: "Hypothermia" },
  { label: "Severe pneumonia", value: "Severe pneumonia" },
  { label: "Septicshock", value: "Septicshock" },
  { label: "Congestive heart failure", value: "Congestive heart failure" },
  { label: "Hypoglycaemia", value: "Hypoglycaemia" },
  { label: "Dermatitis", value: "Dermatitis" },
  { label: "Fever", value: "Fever" },
  { label: "Severe anemia", value: "Severe anemia" },
  { label: "Severe dehydration", value: "Severe dehydration" },
  { label: "Severe Vomiting", value: "Severe Vomiting" },
  {
    label: "Unconscious, fits or convulsions",
    value: "Unconscious, fits or convulsions",
  },
];

export const REFERRAL_MOTHER_COMPLICATIONS = [
  {
    label: "Categorized as high risk during ANC",
    value: "Categorized as high risk during ANC",
  },
  { label: "Anaemia/low HB", value: "Anaemia/low HB" },
  { label: "Hypertension", value: "Hypertension" },
  { label: "Preeclampsia", value: "Preeclampsia" },
  { label: "Eclampsia", value: "Eclampsia" },
  { label: "Ectopic pregnancy", value: "Ectopic pregnancy" },
  { label: "Placenta previa", value: "Placenta previa" },
  { label: "Antepartum haemorrhage", value: "Antepartum haemorrhage" },
  { label: "Chorioamnionitis", value: "Chorioamnionitis" },
  { label: "Preterm labor", value: "Preterm labor" },
  { label: "Fetopelvic disproportion", value: "Fetopelvic disproportion" },
  { label: "Nuchal cord", value: "Nuchal cord" },
  { label: "Obstructed labor", value: "Obstructed labor" },
  { label: "Shoulder dystocia", value: "Shoulder dystocia" },
  { label: "Prolapsed umbilical cord", value: "Prolapsed umbilical cord" },
  { label: "Uterine rupture", value: "Uterine rupture" },
  { label: "Amniotic fluid embolism", value: "Amniotic fluid embolism" },
  { label: "Meconium passed", value: "Meconium passed" },
  { label: "Perinatal asphyxia", value: "Perinatal asphyxia" },
  { label: "Intrauterine death", value: "Intrauterine death" },
  { label: "Inverted uterus", value: "Inverted uterus" },
  { label: "Postpartum haemorrhage", value: "Postpartum haemorrhage" },
  { label: "Puerperal Sepsis", value: "Puerperal Sepsis" },
  { label: "Other", value: "Other" },
];

export const REFERRAL_NEWBORN_COMPLICATIONS = [
  { label: "Low APGAR score", value: "Low APGAR score" },
  { label: "No spontaneous movement", value: "No spontaneous movement" },
  { label: "Stopped breastfeeding well", value: "Stopped breastfeeding well" },
  { label: "Hypothermia", value: "Hypothermia" },
  { label: "Fever", value: "Fever" },
  {
    label: "Fast breathing (breathing rate >60/min)",
    value: "Fast breathing (breathing rate >60/min)",
  },
  { label: "Severe chest in-drawing", value: "Severe chest in-drawing" },
  { label: "History of convulsions", value: "History of convulsions" },
  { label: "Jaundice", value: "Jaundice" },
  { label: "Underweight", value: "Underweight" },
  { label: "Other", value: "Other" },
];

export const NEWBORN_MEDICINES = [
  { label: "Amoxicillin", value: "Amoxicillin" },
  { label: "Ampicillin", value: "Ampicillin" },
  { label: "Gentamicin", value: "Gentamicin" },
  { label: "Ceftriaxone", value: "Ceftriaxone" },
  { label: "Metronidazole", value: "Metronidazole" },
];

// Reusable function to check if selected contraceptive has unit "Pill"
export const showContratceptivesTypesPills = (
  values: any,
  fieldIndex: number,
  fieldKey: string, // e.g., "selected_family_planning_method_larc"
  optionsList: Array<any>,
) => {
  const selectedItems =
    values?.[
      fieldKey.includes("larc")
        ? "family_planning_prescriptions_larc"
        : "family_planning_prescriptions_short_term"
    ] || [];

  const currentId = selectedItems?.[fieldIndex]?.[fieldKey];
  if (currentId === undefined) return false;
  const selectedOption = optionsList.find((option) => option.id === currentId);

  return selectedOption?.variants[0].unit === "Pill";
};

// Reusable function to check if unit is NOT "Pill"
export const showContratceptivesTypesNonPill = (
  values: any,
  fieldIndex: number,
  fieldKey: string,
  optionsList: Array<any>,
) => {
  const selectedItems =
    values?.[
      fieldKey.includes("larc")
        ? "family_planning_prescriptions_larc"
        : "family_planning_prescriptions_short_term"
    ] || [];
  const currentId = selectedItems?.[fieldIndex]?.[fieldKey];
  if (currentId === undefined) return false;
  const selectedOption = optionsList.find((option) => option.id === currentId);

  return selectedOption?.variants[0].unit !== "Pill";
};

enum ServiceTypes {
  OPD = "OPD",
  ANC = "ANC",
  DELIVERY = "DELIVERY",
  PNC = "PNC",
  FAMILY_PLANNING = "FAMILY_PLANNING",
  IMMUNISATION = "IMMUNISATION",
  NUTRITION = "NUTRITION",
  OTHER = "Other",
}

export const SERVICE_TYPES = [
  { label: "OPD", value: ServiceTypes.OPD },
  { label: "ANC", value: ServiceTypes.ANC },
  { label: "PNC", value: ServiceTypes.PNC },
  { label: "Delivery", value: ServiceTypes.DELIVERY },
  { label: "Family Planning", value: ServiceTypes.FAMILY_PLANNING },
  { label: "Immunisation", value: ServiceTypes.IMMUNISATION },
  { label: "Nutrition", value: ServiceTypes.NUTRITION },
  { label: "Other", value: ServiceTypes.OTHER },
];

export const SERVICE_TYPES_MOTHER = [
  { label: "OPD", value: ServiceTypes.OPD },
  { label: "PNC", value: ServiceTypes.PNC },
  { label: "Family Planning", value: ServiceTypes.FAMILY_PLANNING },
  { label: "Nutrition", value: ServiceTypes.NUTRITION },
  { label: "Other", value: ServiceTypes.OTHER },
];

export const SERVICE_TYPES_CHILD = [
  { label: "OPD", value: ServiceTypes.OPD },
  { label: "Immunisation", value: ServiceTypes.IMMUNISATION },
  { label: "Nutrition", value: ServiceTypes.NUTRITION },
  { label: "Other", value: ServiceTypes.OTHER },
];

export const WARNING_POP_UP_TIME = 1000; // in milliseconds
