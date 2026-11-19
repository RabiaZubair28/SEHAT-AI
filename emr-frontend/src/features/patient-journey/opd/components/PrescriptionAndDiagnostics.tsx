import React from "react";
import { Col, Modal, Row, Typography } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

const { Text } = Typography;

type PrescriptionAndDiagnosticsProps = {
  formFields: any;
  formValues: any;
  editMode: boolean;
};

const PrescriptionAndDiagnostics: React.FC<PrescriptionAndDiagnosticsProps> = ({
  formFields,
  formValues,
  editMode,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const tab = formFields.find((tab: any) => tab.tabKey === "3");
  const filteredFields = tab?.fields || [];

  // Find the table field for the modal
  const tableField = filteredFields.find(
    (field: any) => field.type === "table",
  );

  return (
    <div>
      {/* ----------------------------------------------------
          🧾 PREVIOUS PRESCRIPTIONS MODAL
         ---------------------------------------------------- */}
      <Modal
        title="Previous Prescriptions"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={1000}
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          paddingRight: "12px",
        }}
        centered
      >
        {tableField &&
          FormGenerator({
            ...tableField,
            disabled: true,
            formValues,
          })}
      </Modal>

      {/* ----------------------------------------------------
         VIEW PREVIOUS PRESCRIPTIONS LINK
         ---------------------------------------------------- */}
      {formValues?.previousPrescriptions.length > 0 && (
        <Row>
          <Col span={24}>
            <div className="flex justify-center lg:justify-end mb-2">
              <Text
                strong
                className="cursor-pointer text-blue-500 hover:underline"
                onClick={() => setIsModalOpen(true)}
              >
                View previous prescriptions
              </Text>
            </div>
          </Col>
        </Row>
      )}

      {/* ----------------------------------------------------
         MAIN FORM FIELDS (DIAGNOSIS + PRESCRIPTION)
         ---------------------------------------------------- */}
      <Row gutter={16}>
        {filteredFields.map((field: any) => {
          // Skip table field - it's only shown in modal
          if (field.type === "table") {
            return null;
          }

          // Handle regular fields
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
    </div>
  );
};

export default PrescriptionAndDiagnostics;
