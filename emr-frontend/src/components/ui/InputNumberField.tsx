import React from "react";
import { InputNumber, Form } from "antd";
import type { InputNumberProps } from "antd";

interface InputNumberFieldProps
  extends Omit<InputNumberProps, "onChange" | "disabled" | "required"> {
  label?: string;
  required?: boolean | ((values: any) => boolean);
  notWrappedInForm?: boolean;
  placeholder?: string;
  disabled?: boolean | ((values: any) => boolean);
  onChange?: (value: number | null) => void;
  name?: string;
  rules?: any[];
  style?: any;
  step?: number;
  precision?: number;
   maxLength?: number;
}

const InputNumberField: React.FC<InputNumberFieldProps> = ({
  label,
  required = false,
  disabled,
  notWrappedInForm = false,
  onChange,
  placeholder,
  name,
  rules,
  maxLength,
}) => {
  const form = Form.useFormInstance();

  const handleChange: InputNumberProps["onChange"] = (value) => {
    if (typeof onChange === "function") {
      onChange(value === null ? null : Number(value));
    }
  };

  const formValues = form?.getFieldsValue() || {};
  const computedDisabled =
    typeof disabled === "function" ? disabled(formValues) : disabled;

  const computedRequired =
    typeof required === "function" ? required(formValues) : required;

  const input = (
    <InputNumber
      placeholder={placeholder}
      required={computedRequired}
      onChange={handleChange}
      disabled={computedDisabled}
      stringMode
      style={{ width: "100%" }}
      inputMode="numeric"
      maxLength={maxLength}
    />
  );

  if (notWrappedInForm) {
    return input;
  }

  return (
    <Form.Item
      label={label}
      name={name || label}
      required={computedRequired}
      getValueFromEvent={(value) => (value === null ? null : Number(value))}
      rules={[
        ...(computedRequired
          ? [{ required: true, message: `${label || name} is required` }]
          : []),
        ...(rules || []),
      ]}
    >
      {input}
    </Form.Item>
  );
};

export default InputNumberField;
