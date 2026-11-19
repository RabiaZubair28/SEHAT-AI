import React from "react";
import { Checkbox, Col, Form, Row } from "antd";
import { AdvisorForm, HEALTH_CONDITION_OPTIONS, NONE_OPTION, exclusiveNoneChange } from "../utils/patient-details";

interface Props { form: AdvisorForm; }
export const HealthConditionsSection: React.FC<Props> = ({ form }) => (
  <>
<div className="na-preferences-section" role="heading" aria-level={3}>
          Health conditions
        </div>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Other conditions reported by the patient or caregiver"
              name="healthConditions"
            >
              <Checkbox.Group
                options={[{ value: NONE_OPTION, label: "None" }, ...HEALTH_CONDITION_OPTIONS]}
                onChange={(values) => exclusiveNoneChange("healthConditions", values as string[], form)}
              />
            </Form.Item>
          </Col>
        </Row>
  </>
);
