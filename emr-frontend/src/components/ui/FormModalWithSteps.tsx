import React, { useState, useRef, useCallback, useMemo } from "react";
import { Modal, Form, Button, Steps, Spin, message } from "antd";
import { FormFieldConfig } from "@/data/types";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";
import { FormInstance } from "antd/es/form";

interface FormModalWithStepsProps {
  open: boolean;
  title: string;
  onCancel?: () => void;
  onFinish?: (values: any) => Promise<void> | void; // Make async
  basicInfoFields: FormFieldConfig[];
  personalDetailsFields: FormFieldConfig[];
  initialValues?: Record<string, any>;
  onValuesChange?: (
    changedValues: any,
    allValues: any,
    form: FormInstance,
  ) => void;
}

const FormModalWithSteps: React.FC<FormModalWithStepsProps> = ({
  open,
  title,
  onCancel,
  onFinish,
  basicInfoFields = [],
  personalDetailsFields = [],
  initialValues = {},
  onValuesChange,
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const stableStepRef = useRef(0);
  const isProcessingChange = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ Add loading state

  const steps = useMemo(
    () => [
      {
        title: "Basic Info",
        fields: basicInfoFields,
      },
      {
        title: "Personal Details",
        fields: personalDetailsFields,
      },
    ],
    [basicInfoFields, personalDetailsFields],
  );

  const isFieldsLoaded =
    basicInfoFields.length > 0 && personalDetailsFields.length > 0;

  React.useEffect(() => {
    if (open && isFieldsLoaded) {
      form.setFieldsValue(initialValues);
      const initialStep = 0;
      setCurrentStep(initialStep);
      stableStepRef.current = initialStep;
    } else if (!open) {
      form.resetFields();
      setCurrentStep(0);
      stableStepRef.current = 0;
      setIsSubmitting(false); // Reset loading state when modal closes
    }
  }, [open, isFieldsLoaded, form]);

  React.useEffect(() => {
    if (!isProcessingChange.current) {
      stableStepRef.current = currentStep;
    }
  }, [currentStep]);

  const next = async () => {
    try {
      const currentFields = steps[currentStep].fields.map((f) => f.name);
      await form.validateFields(currentFields);
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      stableStepRef.current = nextStep;
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const prev = () => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    stableStepRef.current = prevStep;
  };

  const handleFinish = async () => {
    try {
      // Validate all fields
      await form.validateFields();

      setIsSubmitting(true); // ✅ Show loading state

      const allValues = form.getFieldsValue(true);

      // Call onFinish and wait for it to complete
      if (onFinish) {
        await Promise.resolve(onFinish(allValues));

        // Only reset form if submission was successful
        // The parent component (UserManagementTable) should handle
        // closing the modal after successful submission
      }
    } catch (error) {
      console.error("Form submission failed:", error);

      // Don't reset form on error
      // Keep form data so user can fix errors
      message.error("Failed to submit form. Please check your inputs.");
    } finally {
      setIsSubmitting(false); // ✅ Always reset loading state
    }
  };

  const handleValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      if (onValuesChange) {
        isProcessingChange.current = true;
        onValuesChange(changedValues, allValues, form);
        setTimeout(() => {
          isProcessingChange.current = false;
        }, 150);
      }
    },
    [onValuesChange, form],
  );

  const displayStep = isProcessingChange.current
    ? stableStepRef.current
    : currentStep;

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => {
        if (!isSubmitting) {
          onCancel?.();
          setCurrentStep(0);
          stableStepRef.current = 0;
          isProcessingChange.current = false;
        }
      }}
      footer={null}
      width={900}
      closable={!isSubmitting} // Disable close button during submission
      maskClosable={!isSubmitting} // Disable click outside during submission
    >
      {!isFieldsLoaded ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" tip="Loading form fields..." />
        </div>
      ) : (
        <>
          <Steps current={displayStep} style={{ marginBottom: 24 }}>
            {steps.map((item) => (
              <Steps.Step key={item.title} title={item.title} />
            ))}
          </Steps>

          <Form
            layout="vertical"
            form={form}
            onValuesChange={handleValuesChange}
            preserve={true}
            disabled={isSubmitting} // ✅ Disable form during submission
          >
            {steps[displayStep].fields.map((field, index) => {
              if (
                Object.keys(initialValues).length > 0 &&
                field.inputType === "password"
              ) {
                return null;
              }

              return (
                <div key={field.name || index}>{FormGenerator(field)}</div>
              );
            })}
          </Form>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {displayStep > 0 && (
              <Button onClick={prev} disabled={isSubmitting}>
                Previous
              </Button>
            )}

            <div style={{ marginLeft: "auto" }}>
              {displayStep < steps.length - 1 && (
                <Button type="primary" onClick={next} disabled={isSubmitting}>
                  Next
                </Button>
              )}
              {displayStep === steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={handleFinish}
                  loading={isSubmitting} // ✅ Show loading spinner on button
                  disabled={isSubmitting}
                >
                  Submit
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default FormModalWithSteps;
