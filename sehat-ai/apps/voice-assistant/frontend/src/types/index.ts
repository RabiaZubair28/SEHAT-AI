export interface ExtractedField {
  value: unknown;
  raw_value?: string | null;
  status: string;
}

export interface ExtractedReference {
  spoken_label: string;
  resolved_id: string | number | null;
  status: string;
}

export interface ExtractionResult {
  transcript?: string;
  detected_language?: string | null;
  engine?: "ai" | "legacy";
  fields: Record<string, ExtractedField>;
  references: Record<string, ExtractedReference>;
  unresolved: Array<{ field_name: string; reason: string; raw_value?: string | null }>;
  missing_required_fields: string[];
  requires_review: boolean;
}

export type PatientRegistrationSection = "personal_details" | "sociodemographic_details";
