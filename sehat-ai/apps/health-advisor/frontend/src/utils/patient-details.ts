import { Form } from "antd";
import type { HealthCondition } from "../types";

export const NONE_OPTION = "__none__";
export type AdvisorForm = ReturnType<typeof Form.useForm>[0];
export const HEALTH_CONDITION_OPTIONS: { value: HealthCondition; label: string }[] = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hypertension", label: "Hypertension" },
  { value: "heart_disease", label: "Heart disease" },
  { value: "chronic_kidney_disease", label: "Chronic kidney disease" },
  { value: "liver_disease", label: "Liver disease" },
  { value: "dyslipidemia", label: "High cholesterol / dyslipidemia" },
];
export const exclusiveNoneChange = (field: string, values: string[], form: AdvisorForm) => {
  const wasSelected = (form.getFieldValue(field) ?? []).includes(NONE_OPTION);
  form.setFieldValue(field, values.includes(NONE_OPTION) ? (wasSelected ? values.filter((v) => v !== NONE_OPTION) : [NONE_OPTION]) : values);
};
