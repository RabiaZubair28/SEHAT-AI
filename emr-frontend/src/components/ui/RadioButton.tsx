import React from "react";
import { Radio, Form } from "antd";

interface RadioOption {
  label: string;
  value: any;
}

interface RadioButtonProps {
  // options: string[];
  options: RadioOption[] | string[] | ((values: any) => RadioOption[]);
  onChange?: (selected: any) => void;
  placeholder?: string;
  value?: any;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  notWrappedInForm?: boolean;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  options,
  onChange,
  label,
  name,
  required,
  disabled,
  value,
  notWrappedInForm,
}) => {
  const normalizedOptions = Array.isArray(options)
    ? options.map((opt) =>
        typeof opt === "string" ? { label: opt, value: opt } : opt
      )
    : [];

  const renderRadioGroup = () => (
    <Radio.Group
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      value={value}
    >
      {normalizedOptions.map((option) => (
        <Radio key={String(option.value)} value={option.value}>
          {option.label}
        </Radio>
      ))}
      {/* {options.map((option) => (
        <Radio key={option} value={option}>
          {option}
        </Radio>
      ))} */}
    </Radio.Group>
  );

  // Wrap the RadioGroup component with Form.Item if `notWrappedInForm` is false
  if (notWrappedInForm) {
    return renderRadioGroup();
  }

  return (
    <Form.Item
      label={label}
      name={name}
      rules={[
        {
          required,
          message: `Please select an option`,
        },
      ]}
    >
      {renderRadioGroup()}
    </Form.Item>
  );
};

export default RadioButton;
