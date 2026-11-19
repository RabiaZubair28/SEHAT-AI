import React, { useState } from "react";
import { Select, Form } from "antd";

const { Option } = Select;

interface OptionType {
  label: string;
  value: string;
  id?: number;
}

interface MultiSelectProps {
  options: OptionType[] | ((values: any) => OptionType[]);
  onChange?: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  value?: string[];
  name: string;
  disabled?: boolean | ((values: any) => boolean);
  notWrappedInForm?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  onChange,
  placeholder,
  label,
  required,
  name,
  value,
  disabled,
  notWrappedInForm,
}) => {
  const [values, setValue] = useState<string[]>(value || []);
  const form = Form.useFormInstance();

  // Resolve options - check if it's a function or array
  const resolvedOptions =
    typeof options === "function" ? options(values) : options;

  const handleChange = (selected: string[]) => {
    setValue(selected);
    onChange?.(selected);
  };

  const formValues = form?.getFieldsValue() || {};
  const computedDisabled =
    typeof disabled === "function" ? disabled(formValues) : disabled;

  const renderSelect = () => (
    <Select
      mode="multiple"
      value={values}
      onChange={handleChange}
      style={{ width: "100%" }}
      placeholder={placeholder}
      disabled={computedDisabled}
    >
      {resolvedOptions.map((option: OptionType) => (
        <Option key={option.value} value={option.value} label={option.label}>
          {option.label}
        </Option>
      ))}
    </Select>
  );

  // Wrap the MultiSelect component with Form.Item if `notWrappedInForm` is false
  if (notWrappedInForm) {
    return renderSelect();
  }

  return (
    <Form.Item
      label={label}
      name={name}
      rules={[{ required, message: `Please select one or multiple options` }]}
    >
      {renderSelect()}
    </Form.Item>
  );
};

export default MultiSelect;