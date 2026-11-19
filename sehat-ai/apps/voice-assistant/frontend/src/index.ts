export { VoiceRecorder } from "./components/VoiceRecorder";
export { default as PatientRegistrationVoice } from "./pages/PatientRegistrationVoice";
export type { TranscriptionResult } from "./components/VoiceRecorder";
export type { ExtractionResult, ExtractedField, ExtractedReference, PatientRegistrationSection } from "./types";
export { matchOption } from "./utils/optionMatcher";
export type { MatchableOption } from "./utils/optionMatcher";
export { mapVoiceToPatientForm, normalizeSpokenPunctuation } from "./utils/patientFormMapper";
export type { FieldQuality, FormFieldDefinition, FormTabDefinition } from "./utils/patientFormMapper";
