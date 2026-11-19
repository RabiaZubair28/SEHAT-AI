import React from "react";
import { Form, Input } from "antd";

interface MaskedInputProps {
  name?: string;
  label?: string;
  rules?: any[];
  placeholder?: string;
  disabled?: boolean;
  pattern?: string;
  required?: boolean;
  prefix?: string;
}

// const formatValue = (value: string): string => {
//   if (!value) return value;
//   return value.replace(/(\d)(?=\d)/g, "$1-");
// };

// Utility: format value according to pattern
const formatWithPattern = (value: string, pattern: string): string => {
  if (!value || !pattern) return value;

  const digits = value.replace(/\D/g, ""); // keep only numbers

  let result = "";
  let digitIndex = 0;

  for (let i = 0; i < pattern.length && digitIndex < digits.length; i++) {
    if (pattern[i] === "X" || (pattern[i] >= "0" && pattern[i] <= "9")) {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += pattern[i]; // add static character like '-' or '/'
    }
  }

  return result;
};

const MaskedInput: React.FC<MaskedInputProps> = ({
  name,
  label,
  rules,
  pattern,
  required,
  placeholder,
  disabled,
  prefix,
}) => {
  return (
    <Form.Item
      label={label}
      name={name}
      rules={[
        ...(required
          ? [{ required: true, message: `${label || name} is required` }]
          : []),
        ...(rules || []),
      ]}
      getValueFromEvent={(e) => {
        let raw = e?.target?.value || "";

        // 👇 Force prefix
        if (prefix) {
          if (!raw.startsWith(prefix)) {
            raw = prefix + raw.replace(/\D/g, "").slice(prefix.length);
          }
        }

        return pattern ? formatWithPattern(raw, pattern) : raw;
      }}
      initialValue={prefix} // 👈 auto-fill 03
    >
      <Input
        placeholder={placeholder}
        maxLength={pattern?.length || 100}
        disabled={disabled}
        inputMode="numeric"
      />
    </Form.Item>
  );
};

export default MaskedInput;
