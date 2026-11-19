import React from "react";
import { Form, Input } from "antd";

interface TextAreaFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  onChange?: (value: string) => void;
  rules?: any[];
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  name,
  label,
  placeholder,
  required,
  disabled,
  rows = 4,
  maxLength,
  rules = [],
}) => {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={[
        ...(required
          ? [{ required: true, message: `${label || name} is required` }]
          : []),
        ...rules,
      ]}
    >
      <Input.TextArea
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder || `Enter ${label}`}
        // onChange={(e) => onChange?.(e.target.value)}
        showCount={!!maxLength}
      />
    </Form.Item>
  );
};

export default TextAreaField;
