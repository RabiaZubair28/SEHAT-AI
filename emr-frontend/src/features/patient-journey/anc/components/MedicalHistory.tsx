import { Row, Col } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

interface MedicalHistoryProps {
  formFields: any[];
  editMode: boolean;
}

export default function MedicalHistory({
  formFields,
  editMode,
}: MedicalHistoryProps) {
  const tab = formFields.find((tab: any) => tab.tabKey === "2");
  const filteredFields = tab?.fields || [];

  return (
    <div>
      {filteredFields.length > 0 ? (
        <Row gutter={16}>
          {filteredFields.map((field: any) => (
            <Col
              key={field.name}
              xs={24}
              sm={24}
              md={field.colSpan || 8}
              lg={field.colSpan || 8}
            >
              {FormGenerator({ ...field, disabled: !editMode })}
            </Col>
          ))}
        </Row>
      ) : (
        <div>No fields to display</div>
      )}
    </div>
  );
}
