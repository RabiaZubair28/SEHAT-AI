
import type { ExtractionResult } from "../types";

export interface FormFieldDefinition {
  name: string;
  type?: string;
  options?:
    | Array<{ label?: unknown; value: unknown }>
    | ((values: Record<string, unknown>) => Array<{
        label?: unknown;
        value: unknown;
      }>);
}

export interface FormTabDefinition {
  key: string;
  fields: FormFieldDefinition[];
}

export type FieldQuality = "review" | "invalid";

export interface MappingResult {
  values: Record<string, unknown>;
  quality: Record<string, FieldQuality>;
  unmatched: Record<string, string>;
}

const compact = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const aliases: Record<string, string> = {
  firstname: "first_name",
  lastname: "last_name",
  guardianname: "guardian_name",
  fathername: "guardian_name",
  fathersname: "guardian_name",
  husbandname: "guardian_name",
  nationality: "nationalityStatus",
  nationalitystatus: "nationalityStatus",
  cnic: "cnic",
  cnicnumber: "cnic",
  nationalid: "cnic",
  nationalidnumber: "cnic",
  cnicprovider: "cnic_provider",
  identityprovider: "cnic_provider",
  phoneprovider: "phone_provider",
  phonerelation: "phone_provider",
  mobilenumber: "phone_number",
  mobile: "phone_number",
  phonenumber: "phone_number",
  contactnumber: "phone_number",
  dateofbirth: "dob",
  birthdate: "dob",
  dob: "dob",
  sex: "gender",
  gender: "gender",
  maritalstatus: "marital_status",
  bloodgroup: "blood_group",
  bloodtype: "blood_group",
  address: "address",
  residentialaddress: "address",
  motherlanguage: "mother_tongue",
  mothertongue: "mother_tongue",
  educationlevel: "years_of_education",
  yearsofeducation: "years_of_education",
  dwellingtype: "dwelling_type",
  householdmemberscount: "household_members_count",
  householdmembers: "household_members_count",
  occupationheadofhousehold: "occupation_head_of_household",
};

const protectedFields = new Set([
  "age",
  "qr_number",
  "scan_immunisation_card",
]);

const locationFields = new Set([
  "division_id",
  "district_id",
  "taluka_id",
  "uc_id",
]);

const spokenSymbols: Array<[RegExp, string]> = [
  [/\b(?:forward\s+slash|slash)\b/gi, "/"],
  [/\b(?:back\s+slash|backslash)\b/gi, "\\"],
  [/\b(?:hyphen|dash|minus)\b/gi, "-"],
  [/\b(?:exclamation\s+mark|exclamation\s+point)\b/gi, "!"],
  [/\bquestion\s+mark\b/gi, "?"],
  [/\b(?:full\s+stop|period|dot)\b/gi, "."],
  [/\bcomma\b/gi, ","],
  [/\bcolon\b/gi, ":"],
  [/\bsemi\s*colon\b/gi, ";"],
  [/\bat\s+sign\b/gi, "@"],
  [/\bat\s+the\s+rate\b/gi, "@"],
  [/\b(?:hash|hashtag)\b/gi, "#"],
  [/\b(?:ampersand)\b/gi, "&"],
  [/\bopen\s+bracket\b/gi, "("],
  [/\bclose\s+bracket\b/gi, ")"],
  [/\bapostrophe\b/gi, "'"],
  [/\b(?:quotation\s+mark|double\s+quote)\b/gi, '"'],
];

export function normalizeSpokenPunctuation(
  input: string
): string {
  let output = input;

  for (const [pattern, symbol] of spokenSymbols) {
    output = output.replace(pattern, symbol);
  }

  return output
    .replace(/\s+([,.;:!?/\\)\]])/g, "$1")
    .replace(/([(/\\[])\s+/g, "$1")
    .replace(/\s+-\s+/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getOptions(
  field: FormFieldDefinition,
  values: Record<string, unknown>
): Array<{ label?: unknown; value: unknown }> {
  if (typeof field.options === "function") {
    return field.options(values) ?? [];
  }

  return field.options ?? [];
}

function matchOption(
  raw: unknown,
  options: Array<{ label?: unknown; value: unknown }>
): unknown | undefined {
  const candidate = compact(raw);

  if (!candidate) return undefined;

  for (const option of options) {
    if (
      compact(option.value) === candidate ||
      compact(option.label) === candidate
    ) {
      return option.value;
    }
  }

  return undefined;
}

function normalizeBloodGroup(raw: unknown): string {
  const text = String(raw).toUpperCase().replace(/\s+/g, "");

  const match = text.match(
    /^(AB|A|B|O)(\+|-|\+VE|-VE|POSITIVE|NEGATIVE)$/
  );

  if (!match) return String(raw);

  const positive = ["+", "+VE", "POSITIVE"].includes(
    match[2]
  );

  return `${match[1]} ${positive ? "+ve" : "-ve"}`;
}

function normalizeDate(raw: unknown): string | null {
  const text = String(raw).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return text;
}

function formatCNIC(raw: unknown): string {
  const digits = String(raw).replace(/\D/g, "");

  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }

  return String(raw).trim();
}

function formatPhone(raw: unknown): string {
  const digits = String(raw).replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("03")) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return String(raw).trim();
}

function qualityFromStatus(
  status: string
): FieldQuality | undefined {
  const normalized = status.toLowerCase();

  if (
    normalized === "valid" ||
    normalized === "validated"
  ) {
    return undefined;
  }

  if (
    normalized === "invalid" ||
    normalized === "error"
  ) {
    return "invalid";
  }

  return "review";
}

export function mapVoiceToPatientForm(
  extraction: ExtractionResult,
  tabs: FormTabDefinition[],
  activeTabKey: string,
  currentValues: Record<string, unknown>
): MappingResult {
  const values: Record<string, unknown> = {};
  const quality: Record<string, FieldQuality> = {};
  const unmatched: Record<string, string> = {};

  const tab = tabs.find((item) => item.key === activeTabKey);

  const fieldMap = new Map(
    (tab?.fields ?? []).map((field) => [
      compact(field.name),
      field,
    ])
  );

  const entries = Object.entries(extraction.fields ?? {})
    .map(([originalName, item]) => ({
      fieldName:
        aliases[compact(originalName)] ?? originalName,
      item,
    }))
    .sort((left, right) => {
      const priority = [
        "nationalityStatus",
        "cnic_provider",
        "phone_provider",
      ];

      const rank = (name: string) => {
        const index = priority.indexOf(name);
        return index === -1 ? 100 : index;
      };

      return rank(left.fieldName) - rank(right.fieldName);
    });

  for (const { fieldName, item } of entries) {
    const field = fieldMap.get(compact(fieldName));

    if (!field || protectedFields.has(fieldName)) {
      continue;
    }

    const raw = item.value ?? item.raw_value;

    if (
      raw === null ||
      raw === undefined ||
      String(raw).trim() === ""
    ) {
      continue;
    }

    if (locationFields.has(fieldName)) {
      unmatched[fieldName] = String(raw);
      continue;
    }

    let value: unknown = raw;

    if (fieldName === "address" && extraction.engine !== "ai") {
      // Legacy-only rule. AI output must keep its contextual punctuation.
      value = normalizeSpokenPunctuation(String(raw));
    }

    if (fieldName === "cnic") {
      value = formatCNIC(raw);
    }

    if (fieldName === "phone_number") {
      value = formatPhone(raw);
    }

    if (fieldName === "blood_group") {
      value = normalizeBloodGroup(raw);
    }

    if (fieldName === "dob") {
      const date = normalizeDate(raw);

      if (!date) {
        unmatched[fieldName] = String(raw);
        continue;
      }

      value = date;
    }

    if (
      field.type === "select" ||
      field.type === "radio"
    ) {
      const options = getOptions(field, {
        ...currentValues,
        ...values,
      });

      const matched = matchOption(value, options);

      if (matched === undefined) {
        unmatched[fieldName] = String(raw);
        continue;
      }

      value = matched;
    } else if (field.type === "number") {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        unmatched[fieldName] = String(raw);
        continue;
      }

      value = number;
    } else {
      value = String(value);
    }

    values[String(field.name)] = value;

    const classification = qualityFromStatus(
      String(item.status ?? "review")
    );

    if (classification) {
      quality[String(field.name)] = classification;
    }

    if (
      fieldName === "cnic" &&
      String(raw).replace(/\D/g, "").length !== 13
    ) {
      quality[String(field.name)] = "invalid";
    }

    if (
      fieldName === "phone_number" &&
      !/^03\d{9}$/.test(String(raw).replace(/\D/g, ""))
    ) {
      quality[String(field.name)] = "invalid";
    }
  }

  return { values, quality, unmatched };
}
