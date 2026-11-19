import { Row, Col } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

interface GeneralScreeningProps {
  formFields: any[];
  editMode: boolean;
  isServiceCompleted: boolean;
  formValues: any;
}

export default function FamilyPlanningFields({
  formFields,
  editMode,
  formValues,
  isServiceCompleted,
}: GeneralScreeningProps) {
  const tab = formFields?.find((tab: any) => tab.tabKey === "1");
  const filteredFields = tab?.fields || [];

  return (
    <div>
      {filteredFields.length > 0 ? (
        <Row gutter={16}>
          {
            // ✅ log field here

            filteredFields.map((field: any) => (
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
                  isServiceCompleted,
                })}
              </Col>
            ))
          }
        </Row>
      ) : (
        <div>No fields to display</div>
      )}
    </div>
  );
}
