import React from "react";
import { Row, Col } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

interface PatientDetailsProps {
  fields: any[];
  editMode: boolean;
  formValues: any;
  form: any;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({
  fields,
  editMode,
  form,
}) => {
  const filteredFields = (fields || []).filter((field: any) => {
    if (typeof field?.visibleIf === "function") {
      const completeFormValues = form.getFieldsValue(true);
      return field?.visibleIf(completeFormValues);
    }
    return true;
  });

  return (
    <div>
      {filteredFields.length > 0 ? (
        <Row gutter={16}>
          {filteredFields.map((field) => (
            <Col
              key={field.name}
              xs={24}
              sm={24}
              md={field.colSpan || 8}
              lg={field.colSpan || 8}
            >
              {FormGenerator({
                ...field,
                disabled: field.disabled || !editMode,
                formValues: form.getFieldsValue(true),
              })}
            </Col>
          ))}
        </Row>
      ) : (
        <div>No patient details to display</div>
      )}
    </div>
  );
};

export default PatientDetails;
