import React from "react";
import { Row, Col } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";
interface SocialDetailsProps {
  fields: any[];
  editMode: boolean;
  formValues: any;
}

const SocialDetails: React.FC<SocialDetailsProps> = ({
  fields,
  editMode,
  formValues,
}) => {
  const filteredFields = (fields || []).filter((field: any) => {
    if (typeof field.visibleIf === "function") {
      return field.visibleIf(formValues);
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

export default SocialDetails;
