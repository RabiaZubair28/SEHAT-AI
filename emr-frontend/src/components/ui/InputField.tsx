import React from "react";
import { Form, Input } from "antd";
import { TextFieldType } from "@/data/types";
import { ReactNode } from "react";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

interface TextFieldProps {
  name: string;
  label?: string;
  type?:
    | TextFieldType.Text
    | TextFieldType.Password
    | TextFieldType.Email
    | TextFieldType.Number;
  required?: boolean;
  placeholder?: string;
  notWrappedInForm?: boolean;
  disabled?: boolean;
  prefix?: ReactNode;
  dependencies?: string[];
  onChange?: (value: any) => void;
  rules?: any[];
  maxLength?: number;
  minLength?: number;
  disallowNumbers?: boolean;
  style?: React.CSSProperties;
}

const InputField: React.FC<TextFieldProps> = ({
  name,
  label,
  required,
  placeholder,
  type,
  disabled,
  prefix,
  onChange,
  dependencies,
  rules = [],
  maxLength,
  minLength,
  disallowNumbers,
  style,
}) => {
  const [passwordVisible, setPasswordVisible] = React.useState(false);

  // Handle key press for number input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (type === TextFieldType.Number) {
      // Allow control keys
      if (
        ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(
          e.key
        )
      ) {
        return;
      }

      // Block non-numeric keys
      if (e.key < "0" || e.key > "9") {
        e.preventDefault();
      }

      // Only enforce maxLength if it was provided
      if (typeof maxLength === "number") {
        const target = e.currentTarget;
        const value = target.value;
        if (
          value.length >= maxLength &&
          target.selectionStart === target.selectionEnd &&
          e.key !== "Backspace" &&
          e.key !== "Delete"
        ) {
          e.preventDefault();
        }
      }
    }
    if (disallowNumbers && /\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Handle paste for number input
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (type === TextFieldType.Number && typeof maxLength === "number") {
      e.preventDefault();
      const paste = e.clipboardData.getData("text");
      const numbersOnly = paste.replace(/\D/g, "");

      const target = e.currentTarget;
      const currentValue = target.value;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;

      const newValue =
        currentValue.substring(0, start) +
        numbersOnly +
        currentValue.substring(end);

      // Apply max length only if provided
      const finalValue = newValue.substring(0, maxLength);
      target.value = finalValue;

      const event = new Event("input", { bubbles: true });
      target.dispatchEvent(event);
    }
  };

  const validationRules = [
    ...(required
      ? [{ required: true, message: `This field is required` }]
      : []),
    ...(typeof minLength === "number"
      ? [
          {
            min: minLength,
            message: `Field must be at least ${minLength} characters`,
          },
        ]
      : []),
    ...(typeof maxLength === "number"
      ? [
          {
            max: maxLength,
            message: `Field cannot exceed ${maxLength} characters`,
          },
        ]
      : []),
    ...rules,
  ];

  return (
    <Form.Item
      name={name}
      label={label}
      style={style}
      dependencies={dependencies}
      validateTrigger={["onChange", "onBlur"]}
      rules={validationRules}
    >
      {type === TextFieldType.Password ? (
        <Input.Password
          placeholder={placeholder || `Enter ${label}`}
          minLength={minLength}
          maxLength={maxLength}
          prefix={prefix}
          disabled={disabled}
          visibilityToggle={{
            visible: passwordVisible,
            onVisibleChange: setPasswordVisible,
          }}
          iconRender={(visible) =>
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      ) : (
        <Input
          inputMode={type === TextFieldType.Number ? "numeric" : undefined}
          type={type}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder || `Enter ${label}`}
          prefix={prefix}
          maxLength={maxLength}
          minLength={minLength}
          onKeyDown={handleKeyPress}
          onPaste={
            type === TextFieldType.Number && typeof maxLength === "number"
              ? handlePaste
              : undefined
          }
          style={style}
        />
      )}
    </Form.Item>
  );
};

export default InputField;
