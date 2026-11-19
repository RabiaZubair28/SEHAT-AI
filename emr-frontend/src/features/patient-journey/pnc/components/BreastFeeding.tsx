import { Row, Col } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

export default function BreastFeeding({
  formFields,
  editMode,
}: any) {

  const tab = formFields.find((tab: any) => tab.tabKey === "3");
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
