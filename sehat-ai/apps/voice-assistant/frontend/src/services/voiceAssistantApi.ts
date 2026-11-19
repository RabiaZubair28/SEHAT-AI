import type { ExtractionResult, PatientRegistrationSection } from "../types";
export type { ExtractionResult, ExtractedField, ExtractedReference, PatientRegistrationSection } from "../types";

const voiceUrl = (base: string, path: string) =>
  `${base.replace(/\/$/, "")}/api/voice-assistant/${path}`;

// New pilot: one audio request, with AI proposals returned for review.
export async function interpretPatientRegistrationAudio(
  apiBaseUrl: string,
  sectionId: PatientRegistrationSection,
  audio: File,
): Promise<ExtractionResult> {
  const body = new FormData();
  body.append("form_id", "patient_registration");
  body.append("section_id", sectionId);
  body.append("file", audio);

  const response = await fetch(voiceUrl(apiBaseUrl, "interpret"), {
    method: "POST",
    body,
  });

  if (response.status === 404) {
    throw new Error("AI interpretation is disabled on the voice server.");
  }
  if (!response.ok) {
    throw new Error(`AI interpretation failed (${response.status}).`);
  }

  return { ...(await response.json() as ExtractionResult), engine: "ai" };
}

// Existing extractor stays available until the pilot is verified.
export async function extractPatientRegistrationFields(
  apiBaseUrl: string,
  sectionId: PatientRegistrationSection,
  transcript: string,
): Promise<ExtractionResult> {
  const response = await fetch(voiceUrl(apiBaseUrl, "extract"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form_id: "patient_registration", section_id: sectionId, transcript }),
  });
  if (!response.ok) throw new Error(`Extraction failed (${response.status})`);
  return { ...(await response.json() as ExtractionResult), engine: "legacy" };
}
