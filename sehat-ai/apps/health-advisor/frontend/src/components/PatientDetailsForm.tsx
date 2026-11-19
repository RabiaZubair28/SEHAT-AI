import React, { useEffect } from "react";
import { Button, Form } from "antd";
import type { FoodItem, Overview, Preferences } from "../types";
import { HealthConditionsSection } from "./HealthConditionsSection";
import { AllergiesDietSection } from "./AllergiesDietSection";
import { FoodPreferencesSection } from "./FoodPreferencesSection";
import { NONE_OPTION } from "../utils/patient-details";

interface Props { overview: Overview; foods: FoodItem[]; value: Preferences; onContinue: (prefs: Preferences) => void; generating?: boolean; }
const PatientDetailsForm: React.FC<Props> = ({ overview, foods, value, onContinue, generating }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      ...value,
      allergies: value.allergies.length ? value.allergies : [NONE_OPTION],
      healthConditions: value.healthConditions?.length ? value.healthConditions : [NONE_OPTION],
      excludedFoodIds: value.excludedFoodIds.length ? value.excludedFoodIds : [NONE_OPTION],
      preferredFoodIds: value.preferredFoodIds.length ? value.preferredFoodIds : [NONE_OPTION],
    });
  }, [value, overview.derivedRestrictions, form]);

  const toPreferences = (v: any): Preferences => ({
    allergies: (v.allergies ?? []).filter((allergen: string) => allergen !== NONE_OPTION),
    otherAllergies: value.otherAllergies,
    dietType: v.dietType,
    healthConditions: (v.healthConditions ?? []).filter((condition: string) => condition !== NONE_OPTION),
    medicalRestrictions: value.medicalRestrictions,
    excludedFoodIds: (v.excludedFoodIds ?? []).filter((id: string) => id !== NONE_OPTION),
    preferredFoodIds: (v.preferredFoodIds ?? []).filter((id: string) => id !== NONE_OPTION),
    budget: v.budget,
    activityLevel: v.activityLevel,
    notes: undefined,
    measurementCorrections: value.measurementCorrections,
  });

  const handleFinish = (v: any) => onContinue(toPreferences(v));

  const handleContinue = () => form.submit();
  return (
    <div className="na-card na-patient-details-form">
      <Form form={form} layout="vertical" onFinish={handleFinish} disabled={generating}>
        <HealthConditionsSection form={form} />
        <AllergiesDietSection overview={overview} form={form} />
        <FoodPreferencesSection foods={foods} form={form} />
      </Form>
      <div className="na-patient-details-actions">
        <Button type="primary" loading={generating} onClick={handleContinue}>Generate Advice and Continue</Button>
      </div>
    </div>
  );
};
export default PatientDetailsForm;
