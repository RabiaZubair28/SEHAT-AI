import { Table } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";

export const DynamicFormTable = ({
  editMode = false,
  fields = [], // Form.List fields
  getGroupFields,
  titlePrefix = "Record",
  tableTitle = "Enter records",
  formValues = {},
  showSummary = true,
}: {
  editMode?: boolean;
  fields: any[];
  getGroupFields: (index: number) => any[];
  titlePrefix?: string;
  tableTitle?: string;
  formValues?: Record<string, any>;
  showSummary?: boolean;
  fieldName?: string;
}) => {
  const columns = [
    ...(showSummary
      ? [
          {
            title: "Summary",
            dataIndex: "summary",
            key: "summary",
            width: 150,
            fixed: "left" as const,
          },
        ]
      : []),
    {
      title: tableTitle,
      dataIndex: "content",
      key: "content",
    },
  ];

  const dataSource = fields.map((field, index) => {
    const { key, name } = field;
    const groupFields = getGroupFields(index);

    // Filter fields based on visibleIf
    const visibleFields = groupFields.filter((childField: any) => {
      if (!childField.visibleIf || typeof childField.visibleIf !== "function")
        return true;
      return childField.visibleIf(formValues, index);
    });

    return {
      key,
      summary: (
        <div style={{ fontWeight: 600, color: "#064526" }}>
          {titlePrefix} #{index + 1}
        </div>
      ),
      content: (
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "flex",
              minWidth: visibleFields.length * 220,
              gap: 16,
            }}
          >
            {visibleFields.map((childField: any) => {
              // ✅ Compose the field name for Form.List: [name, 'fieldName']
              const composedField = {
                ...childField,
                name: [name, childField.name],
                disabled: !editMode || childField.disabled,
                formValues,
                index,
              };

              return (
                <div key={childField.name} style={{ flex: "0 0 200px" }}>
                  {FormGenerator(composedField)}
                </div>
              );
            })}
          </div>
        </div>
      ),
    };
  });

  return (
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        scroll={{ x: "max-content" }}
        size="middle"
      />
    </div>
  );
};
