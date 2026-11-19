import { Row, Col } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

export default function ImmunnisationDetails({
  formFields,
  tabKey = "1",
  editMode,
  formValues,
}: any) {
  const tab = formFields.find((tab: any) => tab.tabKey === tabKey);
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
              {FormGenerator({
                ...field,
                disabled: !editMode
                  ? true
                  : typeof field.disabled === "function"
                    ? field.disabled
                    : !!field.disabled,
                formValues,
              })}
            </Col>
          ))}
        </Row>
      ) : (
        <div>No fields to display</div>
      )}
    </div>
  );
}
