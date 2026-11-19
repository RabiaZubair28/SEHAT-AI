import { Row, Col } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

export default function SupplementsPrescriptions({
  formFields,
  editMode,
  isServiceCompleted,
  formValues,
}: any) {
  const tab = formFields.find((tab: any) => tab.tabKey === "3");
  const filteredFields = tab?.fields || [];

  return (
    <div>
      {filteredFields.length > 0 ? (
        <Row gutter={16}>
          {filteredFields.map((field: any) => {
            const isSupplementsField =
              field.name === "supplements" ||
              field.name === "supplements_prescribed";

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
                  disabled:
                    !editMode ||
                    field.disabled ||
                    (isServiceCompleted && isSupplementsField),
                  formValues,
                })}
              </Col>
            );
          })}
        </Row>
      ) : (
        <div>No fields to display</div>
      )}
    </div>
  );
}
