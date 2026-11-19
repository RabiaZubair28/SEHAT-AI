import React from "react";
import { InputNumber, Form } from "antd";
import type { InputNumberProps } from "antd";

interface DecimalInputFieldProps extends Omit<InputNumberProps, "onChange"> {
  label?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  notWrappedInForm?: boolean;
  onChange?: (value: number | null) => void;
  rules?: any[];
  step?: number; // Decimal step, e.g., 0.01
  precision?: number; // Decimal precision, e.g., 2
}

const DecimalInputField: React.FC<DecimalInputFieldProps> = ({
  label,
  name,
  required = false,
  placeholder,
  disabled = false,
  notWrappedInForm = false,
  onChange,
  rules,
  step = 0.01,
  precision = 2,
}) => {
  const handleChange: InputNumberProps["onChange"] = (value) => {
    if (onChange) {
      onChange(value === null ? null : Number(value));
    }
  };

  const input = (
    <InputNumber
      placeholder={placeholder}
      disabled={disabled}
      onChange={handleChange}
      step={step}
      precision={precision}
      stringMode
      style={{ width: "100%" }}
    />
  );

  if (notWrappedInForm) return input;

  return (
    <Form.Item
      label={label}
      name={name || label}
      required={required}
      rules={[
        ...(required
          ? [{ required: true, message: `${label || name} is required` }]
          : []),
        ...(rules || []),
      ]}
    >
      {input}
    </Form.Item>
  );
};

export default DecimalInputField;
