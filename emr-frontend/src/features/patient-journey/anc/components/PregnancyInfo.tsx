import { Row, Col } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

export default function PregnancyInfo({
  formFields,
  editMode,
  formValues,
}: any) {
  const tab = formFields.find((tab: any) => tab.tabKey === "1");
  const filteredFields = tab?.fields || [];
  // 🔥 Correct way to read values

  return (
    <div>
      {filteredFields.length > 0 ? (
        <Row gutter={16}>
          {filteredFields.map((field: any) => {
            // ✅ For table type, pass formValues directly
            if (field.type === "table") {
              return (
                <Col key={field.name} span={24}>
                  {FormGenerator({
                    ...field,
                    disabled: !editMode || field?.disabled,
                    formValues: formValues,
                  })}
                </Col>
              );
            }

            // Regular fields
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
                  disabled: !editMode || field?.disabled,
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
