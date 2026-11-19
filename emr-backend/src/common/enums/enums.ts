import { Attendance } from '../../attendance/entities/attendance.entity';
export enum PreviousIllness {
  ACUTE_FLACCID_PARALYSIS = 'Acute Flaccid Paralysis',
  MUMPS = 'Mumps',
  MEASLES = 'Measles',
  NEONATAL_TETANUS = 'Neonatal Tetanus',
  DIPHTHERIA = 'Diphtheria',
  TUBERCULOSIS = 'Tuberculosis',
  TYPHOID_FEVER = 'Typhoid Fever',
  PERTUSSIS = 'Pertussis',
  ACUTE_DIARRHEA_NON_CHOLERA = 'Acute Diarrhea (Non-Cholera)',
  ACUTE_WATERY_DIARRHEA_CHOLERA = 'Acute Watery Diarrhea (Cholera)',
  ACUTE_JAUNDICE_SYNDROME_HEPATITIS_A_E = 'Acute Jaundice Syndrome (Hepatitis A & E)',
  NAEGLERIA_FOWLERI = 'Naegleria Fowleri',
  CHICKENPOX = 'Chickenpox',
  PNEUMONIA_LRTI = 'Pneumonia/LRTI',
  SEVERE_ACUTE_RESPIRATORY_INFECTION_SARI = 'Severe Acute Respiratory Infection (SARI)',
  MALARIA = 'Malaria',
  DENGUE_FEVER = 'Dengue Fever',
  CHIKUNGUNYA = 'Chikungunya',
  CRIMEAN_CONGO_HEMORRHAGIC_FEVER_CCHF = 'Crimean Congo Hemorrhagic Fever (CCHF)',
  HEPATITIS_HBV_HCV_HDV = 'Hepatitis (HBV, HCV, HDV)',
  HIV_AIDS = 'HIV/AIDS',
  ANY_OTHER_UNUSUAL_EVENT = 'Any other unusual event',
  LEISHMANIASIS = 'Leishmaniasis',
  BLOODY_DIARRHEA_DYSENTERY = 'Bloody Diarrhea (Dysentery)',
  RABIES = 'Rabies',
  STIS = 'STIs',
  LEPROSY = 'Leprosy',
  MENINGITIS = 'Meningitis',
  RHEUMATIC_FEVER = 'Rheumatic Fever',
  SNAKE_BITE = 'Snake Bite',
  SCABIES = 'Scabies',
  PYREXIA_OF_UNKNOWN_ORIGIN_PUO = 'Pyrexia of Unknown Origin (PUO)',
  HYPERTENSION = 'Hypertension',
  DIABETES = 'Diabetes',
  ISCHEMIC_HEART_DISEASE_MI = 'Ischemic heart disease/MI',
  HEART_FAILURE = 'Heart failure',
  STROKE = 'Stroke',
  ASTHMA = 'Asthma',
  COPD = 'COPD',
  HEPATITIS_B = 'Hepatitis B',
  HEPATITIS_C = 'Hepatitis C',
  CHRONIC_KIDNEY_DISEASE = 'Chronic kidney disease',
  THYROID_DISEASE = 'Thyroid disease',
  DYSLIPIDEMIA = 'Dyslipidemia',
  ANEMIA = 'Anemia',
  BLEEDING_CLOTTING_DISORDER = 'Bleeding/clotting disorder',
  PEPTIC_ULCER = 'Peptic ulcer',
  EPILEPSY_SEIZURE_DISORDER = 'Epilepsy / Seizure disorder',
  HIV = 'HIV',
  AUTOIMMUNE_DISEASE = 'Autoimmune disease',
  CANCER = 'Cancer',
  MAJOR_SURGERY = 'Major surgery',
  PSYCHIATRIC_RELATED = 'Psychiatric-related',
  OTHER = 'Other',
  NONE = 'None',
}

export enum TtDose {
  FIRST = '1st',
  SECOND = '2nd',
}

export enum PreDeliverySymptomsAssessment {
  SEVERE_VAGINAL_BLEEDING = 'Severe vaginal bleeding',
  BREATHING_DIFFICULTY = 'Breathing difficulty',
  HIGH_FEVER = 'High fever (above 101 F)',
  SEVERE_HEADACHE = 'Severe headache',
  BLURRED_VISION = 'Blurred vision',
  CONVULSIONS = 'Convulsions/loss of consciousness',
  FOUL_SMELLING_DISCHARGE = 'Foul-smelling discharge/fluid from vagina',
  DECREASE_FETAL_MOVEMENTS = 'Decrease/absent fetal movements',
  LEAKING_MECONIUM = 'Leaking meconium-stained fluid',
  NONE = 'None',
}

export enum HighRiskSign {
  HYPERTENSION = 'Hypertension',
  DIABETES = 'Diabetes',
  HEART_DISEASE = 'Heart disease',
  BLEEDING_DISORDER = 'Bleeding disorder',
  C_SECTION = 'C-section',
  OBSTRUCTED_LABOUR = 'Obstructed labour',
  ANTEPARTUM_HAEMORRHAGE_APH = 'Antepartum haemorrhage (APH)',
  POSTPARTUM_HAEMORRHAGE_PPH = 'Postpartum haemorrhage (PPH)',
  PREECLAMPSIA = 'Preeclampsia',
  ECLAMPSIA = 'Eclampsia',
  PRETERM_LABOUR = 'Preterm labour',
  SEVERE_ABDOMINAL_PAIN = 'Severe abdominal pain',
  VAGINAL_BLEEDING = 'Vaginal bleeding',
  DECREASED_OR_LOSS_OF_FETAL_MOVEMENT = 'Decreased or loss of fetal movement',
  COLLAPSE_CONVULSION = 'Collapse / convulsion',
  SEVERE_HEADACHE_WITH_OR_WITHOUT_VISUAL_DISTURBANCE = 'Severe headache (with or without visual disturbance)',
  SEVERE_EDEMA = 'Severe edema',
  CATEGORIZED_AS_HIGH_RISK_DURING_ANC = 'Categorized as high risk during ANC',
  ANAEMIA_LOW_HB = 'Anaemia / low Hb',
  ECTOPIC_PREGNANCY = 'Ectopic pregnancy',
  PLACENTA_PREVIA = 'Placenta previa',
  CHORIOAMNIONITIS = 'Chorioamnionitis',
  FETOPELVIC_DISPROPORTION = 'Fetopelvic disproportion',
  NUCHAL_CORD = 'Nuchal cord',
  SHOULDER_DYSTOCIA = 'Shoulder dystocia',
  PROLAPSED_UMBILICAL_CORD = 'Prolapsed umbilical cord',
  UTERINE_RUPTURE = 'Uterine rupture',
  AMNIOTIC_FLUID_EMBOLISM = 'Amniotic fluid embolism',
  MECONIUM_PASSED = 'Meconium passed',
  PERINATAL_ASPHYXIA = 'Perinatal asphyxia',
  INTRAUTERINE_DEATH = 'Intrauterine death',
  INVERTED_UTERUS = 'Inverted uterus',
  PUERPERAL_SEPSIS = 'Puerperal sepsis',
  INTRACTABLE_VOMITING = 'Intractable vomiting',
  PHYSICAL_TRAUMA = 'Physical trauma',
  MENTAL_TRAUMA = 'Mental trauma',
  GASTROENTERITIS = 'Gastroenteritis',
  VAGINAL_DISCHARGE = 'Vaginal discharge',
  SHORTNESS_OF_BREATH = 'Shortness of breath',
  INFECTIONS = 'Infections',
  FEVER = 'Fever',
  MALARIA = 'Malaria',
  JAUNDICE = 'Jaundice',
  OTHER = 'Other',
  NONE = 'None',
}

export enum ChildOrder {
  FIRST_CHILD = 'FIRST_CHILD',
  SECOND_CHILD = 'SECOND_CHILD',
  THIRD_CHILD = 'THIRD_CHILD',
}

export enum BreastfeedingIssue {
  SORE_NIPPLES = 'Sore or cracked nipples',
  NOT_ENOUGH_MILK = 'Not enough breastmilk',
  TOO_MUCH_MILK = 'Too much breastmilk',
  BABY_NOT_LATCHING = 'Baby is not latching on properly',
  BREAST_TENDERNESS = 'Breast tenderness',
  INFECTIONS = 'Infections',
  OTHER = 'Other',
}

export enum DehydrationLevel {
  MILD = 'Mild',
  MODERATE = 'Moderate',
  SEVERE = 'Severe',
}

export enum PatientStatus {
  REGISTERED = 'registered', // for registration completed
  PENDING = 'pending', // when assigned to a queue
  IN_PROGRESS = 'in_progress', // when a service is being provided
  PAUSED = 'paused', // when service is paused. Scenario: waiting for lab results
  COMPLETED = 'completed', // when appointment is completed
  REFERRED_IN = 'referred_in', // when patient is referred in from another facility
  REFERRED_OUT = 'referred_out', // when patient is referred out to another facility
}

export enum AllergyType {
  POLLEN = 'Pollen',
  DUST = 'Dust',
  PENICILLIN = 'Penicillin',
  OTHER = 'Other',
}

export enum PregnancyType {
  SINGLE = 'Single',
  TWINS = 'Twins',
  TRIPLETS = 'Triplets',
  QUADRUPLETS = 'Quadruplets',
}

export enum PatientFinalDiagnosis {
  AVAILABLE = 'Available',
  REQUIRES_FOLLOW_UP = 'Requires a follow-up',
}

export enum ImmunizationType {
  BCG = 'BCG',
  OPV_0 = 'OPV-0',
  HEP_B = 'Hep-B',
  PENTA_OPV_ROTA_PCV1 = 'Penta–OPV–Rota–PCV-1',
  PENTA_OPV_ROTA_PCV2 = 'Penta–OPV–Rota–PCV-2',
  PENTA_OPV_PCV3_IPV1 = 'Penta–OPV–PCV-3+IPV-1',
  MR1 = 'MR-1',
  TCV = 'TCV',
  IPV2 = 'IPV-2',
  MR2 = 'MR-2',
}

export enum BloodGroup {
  A_POS = 'A +ve',
  A_NEG = 'A -ve',
  B_POS = 'B +ve',
  B_NEG = 'B -ve',
  AB_POS = 'AB +ve',
  AB_NEG = 'AB -ve',
  O_POS = 'O +ve',
  O_NEG = 'O -ve',
}

export enum WarningSign {
  HYPERTENSION = 'Hypertension',
  DIABETES = 'Diabetes',
  HEART_DISEASE = 'Heart disease',
  BLEEDING_DISORDER = 'Bleeding disorder',
  C_SECTION = 'C-section',
  OBSTRUCTED_LABOUR = 'Obstructed labour',
  ANTEPARTUM_HAEMORRHAGE_APH = 'Antepartum haemorrhage (APH)',
  POSTPARTUM_HAEMORRHAGE_PPH = 'Postpartum haemorrhage (PPH)',
  PREECLAMPSIA = 'Preeclampsia',
  ECLAMPSIA = 'Eclampsia',
  PRETERM_LABOUR = 'Preterm labour',
  SEVERE_ABDOMINAL_PAIN = 'Severe abdominal pain',
  VAGINAL_BLEEDING = 'Vaginal bleeding',
  DECREASED_OR_LOSS_OF_FETAL_MOVEMENT = 'Decreased or loss of fetal movement',
  COLLAPSE_CONVULSION = 'Collapse / convulsion',
  SEVERE_HEADACHE = 'Severe headache (with or without visual disturbance)',
  SEVERE_EDEMA = 'Severe edema',
  CATEGORIZED_AS_HIGH_RISK_DURING_ANC = 'Categorized as high risk during ANC',
  ANAEMIA_LOW_HB = 'Anaemia / low Hb',
  ECTOPIC_PREGNANCY = 'Ectopic pregnancy',
  PLACENTA_PREVIA = 'Placenta previa',
  CHORIOAMNIONITIS = 'Chorioamnionitis',
  FETOPELVIC_DISPROPORTION = 'Fetopelvic disproportion',
  NUCHAL_CORD = 'Nuchal cord',
  SHOULDER_DYSTOCIA = 'Shoulder dystocia',
  PROLAPSED_UMBILICAL_CORD = 'Prolapsed umbilical cord',
  UTERINE_RUPTURE = 'Uterine rupture',
  AMNIOTIC_FLUID_EMBOLISM = 'Amniotic fluid embolism',
  MECONIUM_PASSED = 'Meconium passed',
  PERINATAL_ASPHYXIA = 'Perinatal asphyxia',
  INTRAUTERINE_DEATH = 'Intrauterine death',
  INVERTED_UTERUS = 'Inverted uterus',
  PUERPERAL_SEPSIS = 'Puerperal sepsis',
  INTRACTABLE_VOMITING = 'Intractable vomiting',
  PHYSICAL_TRAUMA = 'Physical trauma',
  MENTAL_TRAUMA = 'Mental trauma',
  GASTROENTERITIS = 'Gastroenteritis',
  VAGINAL_DISCHARGE = 'Vaginal discharge',
  SHORTNESS_OF_BREATH = 'Shortness of breath',
  INFECTIONS = 'Infections',
  FEVER = 'Fever',
  MALARIA = 'Malaria',
  JAUNDICE = 'Jaundice',
  OTHER = 'Other',
  NONE = 'None',
}

export enum FetalPresentation {
  LONGITUDINAL = 'Longitudinal',
  CEPHALIC = 'Cephalic',
  BREECH = 'Breech',
  SHOULDER = 'Shoulder',
  TRANSVERSE = 'Transverse',
}

export enum PlacentaPosition {
  POSTERIOR = 'Posterior',
  ANTERIOR = 'Anterior',
  FUNDAL = 'Fundal',
  LATERAL = 'Lateral',
}

export enum FetalMovement {
  PRESENT = 'Present',
  ABSENT = 'Absent',
}

export enum FetalAttitude {
  FLEXED = 'Flexed',
  NEUTRAL = 'Neutral',
  EXTENDED = 'Extended',
}

export enum UltrasoundReportings {
  ECTOPIC = 'Ectopic Pregnancies Detected',
  TWINS = 'Twin Pregnancies Detected',
  MISSED_ABORTION = 'Missed Abortion',
  RPOC = 'RPOC after Termination of pregnancy',
  OLIGOHYDRAMNIOS = 'Oligohydramnios',
  CONGENITAL_ANOMALIES = 'Congenital Anomalies',
  NTD = 'Neural Tube Defects',
  PLACENTA_PREVIA = 'Placenta Previa',
  ABRUPTIO = 'Placenta Abruptio',
  MOLAR = 'Molar Pregnancy',
  IUD = 'Intrauterine Death',
  POLYHYDRAMNIOS = 'Polyhydramnios',
  IUGR = 'Intrauterine Growth Restriction (IUGR)',
  OTHERS = 'Others',
  NONE = 'None',
  NORMAL = 'Normal',
}

export enum CNICProvider {
  Self = 'Self',
  Mother = 'Mother',
  Father = 'Father',
  Sibling = 'Sibling',
  Spouse = 'Spouse',
  Guardian = 'Guardian',
  UncleAunt = 'Uncle/Aunt (blood-relation)',
  CnicNA = 'CNIC Not Available',
  Other = 'Other',
}

export enum LiquorVolume {
  NORMAL = 'Normal',
  OLIGOHYDRAMNIOS = 'Oligohydramnios',
  POLYHYDRAMNIOS = 'Polyhydramnios',
  UNKNOWN = 'Unknown',
}

export enum CtgReporting {
  NORMAL_REACTIVE = 'Normal/Reactive',
  SUSPICIOUS = 'Suspicious',
  ABNORMAL_NON_REACTIVE = 'Abnormal/Non-Reactive',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum BloodType {
  A_POS = 'A +ve',
  A_NEG = 'A -ve',
  B_POS = 'B +ve',
  B_NEG = 'B -ve',
  AB_POS = 'AB +ve',
  AB_NEG = 'AB -ve',
  O_POS = 'O +ve',
  O_NEG = 'O -ve',
}

export enum MaritalStatus {
  SINGLE = 'Single',
  MARRIED = 'Married',
  WIDOWED = 'Widowed',
  DIVORCED = 'Divorced',
  OTHER = 'Other',
}

export enum AlbuminDipstickResult {
  NEGATIVE = 'Negative',
  POSITIVE = 'Positive',
}

export enum PastObstetricComplication {
  HYPERTENSION = 'Hypertension',
  DIABETES = 'Diabetes',
  HEART_DISEASE = 'Heart disease',
  BLEEDING_DISORDER = 'Bleeding disorder',
  C_SECTION = 'C-Section',
  OBSTRUCTED_LABOUR = 'Obstructed labour',
  ANTEPARTUM_HEMORRHAGE = 'Antepartum haemorrhage (APH)',
  POSTPARTUM_HEMORRHAGE = 'Postpartum haemorrhage (PPH)',
  PREECLAMPSIA = 'Preeclampsia',
  ECLAMPSIA = 'Eclampsia',
  PRETERM_LABOUR = 'Preterm labour',
  SEVERE_ABDOMINAL_PAIN = 'Severe abdominal pain',
  VAGINAL_BLEEDING = 'Vaginal bleeding',
  DECREASED_FETAL_MOVEMENT = 'Decreased or loss of fetal movement',
  COLLAPSE_CONVULSION = 'Collapse / convulsion',
  SEVERE_HEADACHE = 'Severe headache (with or without visual disturbance)',
  SEVERE_EDEMA = 'Severe edema',
  HIGH_RISK_ANC = 'Categorized as high risk during ANC',
  ANEMIA_LOW_HB = 'Anaemia / low Hb',
  ECTOPIC_PREGNANCY = 'Ectopic pregnancy',
  PLACENTA_PREVIA = 'Placenta previa',
  CHORIOAMNIONITIS = 'Chorioamnionitis',
  FETOPELVIC_DISPROPORTION = 'Fetopelvic disproportion',
  NUCHAL_CORD = 'Nuchal cord',
  SHOULDER_DYSTOCIA = 'Shoulder dystocia',
  PROLAPSED_UMBILICAL_CORD = 'Prolapsed umbilical cord',
  UTERINE_RUPTURE = 'Uterine rupture',
  AMNIOTIC_FLUID_EMBOLISM = 'Amniotic fluid embolism',
  MECONIUM_PASSED = 'Meconium passed',
  PERINATAL_ASPHYXIA = 'Perinatal asphyxia',
  INTRAUTERINE_DEATH = 'Intrauterine death',
  INVERTED_UTERUS = 'Inverted uterus',
  PUERPERAL_SEPSIS = 'Puerperal sepsis',
  INTRACTABLE_VOMITING = 'Intractable vomiting',
  PHYSICAL_TRAUMA = 'Physical trauma',
  MENTAL_TRAUMA = 'Mental trauma',
  GASTROENTERITIS = 'Gastroenteritis',
  VAGINAL_DISCHARGE = 'Vaginal discharge',
  SHORTNESS_OF_BREATH = 'Shortness of breath',
  INFECTIONS = 'Infections',
  FEVER = 'Fever',
  MALARIA = 'Malaria',
  JAUNDICE = 'Jaundice',
  OTHER = 'Other',
  NONE = 'None',
}

export enum FamilyPlanningMethod {
  PILLS = 'Pills',
  INJECTABLES = 'Injectables',
  IMPLANT = 'Implant',
  IUCD = 'IUCD',
}

export enum LevelOfCare {
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  TERTIARY = 'Tertiary',
  OFFICE = 'Office',
}

export enum Trimester {
  FIRST = 'First',
  SECOND = 'Second',
  THIRD = 'Third',
}
export enum ReasonForEdit {
  CHANGE_CURRENT_LMP = 'Changing current LMP',
  ADD_NEW_LMP_NEW_PREGNANCY = 'Adding LMP for a new pregnancy',
}

export enum PlaceOfDelivery {
  PUBLIC_HEALTH_FACILITY = 'Public health facility',
  PRIVATE_HEALTH_FACILITY = 'Private health facility',
  INFORMAL_DELIVERY_CENTER = 'Informal delivery center',
  HOME = 'Home',
  OTHER = 'Other',
}

export enum DeliveryOutcome {
  LIVE_BIRTH = 'Live birth',
  STILL_BIRTH = 'Still birth',
  MISCARRIAGE = 'Miscarriage',
  Induced_ABORTION = 'Induced abortion',
}

export enum ModeOfDelivery {
  NORMAL = 'Normal Vaginal Delivery',
  C_SECTION = 'C-Section',
  ASSISTED_DELIVERY = 'Assisted delivery (Vacuum/Forceps)',
  NOT_APPLICABLE = 'Not Applicable',
}

export enum Complication {
  HYPERTENSION = 'Hypertension',
  DIABETES = 'Diabetes',
  HEART_DISEASE = 'Heart disease',
  BLEEDING_DISORDER = 'Bleeding disorder',
  C_SECTION = 'C-section',
  OBSTRUCTED_LABOUR = 'Obstructed labour',
  ANTEPARTUM_HAEMORRHAGE = 'Antepartum haemorrhage (APH)',
  POSTPARTUM_HAEMORRHAGE = 'Postpartum haemorrhage (PPH)',
  PREECLAMPSIA = 'Preeclampsia',
  ECLAMPSIA = 'Eclampsia',
  PRETERM_LABOUR = 'Preterm labour',
  SEVERE_ABDOMINAL_PAIN = 'Severe abdominal pain',
  VAGINAL_BLEEDING = 'Vaginal bleeding',
  DECREASED_OR_LOSS_OF_FETAL_MOVEMENT = 'Decreased or loss of fetal movement',
  COLLAPSE_CONVULSION = 'Collapse / convulsion',
  SEVERE_HEADACHE = 'Severe headache (with or without visual disturbance)',
  SEVERE_EDEMA = 'Severe edema',
  CATEGORIZED_AS_HIGH_RISK_DURING_ANC = 'Categorized as high risk during ANC',
  ANAEMIA_LOW_HB = 'Anaemia / low Hb',
  ECTOPIC_PREGNANCY = 'Ectopic pregnancy',
  PLACENTA_PREVIA = 'Placenta previa',
  CHORIOAMNIONITIS = 'Chorioamnionitis',
  FETOPELVIC_DISPROPORTION = 'Fetopelvic disproportion',
  NUCHAL_CORD = 'Nuchal cord',
  SHOULDER_DYSTOCIA = 'Shoulder dystocia',
  PROLAPSED_UMBILICAL_CORD = 'Prolapsed umbilical cord',
  UTERINE_RUPTURE = 'Uterine rupture',
  AMNIOTIC_FLUID_EMBOLISM = 'Amniotic fluid embolism',
  MECONIUM_PASSED = 'Meconium passed',
  PERINATAL_ASPHYXIA = 'Perinatal asphyxia',
  INTRAUTERINE_DEATH = 'Intrauterine death',
  INVERTED_UTERUS = 'Inverted uterus',
  PUERPERAL_SEPSIS = 'Puerperal sepsis',
  INTRACTABLE_VOMITING = 'Intractable vomiting',
  PHYSICAL_TRAUMA = 'Physical trauma',
  MENTAL_TRAUMA = 'Mental trauma',
  GASTROENTERITIS = 'Gastroenteritis',
  VAGINAL_DISCHARGE = 'Vaginal discharge',
  SHORTNESS_OF_BREATH = 'Shortness of breath',
  INFECTIONS = 'Infections',
  FEVER = 'Fever',
  MALARIA = 'Malaria',
  JAUNDICE = 'Jaundice',
  OTHER = 'Other',
  NONE = 'None',
}

export enum MedicineStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  OUT_OF_STOCK = 'Out of Stock',
}

export enum MedicineUnit {
  TABLET = 'Tablet',
  CAPSULE = 'Capsule',
  INJECTION = 'Injection',
  SACHET = 'Sachet',
  SYRUP = 'Syrup',
  BOTTLE = 'Bottle',
  CREAM = 'Cream',
  CONDOM = 'Condom',
  PILL = 'Pill',
  IUD = 'Iud',
  IMPLANT = 'Implant',
  IV_INFUSION = 'IV Infusion',
  NEBULES = 'Nebules',
}

export enum MedicineRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  AMENDED = 'AMENDED',
}

export enum MedicineCategories {
  ANALGESIC = 'Analgesic',
  ANTIBIOTIC = 'Antibiotic',
  ANTIBIOTIC_CREAM = 'Antibiotic Cream',
  ANTIHISTAMINE = 'Antihistamine',
  ANTIMALARIAL = 'Antimalarial',
  ANTIPARASITIC = 'Antiparasitic',
  ANTISEPTIC = 'Antiseptic',
  ANTIVENOM = 'Antivenom',
  BRONCHODILATOR = 'Bronchodilator',
  ELECTROLYTE = 'Electrolyte',
  EMERGENCY = 'Emergency',
  GYNECOLOGY = 'Gynecology',
  IV_FLUID = 'IV Fluid',
  STEROID = 'Steroid',
  SUPPLEMENT = 'Supplement',
  VACCINE = 'Vaccine',
  SHORT_TERM = 'Short term',
  LARC = 'LARC',
}

export enum DeliveryProgressStatus {
  FALSE_LABOR = 'False labor',
  CONTINUE = 'Continue',
  REFER_TO_CEMONC = 'Refer to CEmONC facility',
  LAMA = 'LAMA',
  DISCHARGED = 'Discharged',
}

export enum AmnioticFluidColor {
  CLEAR = 'Clear',
  YELLOW = 'Yellow',
  GREEN = 'Green',
}

export enum MembraneRuptureDuration {
  HOURS_1_18 = '1-18 hours',
  MORE_THAN_18 = 'More than 18 hours',
}

export enum FetalHeartRateRange {
  NORMAL = '110-160 bpm',
  LOW = '< 110 bpm',
  HIGH = '> 160 bpm',
}

export enum ServiceType {
  OPD = 'OPD',
  ANC = 'ANC',
  DELIVERY = 'DELIVERY',
  PNC = 'PNC',
  FAMILY_PLANNING = 'FAMILY_PLANNING',
  IMMUNISATION = 'IMMUNISATION',
  NUTRITION = 'NUTRITION',
  MEDICINE_DISPENSING = 'MEDICINE_DISPENSING',
}

export enum ReferralType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}
export enum ClientType {
  WALK_IN = 'Walk-in',
  REFERRED_BY_LHW = 'Referred by LHW',
  REFERRED_BY_HEALTH_PROVIDER = 'Referred by health provider',
}

export enum ReferralPerson {
  MOTHER = 'Mother',
  CHILD = 'Child',
}

export enum ChildComplications {
  LOW_APGAR_SCORE = 'Low APGAR score',
  NO_SPONTANEOUS_MOVEMENT = 'No spontaneous movement',
  STOPPED_BREASTFEEDING = 'Stopped breastfeeding well',
  HYPOTHERMIA = 'Hypothermia',
  FEVER = 'Fever',
  FAST_BREATHING = 'Fast breathing (breathing rate >60/min)',
  SEVERE_CHEST_IN_DRAWING = 'Severe chest in-drawing',
  HISTORY_OF_CONVULSIONS = 'History of convulsions',
  JAUNDICE = 'Jaundice',
  UNDERWEIGHT = 'Underweight',
  OTHER = 'Other',
}

export enum TypeOfDelivery {
  NORMAL = 'Normal Vaginal Delivery',
  ASSISTED = 'Assisted Delivery (Vacuum/Forceps)',
  C_SECTION = 'C-Section',
  MISCARRIAGE = 'Miscarriage',
  INDUCED_ABORTION = 'Induced Abortion',
}

export enum DurationType {
  WITHIN_48_HOURS = 'Within 48 hours',
  MORE_THAN_48_HOURS_TO_6_WEEKS = 'More than 48 hours to 6 weeks',
  MORE_THAN_6_WEEKS_TO_6_MONTHS = 'More than 6 weeks to 6 months',
  MORE_THAN_6_MONTHS_TO_1_YEAR = 'More than 6 months to 1 year',
  MORE_THAN_1_YEAR_TO_2_YEARS = 'More than 1 year to 2 years',
  MORE_THAN_2_YEARS = 'More than 2 years',
}

export enum CSectionReason {
  PREVIOUS = 'Previous cesarean',
  ARREST_OF_LABOR = 'Arrest of labour',
  FETAL_DISTRESS = 'Fetal distress',
  PLACENTA_PREVIA = 'Placenta previa',
  MALPRESENTATION = 'Malpresentation',
  PREECLAMPSIA = 'Pre-eclampsia/eclampsia',
  FAILED_INSTRUMENTAL = 'Failed instrumental delivery',
  OTHER = 'Other',
}

export enum Sex {
  MALE = 'M',
  FEMALE = 'F',
}

export enum MedicationsOrVaccines {
  OPV = 'OPV',
  HEP_B = 'Hep B',
  ANTIBIOTICS = 'Antibiotics',
}

export enum NewbornSymptomsAssessment {
  RESPIRATORY_DISTRESS = 'Respiratory distress',
  MOANING = 'Moaning',
  CONVULSIONS = 'Convulsions',
  POOR_MOVEMENT = 'Poor movement on stimulation',
  NOT_BREASTFEEDING_WELL = 'Not breastfeeding well',
  JAUNDICE = 'Jaundice',
  OTHER = 'Other',
  NONE = 'None',
}

export enum NameOfNewbornMedicine {
  AMOXICILLIN = 'Amoxicillin',
  AMPICILLIN = 'Ampicillin',
  GENTAMICIN = 'Gentamicin',
  CEFTRIAXONE = 'Ceftriaxone',
  METRONIDAZOLE = 'Metronidazole',
}

export enum ChildCondition {
  ALIVE_HEALTHY = 'Alive and healthy',
  ALIVE_UNHEALTHY = 'Alive and unhealthy',
  DEAD_AFTER_DELIVERY = 'Dead after delivery',
  INTRAUTERINE_DEATH = 'Intrauterine death',
}

export enum DischargeChecklist {
  APPLIED_CHLORHEXIDINE_ON_CORD = 'Applied chlorhexidine on cord',
  COUNSELLED_ON_EXCLUSIVE_BREASTFEEDING = 'Counselled on exclusive breastfeeding',
  INITIATED_BREASTFEEDING_WITHIN_ONE_HOUR = 'Initiated breastfeeding process within one hour',
  COUNSELLED_ON_FAMILY_PLANNING = 'Counselled on family planning',
  PROVIDED_FAMILY_PLANNING_COMMODITIES = 'Provided family planning commodities',
  EXPLAINED_WARNING_SIGNS_FOR_MOTHER_AND_CHILD = 'Explained warning signs for mother and child to patient',
  PROVIDED_COUNSELLING_ON_FALSE_LABOR_MANAGEMENT = 'Provided counselling on false labor management',
}

export enum MotherCondition {
  ALIVE_HEALTHY = 'Alive and healthy',
  ALIVE_UNHEALTHY = 'Alive and unhealthy',
  DEAD = 'Dead',
  REFERRED = 'Referred during delivery',
}

export enum ImmediateSteps {
  OXYTOCIN_WITHIN_1_MIN = 'Oxytocin administered within 1 min',
  PLACENTA_DELIVERED = 'Placenta and membrane delivered',
  WELL_CONTRACTED_UTERUS = 'Well contracted uterus',
  EARLY_BREASTFEEDING = 'Early initiation of breastfeeding process',
}

export enum MedicinesAdministered {
  ANTIHYPERTENSIVE = 'Antihypertensive',
  ANTIBIOTICS = 'Antibiotics',
  MAGNESIUM_SULPHATE = 'Magnesium sulphate',
  INJ_HYDROCORTISONE = 'Inj Hydrocortisone',
  INJ_HEMACEL = 'Inj Hemacel',
  INJ_DEXAMETHASON = 'Inj Dexamethason',
  INJ_SODA_BICARB = 'Inj Soda Bicarb',
  VENTOLIN_SOLUTION = 'Ventolin solution',
  INJ_ADRENALINE = 'Inj Adrenaline',
  INJ_RINGERS_LACTATE = 'Inj ringer lactate',
  INJ_OXYTOCIN = 'Inj. oxytocin',
  INJ_MISOPROSTOL = 'Inj. misoprostol',
  INJ_TRANSAMINE = 'Inj. transamine',
  INJ_ARTHEMETHER = 'Inj Artemether',
}

export enum Complications {
  APH = 'APH',
  PPH = 'PPH',
  CORD_PROLAPSE = 'Cord prolapse',
  SHOULDER_DYSTOCIA = 'Shoulder dystocia',
  PROLONGED_OBSTRUCTED_LABOR = 'Prolonged / Obstructed Labor',
  RUPTURE_UTERUS = 'Rupture uterus',
  PRE_ECLAMPSIA = 'Pre-eclampsia',
  ECLAMPSIA = 'Eclampsia',
  SEPSIS = 'Sepsis',
  OTHER = 'Other',
  NONE = 'None',
}

export enum SymptomsAssessment {
  FOUL_SMELLING_VAGINAL_DISCHARGE = 'Foul smelling vaginal discharge',
  SEVERE_BLEEDING = 'Severe bleeding',
  THIRD_DEGREE_PERINEAL_TEAR = 'Third degree perineal tear',
  FOURTH_DEGREE_PERINEAL_TEAR = 'Fourth degree perineal tear',
  NONE = 'None',
}

export enum FpCommodities {
  ORAL_PILLS_COC = 'Oral pills (COC)',
  ORAL_PILLS_POP = 'Oral pills (POP)',
  EMERGENCY_CONTRACEPTIVE_PILL = 'Emergency Contraceptive Pill',
  CONDOMS = 'Condoms',
  DIAPHRAGM = 'Diaphragm',
  IUCD = 'IUCD',
  IMPLANT_JADELLE = 'Implant (Jadelle)',
  INJECTABLE_SAYANA_PRESS = 'Injectable (Sayana Press)',
  INJECTABLE_3_MONTH = 'Injectable (3 month injection)',
  VASECTOMY = 'Vasectomy',
  TUBAL_LIGATION = 'Tubal ligation',
  INJECTABLE_DEPO_PROVERA = 'Injectable DepoProvera',
  INJECTABLE_NET_EN = 'Injectable Net-En',
}

export enum ServiceCategory {
  FAMILY_PLANNING_SERVICES = 'Family Planning Services',
  LARC_REMOVAL = 'LARC Removal',
}

export enum ClientCategory {
  FAMILY_PLANNING_METHOD = 'Family Planning Method',
  COUNSELING = 'Counseling',
}

export enum MotherComplication {
  HIGH_RISK = 'Categorized as high risk during ANC',
  ANAEMIA = 'Anaemia/low HB',
  HYPERTENSION = 'Hypertension',
  PREECLAMPSIA = 'Preeclampsia',
  ECLAMPSIA = 'Eclampsia',
  ECTOPIC = 'Ectopic pregnancy',
  PLACENTA_PREVIA = 'Placenta previa',
  ANTEPARTUM_HAEMORRHAGE = 'Antepartum haemorrhage',
  CHORIOAMNIONITIS = 'Chorioamnionitis',
  PRETERM_LABOR = 'Preterm labor',
  FETOPELVIC_DISPROPORTION = 'Fetopelvic disproportion',
  NUCAL_CORD = 'Nuchal cord',
  OBSTRUCTED_LABOR = 'Obstructed labor',
  SHOULDER_DYSTOCIA = 'Shoulder dystocia',
  PROLAPSED_CORD = 'Prolapsed umbilical cord',
  UTERINE_RUPTURE = 'Uterine rupture',
  AMNIOTIC_EMBOLISM = 'Amniotic fluid embolism',
  MECONIUM_PASSED = 'Meconium passed',
  PERINATAL_ASPHYXIA = 'Perinatal asphyxia',
  INTRAUTERINE_DEATH = 'Intrauterine death',
  INVERTED_UTERUS = 'Inverted uterus',
  POSTPARTUM_HAEMORRHAGE = 'Postpartum haemorrhage',
  PUERPERAL_SEPSIS = 'Puerperal Sepsis',
  OTHER = 'Other',
  NONE = 'None',
}

export enum ContraceptionType {
  SHORT_TERM = 'Short term',
  LARC = 'LARC',
}

export enum ContraceptiveMethod {
  // Short-term methods
  RUBBER_CONDOM = 'Rubber Condom',
  COC = 'COC',
  POP = 'POP',
  ECP = 'ECP',
  INJECTION_DEPO_3_MONTHS = '3 months Inj Depo',
  INJECTION_SAYANA_PRESS_3_MONTHS = '3 months Inj Sayana Press',

  // LARC methods
  COPPER_T = 'Copper-T',
  MULTILOAD = 'Multiload',
  JADELLE = 'Jadelle',
  IMPLANON = 'Implanon',
  IMPLANON_NXT = 'Implanon NXT',

  // Permanent methods (added)
  TUBAL_LIGATION = 'Tubal ligation (CS for female)',
  VASECTOMY = 'Vasectomy (CS for male)',
}

export enum InsertionPeriod {
  LESS_THAN_3_MONTHS = 'Less than 3 months',
  MORE_THAN_3_TO_6_MONTHS = 'More than 3 months to 6 months',
  MORE_THAN_6_MONTHS_TO_1_YEAR = 'More than 6 months to 1 year',
  LESS_THAN_2_YEARS = 'Less than 2 years',
  LESS_THAN_3_YEARS = 'Less than 3 years',
  MORE_THAN_3_YEARS = 'More than 3 years',
}

export enum RemovalReason {
  WANTED_TO_GET_PREGNANT = 'Wanted to get pregnant',
  HUSBAND_DISAPPROVAL = 'Husband disapproval',
  SIDE_EFFECTS = 'Side effects',
  COMPLICATION = 'Complication',
  COMPLETION_OF_PERIOD = 'Completion of period',
  OPTING_FOR_ANOTHER_METHOD = 'Opting for another method',
}

export const EmrServiceIds = {
  OPD: 1,
  ANC: 2,
  DELIVERY: 3,
  PNC: 4,
  FAMILY_PLANNING: 5,
  IMMUNISATION: 6,
  NUTRITION: 7,
  MEDICINE_DISPENSING: 8,
} as const;

export enum EmrServices {
  OPD = 'OPD',
  ANC = 'ANC',
  DELIVERY = 'DELIVERY',
  PNC = 'PNC',
  FAMILY_PLANNING = 'FAMILY_PLANNING',
  IMMUNISATION = 'IMMUNISATION',
  NUTRITION = 'NUTRITION',
  MEDICINE_DISPENSING = 'MEDICINE_DISPENSING',
}

export const EmrServicesMap: Record<number, EmrServices> = {
  [EmrServiceIds.OPD]: EmrServices.OPD,
  [EmrServiceIds.ANC]: EmrServices.ANC,
  [EmrServiceIds.DELIVERY]: EmrServices.DELIVERY,
  [EmrServiceIds.PNC]: EmrServices.PNC,
  [EmrServiceIds.FAMILY_PLANNING]: EmrServices.FAMILY_PLANNING,
  [EmrServiceIds.IMMUNISATION]: EmrServices.IMMUNISATION,
  [EmrServiceIds.NUTRITION]: EmrServices.NUTRITION,
  [EmrServiceIds.MEDICINE_DISPENSING]: EmrServices.MEDICINE_DISPENSING,
};

export enum VisitStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DISPATCHED = 'dispatched',
  REFERRED_OUT = 'referred_out',
  UNASSIGNED = 'unassigned',
}

export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  FACILITY_INCHARGE = 'facility_incharge',
  HEAD_OFFICE = 'head_office',
  REGISTRATION_CLERK = 'registration_clerk',
  TELEHEALTH_CONSULTANT = 'telehealth_consultant',
  SBA = 'sba',
  MEDICAL_OFFICER_MALE = 'medical_officer_male',
  MEDICAL_OFFICER_FEMALE = 'medical_officer_female',
  VACCINATOR = 'vaccinator',
  DISPENSER = 'dispenser',
  PAEDS = 'paeds',
}

export enum Albumin {
  NEGATIVE = 'Negative',
  POSITIVE = 'Positive',
}

export enum TypeOfService {
  OPD = 'OPD',
  ANC = 'ANC',
  DELIVERY = 'DELIVERY',
  PNC = 'PNC',
  FAMILY_PLANNING = 'FAMILY_PLANNING',
  IMMUNISATION = 'IMMUNISATION',
  NUTRITION = 'NUTRITION',
  MEDICINE_DISPENSING = 'MEDICINE_DISPENSING',
  OTHER = 'Other',
}

export enum ImmunizationStatus {
  COMPLETED = 'Completed',
  TO_BE_SCHEDULED = 'To be scheduled',
}

export enum LabTestUrgency {
  ROUTINE = 'Routine',
  URGENT = 'Urgent',
}

export enum PncWarningSign {
  HEAVY_VAGINAL_BLEEDING = 'Heavy vaginal bleeding',
  RESPIRATORY_DIFFICULTY = 'Respiratory difficulty',
  CONVULSIONS_OR_LOSS_OF_CONSCIOUSNESS = 'Convulsions/loss of consciousness',
  SEVERE_HEADACHE_WITH_BLURRED_VISION = 'Severe headache with blurred vision',
  SEVERE_ABDOMINAL_PAIN = 'Severe abdominal pain',
  FOUL_SMELLING_VAGINAL_DISCHARGE = 'Foul smelling vaginal discharge',
  URINARY_PROBLEM = 'Urinary problem',
  FEVER = 'Fever',
  PPD = 'PPD',
  VAGINAL_TEAR = 'Vaginal tears',
  PAIN_IN_CALF = 'Pain in calf',
  HALLUCINATIONS_OR_SELF_HARM_TENDENCIES = 'Hallucinations/Indication of self harm tendencies',
  NONE = 'None',
  OTHER = 'Other',
}

// Nutrition Module Enums
export enum PatientComingFrom {
  REFER_BY_LHW = 'Refer by LHW',
  REFERRED_BY_ANOTHER_SITE = 'Referred by another site',
  DIRECT_FROM_COMMUNITY = 'Direct from community',
}

export enum ReasonForAdmission {
  RELAPSE = 'Relapse',
  TRANSFER_FROM_STABILISATION_CENTRE = 'Transfer from stabilisation centre',
  RETURN_AFTER_DEFAULT = 'Return after default',
  OTHER = 'Other',
}

export enum EdemaLevel {
  MILD = 'Mild',
  MODERATE = 'Moderate',
  SEVERE = 'Severe',
  NORMAL = 'No edema',
}

export enum NutritionComplication {
  NO_APPETITE_FOR_RUTF_ANOREXIA = 'No appetite for RUTF/anorexia',
  HYPOTHERMIA = 'Hypothermia',
  SEVERE_PNEUMONIA = 'Severe pneumonia',
  SEPTICSHOCK = 'Septicshock',
  CONGESTIVE_HEART_FAILURE = 'Congestive heart failure',
  HYPOGLYCAEMIA = 'Hypoglycaemia',
  DERMATITIS = 'Dermatitis',
  FEVER = 'Fever',
  SEVERE_ANEMIA = 'Severe anemia',
  SEVERE_DEHYDRATION = 'Severe dehydration',
  SEVERE_VOMITING = 'Severe Vomiting',
  UNCONSCIOUS_FITS_OR_CONVULSIONS = 'Unconscious, fits or convulsions',
}

export enum PresentingComplaints {
  FEVER = 'Fever',
  PAIN = 'Pain',
  SWELLING_OR_MASS = 'Swelling or Mass',
  DYSPNEA = 'Dyspnea',
  COUGH = 'Cough',
  VOMITTING = 'Vomitting',
  DIARRHEA = 'Diarrhea',
  FITS = 'Fits',
  WEAKNESS = 'Weakness',
  HEADACHE = 'Headache',
  OTHER = 'Other',
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
}

export enum LabTest {
  CBC = 'Complete Blood Count (CBC)',
  ESR = 'ESR',
  RBS = 'Random Blood Sugar (RBS)',
  FBS = 'Fasting Blood Sugar (FBS)',
  HBA1C = 'HbA1c',
  RENAL_FUNCTION_TESTS_UREA_CREATININE = 'Renal Function Tests (Urea, Creatinine)',
  ELECTROLYTES_NA_K_CL = 'Electrolytes (Na, K, Cl)',
  LFTS = 'Liver Function Tests (LFTs)',
  LIPID_PROFILE = 'Lipid Profile',
  URINE_RE = 'Urine Routine Examination (Urine RE)',
  URINE_PREGNANCY_TEST_B_HCG = 'Urine Pregnancy Test (β-hCG)',
  STOOL_ROUTINE_EXAMINATION = 'Stool Routine Examination',
  MALARIA_TEST = 'Malaria Test',
  DENGUE_NS1_IGM = 'Dengue NS1 / IgM',
  HEPATITIS_B_HBSAG = 'Hepatitis B (HBsAg)',
  HEPATITIS_C_ANTI_HCV = 'Hepatitis C (Anti-HCV)',
  HIV_TEST = 'HIV Test',
  THYROID_FUNCTION_TEST_TSH = 'Thyroid Function Test (TSH)',
  COVID_19_ANTIGEN_PCR = 'COVID-19 Antigen / PCR',
  BLOOD_GROUP_RH_TYPE = 'Blood Group & Rh Type',
  OTHER = 'Other',
}

export enum DiseaseCondition {
  ACUTE_FLACCID_PARALYSIS = 'Acute Flaccid Paralysis',
  MUMPS = 'Mumps',
  MEASLES = 'Measles',
  NEONATAL_TETANUS = 'Neonatal Tetanus',
  DIPHTHERIA = 'Diphtheria',
  TUBERCULOSIS = 'Tuberculosis',
  TYPHOID_FEVER = 'Typhoid Fever',
  PERTUSSIS = 'Pertussis',
  ACUTE_DIARRHEA_NON_CHOLERA = 'Acute Diarrhea (Non-Cholera)',
  ACUTE_WATERY_DIARRHEA_CHOLERA = 'Acute Watery Diarrhea (Cholera)',
  ACUTE_JAUNDICE_SYNDROME_HEPATITIS_A_E = 'Acute Jaundice Syndrome (Hepatitis A & E)',
  NAEGLERIA_FOWLERI = 'Naegleria Fowleri',
  CHICKENPOX = 'Chickenpox',
  PNEUMONIA_LRTI = 'Pneumonia/LRTI',
  SEVERE_ACUTE_RESPIRATORY_INFECTION_SARI = 'Severe Acute Respiratory Infection (SARI)',
  MALARIA = 'Malaria',
  DENGUE_FEVER = 'Dengue Fever',
  CHIKUNGUNYA = 'Chikungunya',
  CRIMEAN_CONGO_HEMORRHAGIC_FEVER_CCHF = 'Crimean Congo Hemorrhagic Fever (CCHF)',
  HEPATITIS_HBV_HCV_HDV = 'Hepatitis (HBV, HCV, HDV)',
  HIV_AIDS = 'HIV/AIDS',
  ANY_OTHER_UNUSUAL_EVENT = 'Any other unusual event',
  LEISHMANIASIS = 'Leishmaniasis',
  BLOODY_DIARRHEA_DYSENTERY = 'Bloody Diarrhea (Dysentery)',
  RABIES = 'Rabies',
  STIS = 'STIs',
  LEPROSY = 'Leprosy',
  MENINGITIS = 'Meningitis',
  RHEUMATIC_FEVER = 'Rheumatic Fever',
  SNAKE_BITE = 'Snake Bite',
  SCABIES = 'Scabies',
  PYREXIA_OF_UNKNOWN_ORIGIN_PUO = 'Pyrexia of Unknown Origin (PUO)',
  HYPERTENSION = 'Hypertension',
  DIABETES = 'Diabetes',
  ISCHEMIC_HEART_DISEASE_MI = 'Ischemic heart disease/MI',
  HEART_FAILURE = 'Heart failure',
  STROKE = 'Stroke',
  ASTHMA = 'Asthma',
  COPD = 'COPD',
  HEPATITIS_B = 'Hepatitis B',
  HEPATITIS_C = 'Hepatitis C',
  CHRONIC_KIDNEY_DISEASE = 'Chronic kidney disease',
  THYROID_DISEASE = 'Thyroid disease',
  DYSLIPIDEMIA = 'Dyslipidemia',
  ANEMIA = 'Anemia',
  BLEEDING_CLOTTING_DISORDER = 'Bleeding/clotting disorder',
  PEPTIC_ULCER = 'Peptic ulcer',
  EPILEPSY_SEIZURE_DISORDER = 'Epilepsy / Seizure disorder',
  HIV = 'HIV',
  AUTOIMMUNE_DISEASE = 'Autoimmune disease',
  CANCER = 'Cancer',
  MAJOR_SURGERY = 'Major surgery',
  PSYCHIATRIC_RELATED = 'Psychiatric-related',
  OTHER = 'Other',
  NONE = 'None',
}

export enum MotherDeathCauses {
  APH = 'APH',
  PPH = 'PPH',
  CORD_PROLAPSE = 'Cord prolapse',
  SHOULDER_DYSTOCIA = 'Shoulder dystocia',
  PROLONGED_OBSTRUCTED_LABOR = 'Prolonged / Obstructed Labor',
  RUPTURE_UTERUS = 'Rupture uterus',
  PRE_ECLAMPSIA = 'Pre-eclampsia',
  ECLAMPSIA = 'Eclampsia',
  SEPSIS = 'Sepsis',
  OTHER_OBSTETRIC_CAUSE = 'Other obstetric cause',
  OTHER_NON_OBSTETRIC_CAUSE = 'Other non-obstetric cause',
}

export enum BabyDeathCauses {
  BIRTH_TRAUMA = 'Birth Trauma',
  HYPOTHERMIA = 'Hypothermia',
  PREMATURITY = 'Prematurity',
  BIRTH_ASPHYXIA = 'Birth asphyxia',
  SEPSIS = 'Sepsis',
  OTHER = 'Other',
}

export enum OtherPrescriptionCategory {
  MEDICINE = 'Medicine',
  SUPPLEMENT = 'Supplement',
}

export enum AssociatedConditions {
  HYPERTENSION = 'Hypertension',
  DIABETES = 'Diabetes',
  THYROID_DISORDER = 'Thyroid disorder',
  DYSLIPIDEMIA = 'Dyslipidemia',
  ANEMIA = 'Anemia',
  ASTHMA = 'Asthma',
  COPD = 'COPD',
  CHRONIC_KIDNEY_DISEASE = 'Chronic kidney disease',
  HEPATITIS_B = 'Hepatitis B',
  HEPATITIS_C = 'Hepatitis C',
  HIV = 'HIV',
  TUBERCULOSIS = 'Tuberculosis',
  EPILEPSY_SEIZURE_DISORDER = 'Epilepsy / Seizure disorder',
  BLEEDING_CLOTTING_DISORDER = 'Bleeding/clotting disorder',
  AUTOIMMUNE_DISEASE = 'Autoimmune disease',
  HEART_FAILURE = 'Heart failure',
  ISCHEMIC_HEART_DISEASE_MI = 'Ischemic heart disease / MI',
  STROKE = 'Stroke',
  MAJOR_SURGERY = 'Major surgery',
  PSYCHIATRIC_CONDITION = 'Psychiatric condition',
  OTHER = 'Other',
  NONE = 'None',
}

export enum VaccineAppliedTo {
  CHILD = 'Child',
  ADULT = 'Adult',
}

export enum VaccineGenderRestriction {
  ANY = 'Any',
  FEMALE = 'Female',
  MALE = 'Male',
}

export enum VaccineCatchUpMode {
  NONE = 'None',
  NOT_ALLOWED = 'NotAllowed',
  IMMEDIATE = 'Immediate',
  AFTER_INTERVAL = 'AfterInterval',
  SINGLE_DOSE = 'SingleDose',
  ON_FIRST_CONTACT = 'OnFirstContact',
  NA = 'NA',
}

export enum PatientImmunizationStatus {
  GIVEN = 'GIVEN',
  NOT_GIVEN = 'NOT_GIVEN',
  UNKNOWN = 'UNKNOWN',
}

export enum ImmunizationSource {
  CARD = 'CARD',
  RECALL = 'RECALL',
  FACILITY = 'FACILITY',
}

export enum ImmunisationDosageStatus {
  PENDING = 'Pending',
  SCHEDULED = 'Scheduled',
  ADMINISTERED = 'Administered',
  DEFAULTER = 'Defaulter',
  EXPIRED = 'Expired',
  CLOSED = 'Closed',
  REFUSED = 'REFUSED',
  RETRO = 'RETRO',
  RETRO_DATE_MISSING = 'RETRO_DATE_MISSING',
  VACCINATED = 'VACCINATED',
  scheduled = 'SCHEDULED',
}

export enum IssuedTo {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  FACILITY_INCHARGE = 'facility_incharge',
  REGISTRATION_CLERK = 'registration_clerk',
  SBA = 'sba',
  MEDICAL_OFFICER_MALE = 'medical_officer_male',
  MEDICAL_OFFICER_FEMALE = 'medical_officer_female',
  VACCINATOR = 'vaccinator',
  DISPENSER = 'dispenser',
}

export enum Purpose {
  STAFF_ON_CALL_DUTY = 'STAFF ON CALL DUTY',
  EMERGENCY_USE = 'EMERGENCY USE',
  STOCK_REFILL = 'STOCK REFILL',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum NationalityStatus {
  PAKISTANI = 'Pakistani',
  NON_PAKISTANI = 'Non-Pakistani',
}

export enum AttendanceStatus {
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
}
export enum IdentityProvider {
  SELF = 'Self',
  MOTHER = 'Mother',
  FATHER = 'Father',
  SIBLING = 'Sibling',
  SPOUSE = 'Spouse',
  GUARDIAN = 'Guardian',
  UNCLE_AUNT = 'Uncle/Aunt (blood-relation)',
  OTHER = 'Other',
}

export enum EmergencyServiceType {
  OPD = 'OPD',
  ANTENATAL_CARE = 'ANC',
  DELIVERY = 'Delivery',
  POSTNATAL_CARE = 'PNC',
  FAMILY_PLANNING = 'Family planning',
  NUTRITION = 'Nutrition',
  OTHER = 'Other',
}

export enum EmergencyOutcomeServiceType {
  OPD = 'OPD',
  ANTENATAL_CARE = 'ANC',
  DELIVERY = 'Delivery',
  POSTNATAL_CARE = 'PNC',
  FAMILY_PLANNING = 'Family planning',
  NUTRITION = 'Nutrition',
  Immunisation = 'Immunisation',
  OTHER = 'Other',
}
export enum PatientOutcome {
  DISCHARGED = 'Discharged',
  REFERRED = 'Referred',
  LAMA = 'LAMA',
  EXPIRED = 'Expired',
  ADMITTED = 'Admitted',
}

export enum ReportType {
  PATIENTS = 'patients',
  SINGLE_PATIENT = 'single-patient',
  SERVICE = 'service',
  MEDICINE = 'medicine',
  DOCTOR = 'doctor',
  IMMUNISATION = 'immunisation',
  DELIVERY = 'delivery',
}

export enum PhoneProvider {
  Self = 'Self',
  Mother = 'Mother',
  Father = 'Father',
  Sibling = 'Sibling',
  Spouse = 'Spouse',
  Guardian = 'Guardian',
  UncleAunt = 'Uncle/Aunt (blood-relation)',
  Other = 'Other',
}

export enum PatientRegistrationType {
  INTERNAL = 'Internal',
  DELIVERY = 'Delivery',
  OUTREACH = 'Outreach',
  PRIVATE = 'Private',
  OTHER = 'Other',
}

export enum ImmunisationReportFilterType {
  DEFAULTER = 'Defaulter',
  SCHEDULED = 'Scheduled',
  NO_DOSE = 'No Dose',
}

export enum ReportExportType {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export enum PatientDailyRollupType {
  TOTAL = 'TOTAL',
  FACILITY = 'FACILITY',
  DIVISION = 'DIVISION',
  DISTRICT = 'DISTRICT',
  TALUKA = 'TALUKA',
  UC = 'UC',
}

export enum ImmunisationDailyRollupType {
  TOTAL = 'TOTAL',
  VACCINE = 'VACCINE',
  FACILITY = 'FACILITY',
  DIVISION = 'DIVISION',
  DISTRICT = 'DISTRICT',
  TALUKA = 'TALUKA',
  UC = 'UC',
}