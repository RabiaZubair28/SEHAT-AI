import React from "react";
import { Col, Row } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

type MedicineBatchFields = {
  formFieldsTab: any;
  formValues: any;
  // editMode: boolean;
};

const MedicineBatchFields: React.FC<MedicineBatchFields> = ({
  formFieldsTab,
  formValues,
}) => {
  // ✅ Find the Medicine Dispensing tab config

  const filteredFields = formFieldsTab?.fields;

  return (
    <>
      {filteredFields?.length > 0 && (
        <Row gutter={16}>
          {filteredFields.map((field: any) => (
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
                disabled: field?.disabled,
              })}
            </Col>
          ))}
        </Row>
      )}
    </>
  );
};

export default MedicineBatchFields;
