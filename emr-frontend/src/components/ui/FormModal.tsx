import React from "react";
import { Modal, Form } from "antd";
import { FormFieldConfig } from "@/data/types";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

interface FormModalProps {
  open: boolean;
  title: string;
  onCancel?: () => void;
  onFinish?: (values: any) => void;
  fields: FormFieldConfig[] | any;
  initialValues?: Record<string, any>;
}

const FormModal: React.FC<FormModalProps> = ({
  open,
  title,
  onCancel,
  onFinish,
  fields,
  initialValues = {},
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={() => {
        form.validateFields().then((values: any) => {
          onFinish?.(values);
          form.resetFields();
        });
      }}
      okText="Submit"
    >
      <Form layout="vertical" form={form}>
        {fields.map((field: any) => {
          if (
            Object.keys(initialValues).length > 0 &&
            field.inputType === "password"
          ) {
            return null;
          }

          return FormGenerator(field);
        })}
      </Form>
    </Modal>
  );
};

export default FormModal;
