import React from "react";
import { Col, Row } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

type MedicineDispensingProps = {
  formFields: any;
  isServiceCompleted: boolean;
  formValues: any;
};
const MedicineDispensing: React.FC<MedicineDispensingProps> = ({
  formFields,
  formValues,
  isServiceCompleted,
}) => {
  const tab = formFields.find((tab: any) => tab.tabKey === "1");
  const filteredFields = tab?.fields || [];

  return (
    <Row gutter={16}>
      {filteredFields.map((field: any) => {
        if (field.type === "table") {
          return (
            <Col key={field.name} span={24}>
              {FormGenerator({
                ...field,
                disabled: field?.disabled,
                formValues,
              })}
            </Col>
          );
        }

        return (
          <Col
            key={field.name}
            xs={24}
            sm={24}
            md={field.colSpan || 8}
            lg={field.colSpan || 8}
          >
            {FormGenerator({
              ...field,
              formValues,
              disabled: isServiceCompleted || field?.disabled,
            })}
          </Col>
        );
      })}
    </Row>
  );
};

export default MedicineDispensing;
