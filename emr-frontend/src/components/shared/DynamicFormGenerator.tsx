import InputField from "@/components/ui/InputField";
import SingleSelectDropDown from "@/components/ui/SingleSelect";
import MultiSelect from "@/components/ui/MultiSelect";
import { FormFieldConfig } from "@/data/types";
import RadioButton from "../ui/RadioButton";
import CheckboxGroup from "../ui/CheckBox";
import DatePickerField from "../ui/DatePicker";
import { Form, Row, Col, Checkbox, Tag, Button } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { JSX } from "react";
import MaskedInput from "../ui/maskedInput";
import InputNumberField from "../ui/InputNumberField";
import TextAreaField from "../ui/TextArea";
import DecimalInputField from "../ui/Decimal";
import CompactField from "../ui/CompactField";
import { DynamicFormTable } from "./DynamicFormTable";
import { colorMap } from "@/features/patient-journey/utils/vaccineRulesEngine";

const computeDynamicValue = <T,>(
  value:
    | T
    | ((formValues?: any, index?: number, parentIndex?: number) => T)
    | undefined,
  formValues?: any,
  index?: number,
  parentIndex?: number,
): T | undefined => {
  if (typeof value === "function") {
    return (value as Function)(formValues, index, parentIndex);
  }
  return value as T | undefined;
};

export const FormGenerator = (field: FormFieldConfig): JSX.Element | null => {
  if (!field?.type) return null;

  const commonProps = {
    name: field.name || "",
    label: field.label,
    type: field.inputType,
    placeholder: field.placeholder,
    required: field.required,
    rules: field.rules,
  };

  switch (field.type) {
    case "input":
      return (
        <InputField
          {...commonProps}
          key={field.name}
          type={field.inputType}
          // disabled={field.disabled}
          disabled={computeDynamicValue(
            field.disabled,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          onChange={(value) => field.onChange?.(field.index, value)}
          rules={computeDynamicValue(
            field.rules,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          maxLength={field.maxLength}
          minLength={field.minLength}
          style={field.style}
        />
      );

    case "select":
      return (
        <SingleSelectDropDown
          {...commonProps}
          key={field.name}
          options={
            typeof field.options === "function"
              ? field?.options(
                  field?.formValues,
                  field.index,
                  field.parentIndex,
                )
              : field.options || []
          }
          showSearch={field.showSearch}
          disabled={field.disabled}
          onChange={field.onChange}
          isLoadingMore={field.isLoadingMore}
          fetchMore={field.fetchMore}
          filterOption={field.filterOption}
          onSearch={field.onSearch}
          searchLoading={field.searchLoading}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
        />
      );

    case "multiselect":
      return (
        <MultiSelect
          {...commonProps}
          key={field.name}
          options={field.options || []}
          disabled={field?.disabled}
          onChange={() => {}}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
        />
      );
    case "radio":
      return (
        <RadioButton
          {...commonProps}
          disabled={field?.disabled}
          key={field.name}
          options={field.options || []}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
        />
      );

    case "table":
      return (
        <Form.List name={field.name || ""} key={field.name}>
          {(fields, { add, remove }) => {
            // ✅ Add these parameters
            const dataCount =
              typeof field.dataCount === "function"
                ? field.dataCount(field.formValues)
                : field.dataCount || 0;

            const currentLength = fields.length;

            // ✅ Use add() instead of fields.push()
            if (currentLength < dataCount) {
              for (let i = currentLength; i < dataCount; i++) {
                add({});
              }
            }
            // ✅ Use remove() instead of fields.splice()
            else if (currentLength > dataCount) {
              for (let i = currentLength - 1; i >= dataCount; i--) {
                remove(i);
              }
            }

            if (fields.length === 0) return null;

            return (
              <DynamicFormTable
                editMode={!field.disabled}
                fields={fields}
                formValues={field.formValues || {}}
                titlePrefix={field.titlePrefix}
                tableTitle={field.tableTitle}
                showSummary={field.showSummary}
                getGroupFields={(index) => {
                  if (!field.getGroupFields) return [];
                  return field.getGroupFields(index, field.formValues);
                }}
                fieldName={field.name}
              />
            );
          }}
        </Form.List>
      );

    case "singleCheckbox":
      return (
        <Form.Item
          key={String(field.name)}
          name={field.name}
          valuePropName="checked"
          rules={computeDynamicValue(
            field.rules,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <Checkbox disabled={field.disabled}>{field.label}</Checkbox>
        </Form.Item>
      );

    case "checkbox":
      return (
        <CheckboxGroup
          key={String(field.name)}
          name={field.name}
          label={field.label}
          options={field.options || []}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          width={80}
          disabled={field.disabled}
        />
      );
    case "textarea":
      return (
        <TextAreaField
          {...commonProps}
          key={field.name}
          disabled={field?.disabled}
          rows={field?.rows}
          maxLength={field.maxLength}
          rules={computeDynamicValue(
            field.rules,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
        />
      );

    case "date":
      return (
        <DatePickerField
          {...commonProps}
          key={field.name}
          allowFutureDates={field?.allowFutureDates}
          disablePastDates={field?.disablePastDates}
          disabledDate={field?.disabledDate}
          disabled={field.disabled}
          rules={computeDynamicValue(
            field.rules,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
        />
      );

    case "compactfield":
      return (
        <CompactField
          key={field.name}
          name={field.name}
          label={field.label}
          disabled={field.disabled}
          subFields={field.subFields || []}
          rules={computeDynamicValue(
            field.rules,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
        />
      );
    case "number":
      return (
        <InputNumberField
          {...commonProps}
          key={field.name}
          disabled={field?.disabled}
          onChange={(value) => field.onChange?.(value)}
          rules={computeDynamicValue(
            field.rules,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          required={
            typeof field.required === "function"
              ? field.required
              : computeDynamicValue(
                  field.required,
                  field.formValues,
                  field.index,
                  field.parentIndex,
                )
          }
          style={field.style}
          maxLength={field.maxLength}
        />
      );

    case "label":
      return (
        <Row
          key={field.name || field.label}
          align="middle"
          justify={field?.justify}
          style={{
            marginBottom: field?.marginBottom || 12,
            marginTop: field.marginTop || 0,
            cursor: field.onClick && !field.disabled ? "pointer" : "default",
            pointerEvents: field.disabled ? "none" : "auto", // 🔒 Disable clicks
            opacity: field.disabled ? 0.6 : 1, // (optional) visual disabled state
          }}
          onClick={() => {
            if (field.onClick && !field.disabled) {
              // Call with index if it exists, otherwise call without parameters
              if (field.index !== undefined) {
                field.onClick(field.index);
              } else {
                field.onClick();
              }
            }
          }}
        >
          <Col
            span={field.colSpan || 24}
            style={{
              fontWeight: 600,
              display: field.flex === "flex" ? "flex" : undefined, // conditional flex
              alignItems: field.flex === "flex" ? "center" : undefined, //
              fontSize: field.fontSize || 16,
              color: field.color || "#000",
              padding: "4px 0",
              textAlign: field?.textAlign,
              borderBottom: field.underline ? "1px solid #d9d9d9" : "none",
            }}
          >
            {field.label}
          </Col>
        </Row>
      );

    case "maskedInput":
      return (
        <MaskedInput
          {...commonProps}
          key={field.name}
          pattern={field?.pattern}
          placeholder={field.placeholder}
          disabled={field?.disabled}
          prefix={field?.prefix}
          rules={computeDynamicValue(
            field.rules,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
        />
      );
    case "statusTag": {
      // field.name in Form.List is like: [rowIndex, "dosageStatus"]
      const key = Array.isArray(field.name) ? field.name[1] : field.name;
      const recordsSource = field.recordsSource || "immunization_records";

      const status =
        field.formValues?.[recordsSource]?.[field.index ?? 0]?.[key];

      const normalized = String(status || "").trim();

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 32,
          }}
        >
          <Tag color={colorMap[normalized] || "default"}>
            {normalized || "-"}
          </Tag>
        </div>
      );
    }
    case "statusTagNewborn": {
      const key = Array.isArray(field.name) ? field.name[1] : field.name;

      const newbornIndex = field.parentIndex ?? 0;
      const recordIndex = field.index ?? 0;

      const status =
        field.formValues?.newbornAssessments?.[newbornIndex]
          ?.immunization_records?.[recordIndex]?.[key];

      const normalized = String(status || "").trim();

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 32,
          }}
        >
          <Tag color={colorMap[normalized] || "default"}>
            {normalized || "-"}
          </Tag>
        </div>
      );
    }

    case "decimal":
      return (
        <DecimalInputField
          {...commonProps}
          key={field.name}
          disabled={field?.disabled}
          onChange={(value) => field.onChange?.(value)}
          step={field?.step}
          precision={field?.precision}
          rules={computeDynamicValue(
            field.rules,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
          required={computeDynamicValue(
            field.required,
            field.formValues,
            field.index,
            field.parentIndex,
          )}
        />
      );

    case "button":
      return (
        <Button
          key={field.name + "_button" + field.index}
          type={field.buttonType || "default"}
          danger={field.danger || false}
          disabled={field.disabled}
          onClick={() => {
            if (field.onClick) {
              const itemId = field.itemId; // optional, pass itemId if needed
              field.onClick(field.index, itemId);
            }
          }}
          style={{
            ...field.style, // merge any other styles
            marginTop: field.marginTop ?? 0, // use your field's marginTop
          }}
          size={field.size || "middle"}
        >
          {field.label}
        </Button>
      );

    case "formList":
      return (
        <Form.List
          initialValue={field?.initialValue || [{}]}
          name={field?.name || ""}
          key={String(field.name)}
        >
          {(fields, { add, remove }) => {
            // `field.newRow` lets a form decide what a freshly created row looks
            // like. Without it this is `add(undefined)`, the previous behaviour.
            if (fields.length === 0) {
              if (field.newRow) add(field.newRow());
              else add();
            }

            return (
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  padding: 16,
                  marginBottom: 24,
                  overflowX: "auto", // ✅ one scrollbar
                }}
              >
                {fields.map(({ key, name }, index) => (
                  <Row
                    key={key}
                    gutter={16}
                    align="middle"
                    wrap={false}
                    style={{
                      marginBottom: 12,
                      width: "max-content",
                    }}
                  >
                    {/* 🔹 Dynamic fields */}
                    {field?.fields
                      ?.filter((childField: any) => {
                        if (!childField.visibleIf) return true;
                        if (typeof childField.visibleIf !== "function")
                          return true;
                        return childField.visibleIf(field?.formValues, index);
                      })
                      .map((childField: any) => {
                        const computedDisabled =
                          typeof childField.disabled === "function"
                            ? childField.disabled(
                                field?.formValues,
                                index,
                                field.index,
                              )
                            : childField.disabled;
                        const composedField: FormFieldConfig = {
                          ...childField,
                          name: [name, childField.name],
                          formValues: field?.formValues,
                          // disabled: field.disabled || childField.disabled,
                          disabled: field.disabled || computedDisabled,
                          index,
                          parentIndex: field.index,
                        };

                        return (
                          <Col
                            key={`${key}-${childField.name}`}
                            flex={`0 0 ${childField.colSpan * 48}px`}
                          >
                            {FormGenerator(composedField)}
                          </Col>
                        );
                      })}

                    {/* 🔹 Add / Remove buttons */}
                    {(field.allowRemove !== false ||
                      field.allowAdd !== false) &&
                      !field.disabled && (
                        <Col flex="0 0 160px">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {/* Remove */}
                            {field.allowRemove !== false && !field.disabled && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  color: "red",
                                  gap: 6,
                                }}
                                onClick={() => {
                                  if (
                                    field.minItems &&
                                    fields.length <= field.minItems
                                  )
                                    return;
                                  remove(name);
                                }}
                              >
                                <MinusCircleOutlined
                                  style={{
                                    fontSize: 14,
                                    borderRadius: "50%",
                                    padding: 4,
                                  }}
                                />
                                <span style={{ fontSize: 14, fontWeight: 500 }}>
                                  Remove
                                </span>
                              </div>
                            )}

                            {/* Add */}
                            {field.allowAdd !== false && !field.disabled && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  color: "green",
                                  gap: 6,
                                }}
                                onClick={() => {
                                  if (field.newRow) {
                                    return add(field.newRow())
                                  }

                                  return add()
                                }}
                              >
                                <PlusOutlined
                                  style={{
                                    fontSize: 9,
                                    border: "1px solid green",
                                    borderRadius: "50%",
                                    padding: 2,
                                  }}
                                />
                                <span style={{ fontSize: 14, fontWeight: 500 }}>
                                  {field.addButtonText || "Add"}
                                </span>
                              </div>
                            )}
                          </div>
                        </Col>
                      )}
                  </Row>
                ))}
              </div>
            );
          }}
        </Form.List>
      );

    case "formList_unscrollable":
      return (
        <Form.List
          initialValue={field?.initialValue || [{}]}
          name={field?.name || ""}
          key={String(field.name)}
        >
          {(fields, { add, remove }) => {
            // if (fields.length === 0) add();
            return (
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                {fields.map(({ key, name }, index) => (
                  <div key={key}>
                    {/* ✅ ADD TITLE HERE */}
                    {field.showItemTitle && (
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          marginBottom: 16,
                          paddingBottom: 8,
                          borderBottom: "2px solid #064526",
                          color: "#064526",
                        }}
                      >
                        {field.itemTitlePrefix} {index + 1}
                      </div>
                    )}

                    <Row
                      gutter={16}
                      align="middle"
                      style={{ marginBottom: 12 }}
                    >
                      {field?.fields
                        ?.filter((childField: any) => {
                          if (!childField.visibleIf) return true;
                          if (typeof childField.visibleIf !== "function")
                            return true;
                          return childField.visibleIf(field?.formValues, index);
                        })
                        .map((childField: any) => {
                          const composedField: FormFieldConfig = {
                            ...childField,
                            name: [name, childField.name],
                            formValues: field?.formValues,
                            disabled: field.disabled || childField.disabled,
                            index,
                            parentIndex: field.index,
                          };

                          return (
                            <Col
                              key={`${key}-${childField.name}`}
                              xs={24}
                              sm={24}
                              md={childField.colSpan}
                              lg={childField.colSpan}
                            >
                              {FormGenerator(composedField)}
                            </Col>
                          );
                        })}

                      {/* Add / Remove controls */}
                      <Col
                        md={4}
                        lg={4}
                        sm={24}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        {/* Remove button */}
                        {field.allowRemove !== false && !field.disabled && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                              color: "red",
                              gap: 6,
                            }}
                            onClick={() => {
                              if (
                                field.minItems &&
                                fields.length <= field.minItems
                              )
                                return;
                              remove(name);
                            }}
                          >
                            <MinusCircleOutlined
                              style={{
                                fontSize: 14,
                                borderRadius: "50%",
                                padding: 4,
                              }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 500 }}>
                              Remove
                            </span>
                          </div>
                        )}

                        {/* Add button */}
                        {field.allowAdd !== false && !field.disabled && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                              color: "green",
                              gap: 6,
                            }}
                            onClick={() => add()}
                          >
                            <PlusOutlined
                              style={{
                                fontSize: 9,
                                border: "1px solid green",
                                borderRadius: "50%",
                                padding: 2,
                              }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 500 }}>
                              {field.addButtonText || "Add"}
                            </span>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            );
          }}
        </Form.List>
      );

    default:
      return null;
  }
};
