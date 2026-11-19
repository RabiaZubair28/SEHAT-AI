import React from "react";
import { Form, InputNumber, Space } from "antd";
import { Rule } from "antd/es/form";

interface SubField {
  name: string;
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  width?: string | number;
  disabled?: boolean;
}

interface CompactFieldProps {
  label?: string;
  name: string | string[] | undefined;
  required?: boolean;
  disabled?: boolean;
  subFields: SubField[];
  rules?: Rule[];
}

const CompactField: React.FC<CompactFieldProps> = ({
  label,
  name,
  required = false,
  disabled = false,
  subFields,
  rules = [],
}) => {
  return (
    <Form.Item label={label} required={required} style={{ marginBottom: 0 }}>
      <Space.Compact style={{ width: "100%" }}>
        {subFields.map((subField, index) => (
          <Form.Item
            key={`${String(name)}-${subField.name}-${index}`}
            name={
              Array.isArray(name)
                ? ([...name, subField.name] as any)
                : ([name, subField.name] as any)
            }
            noStyle
          >
            <InputNumber
              inputMode="numeric"
              min={subField.min}
              max={subField.max}
              placeholder={subField.placeholder || subField.label}
              disabled={disabled || subField.disabled}
              style={{
                margin: 0,
                width: subField.width || `${100 / subFields.length}%`,
              }}
            />
          </Form.Item>
        ))}
      </Space.Compact>
      <Form.Item
        name={name}
        dependencies={subFields.map((sf) =>
          Array.isArray(name) ? [...name, sf.name] : [name, sf.name]
        )}
        rules={rules}
        noStyle
      >
        {(form) => (
          <Form.ErrorList errors={name ? form.getFieldError(name) : []} />
        )}
      </Form.Item>
    </Form.Item>
  );
};

export default CompactField;
