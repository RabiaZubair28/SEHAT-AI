import React from "react";
import { DatePicker, Form } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface DatePickerFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  notWrappedInForm?: boolean;
  onChange?: () => void;
  disabled?: boolean | ((values: any) => boolean);
  rules?: any[];
  disabledDate?: (date: Dayjs) => boolean;
  allowFutureDates?: boolean; // 👈 NEW PROP
  disablePastDates?: boolean; // 👈 NEW PROP
  placement?: "bottomLeft" | "bottomRight" | "topLeft" | "topRight";
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  name,
  label,
  required,
  disabled,
  placeholder,
  rules,
  disablePastDates = false,
  allowFutureDates = false,
  onChange,
  disabledDate,
}) => {
  const form = Form.useFormInstance();

  // Only allow future dates (disable all past dates)
  const defaultDisabledDate = (current: Dayjs) => {
    if (!current) return false;

    // 1️⃣ Disable past dates (highest priority)
    if (disablePastDates) {
      return current.isBefore(dayjs(), "day");
    }

    // 2️⃣ Disable future dates (only if future NOT allowed)
    if (!allowFutureDates) {
      return current.isAfter(dayjs(), "day");
    }

    return false;
  };



  const formValues = form?.getFieldsValue() || {};
  const computedDisabled =
    typeof disabled === "function" ? disabled(formValues) : disabled;

  return (
    <Form.Item
      name={name}
      label={label}
      getValueProps={(value) => ({
        value: value ? dayjs(value) : null,
      })}
      normalize={(value) => {
        if (!value) return null;
        // If it's already a string, return as-is
        if (typeof value === "string") return value;
        // Convert Dayjs to ISO string format
        return dayjs.isDayjs(value) ? value.format("YYYY-MM-DD") : value;
      }}
      rules={[
        ...(required
          ? [{ required: true, message: `This field is required` }]
          : []),
        ...(rules || []),
      ]}
    >
      <DatePicker
        disabled={computedDisabled}
        onChange={onChange}
        placeholder={placeholder || `Select ${label}`}
        style={{ width: "100%" }}
        format="DD-MM-YYYY"
        disabledDate={disabledDate || defaultDisabledDate}
      />
    </Form.Item>
  );
};

export default DatePickerField;