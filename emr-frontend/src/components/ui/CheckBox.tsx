import React from "react";
import { Checkbox, Form } from "antd";

interface Option {
  label: string;
  value: string | number | boolean;
}

interface CheckboxProps {
  name: any;
  options: Option[] | ((values: any) => Option[]);
  label?: string;
  required?: boolean;
  disabled?: boolean;
  notWrappedInForm?: boolean;
  width?: number | string; // ✅ NEW
}

const CheckboxGroup: React.FC<CheckboxProps> = ({
  name,
  options,
  label,
  required,
  disabled,
  notWrappedInForm,
  width = "auto",
}) => {
  const resolvedOptions = typeof options === "function" ? options({}) : options;

  const checkboxGroup = (
    <Checkbox.Group
      options={resolvedOptions}
      disabled={disabled}
      style={{ width }} // ✅ WIDTH CONTROLLED HERE
    />
  );

  if (notWrappedInForm) {
    return checkboxGroup;
  }

  return (
    <Form.Item
      name={name}
      label={label}
      style={{ width }} // ✅ ALSO APPLY TO FORM ITEM
      rules={
        required ? [{ required: true, message: `Please select ${label}` }] : []
      }
    >
      {checkboxGroup}
    </Form.Item>
  );
};

export default CheckboxGroup;
