import React from "react";
import { Col, Form, Radio, Row, Select } from "antd";
import type { FoodItem } from "../types";
import { AdvisorForm, NONE_OPTION, exclusiveNoneChange } from "../utils/patient-details";

interface Props { foods: FoodItem[]; form: AdvisorForm; }
export const FoodPreferencesSection: React.FC<Props> = ({ foods, form }) => {
  const foodOptions = foods.map((food) => ({ value: food.id, label: food.name }));
  return (
    <>
<div className="na-preferences-section" role="heading" aria-level={3}>
          Preferences, affordability & activity
        </div>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Foods to avoid (dislikes or not available locally)" name="excludedFoodIds">
              <Select
                mode="multiple"
                popupClassName="na-green-select-popup"
                options={[{ value: NONE_OPTION, label: "None" }, ...foodOptions]}
                optionFilterProp="label"
                placeholder="Select foods"
                onChange={(values) => exclusiveNoneChange("excludedFoodIds", values as string[], form)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Preferred foods" name="preferredFoodIds">
              <Select
                mode="multiple"
                popupClassName="na-green-select-popup"
                options={[{ value: NONE_OPTION, label: "None" }, ...foodOptions]}
                optionFilterProp="label"
                placeholder="Select foods"
                onChange={(values) => exclusiveNoneChange("preferredFoodIds", values as string[], form)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Food budget" name="budget" rules={[{ required: true }]}>
              <Radio.Group
                optionType="button"
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Usual activity level" name="activityLevel" rules={[{ required: true }]}>
              <Radio.Group
                optionType="button"
                options={[
                  { value: "sedentary", label: "Mostly sitting" },
                  { value: "light", label: "Light (walks, housework)" },
                  { value: "moderate", label: "Moderate (manual work)" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
    </>
  );
};
