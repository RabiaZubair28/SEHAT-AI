import React from "react";
import { Checkbox, Col, Form, Radio, Row, Tag } from "antd";
import type { Overview } from "../types";
import { ALLERGEN_LABELS } from "../utils/planUtils";
import { AdvisorForm, NONE_OPTION, exclusiveNoneChange } from "../utils/patient-details";

interface Props { overview: Overview; form: AdvisorForm; }
export const AllergiesDietSection: React.FC<Props> = ({ overview, form }) => (
  <>
<div className="na-preferences-section" role="heading" aria-level={3}>
          Allergies & diet
        </div>
        {overview.recordedAllergies.length > 0 && (
          <div style={{ marginBottom: 8, fontSize: 13 }}>
            Recorded in OPD:{" "}
            {overview.recordedAllergies.map((a) => (
              <Tag key={a}>{a}</Tag>
            ))}
          </div>
        )}
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Food allergies" name="allergies">
              <Checkbox.Group
                options={[{ value: NONE_OPTION, label: "None" }, ...Object.entries(ALLERGEN_LABELS).map(([value, label]) => ({ value, label }))]}
                onChange={(values) => exclusiveNoneChange("allergies", values as string[], form)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Diet" name="dietType" rules={[{ required: true }]}>
              <Radio.Group
                options={[
                  { value: "any", label: "No restriction" },
                  { value: "vegetarian_with_egg", label: "Vegetarian (eats egg)" },
                  { value: "vegetarian", label: "Vegetarian (no egg)" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
  </>
);
