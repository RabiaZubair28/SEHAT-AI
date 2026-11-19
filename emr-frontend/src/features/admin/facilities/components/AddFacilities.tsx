import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Flex,
  Form,
  Input,
  Popconfirm,
  Space,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { FormInstance, Rule } from "antd/es/form";
import type { NamePath } from "antd/es/form/interface";
import { useNavigate } from "react-router-dom";
import {
  type BulkFacilityRow,
  type BulkRowError,
  useBulkCreateFacilitiesMutation,
} from "@/features/admin/services/facilitiesApi";
import { useGlobalNotification } from "@/hooks/useNotification";
import { usePermissionCheck } from "@/hooks/usePermission";
import { ROUTE_KEYS } from "@/data/routeKey";
import { ROUTES } from "@/data/routes";

const FACILITY_FIELDS = [
  "division",
  "facility_code",
  "district",
  "taluka",
  "union_council",
  "facility_name",
  "facility_type",
  "managed_by",
  "is_24_7",
  "bmu",
  "otp",
  "nsc",
  "lat",
  "long",
  "level_of_care",
] as const;

type FacilityField = (typeof FACILITY_FIELDS)[number];

type RowValues = Record<FacilityField, string>;

type FacilityRow = { key: string };

type FormValues = { rows: Record<string, RowValues> };

const rowFieldPath = (key: string, field: string): NamePath<FormValues> =>
  ["rows", key, field] as NamePath<FormValues>;

const EMPTY_VALUES: RowValues = Object.fromEntries(
  FACILITY_FIELDS.map((field) => [field, ""]),
) as RowValues;

const createKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type FacilityColumn = {
  title: string;
  dataIndex: FacilityField;
  fixed?: "left";
  width?: number;
  inputMode?: "numeric" | "decimal";
  rules?: Rule[];
};

// The required-mark transform turns titles into JSX for the table headers.
type TableColumn = Omit<FacilityColumn, "title"> & { title: React.ReactNode };

type FormValidationError = {
  errorFields?: { name: (string | number)[]; errors: string[] }[];
};

type PostError = { data?: { errors?: BulkRowError[]; message?: string } };

const numericRangeRule = (min: number, max: number, message: string): Rule => ({
  validator: (_rule, value) => {
    const text = String(value ?? "").trim();
    if (!text) return Promise.resolve();
    const parsed = Number(text);
    if (Number.isNaN(parsed) || parsed < min || parsed > max) {
      return Promise.reject(new Error(message));
    }
    return Promise.resolve();
  },
});

const positiveNumberRule: Rule = {
  validator: (_rule, value) => {
    const text = String(value ?? "").trim();
    if (!text) return Promise.resolve();
    const parsed = Number(text);
    if (Number.isNaN(parsed) || parsed < 0) {
      return Promise.reject(new Error("must be a positive number"));
    }
    return Promise.resolve();
  },
};

const columnConfig: FacilityColumn[] = [
  {
    title: "Division",
    dataIndex: "division",
    fixed: "left",
  },
  {
    title: "Facility Code",
    dataIndex: "facility_code",
    fixed: "left",
    inputMode: "numeric",
    rules: [positiveNumberRule],
  },
  {
    title: "District",
    dataIndex: "district",
    rules: [{ required: true, whitespace: true, message: "is required" }],
  },
  {
    title: "Taluka",
    dataIndex: "taluka",
  },
  {
    title: "Union Council",
    dataIndex: "union_council",
  },
  {
    title: "Facility Name",
    dataIndex: "facility_name",
    rules: [{ required: true, whitespace: true, message: "is required" }],
  },
  {
    title: "Facility Type",
    dataIndex: "facility_type",
  },
  {
    title: "Managed By",
    dataIndex: "managed_by",
  },
  {
    title: "24/7",
    dataIndex: "is_24_7",
  },
  {
    title: "BMU",
    dataIndex: "bmu",
  },
  {
    title: "OTP",
    dataIndex: "otp",
  },
  {
    title: "NSC",
    dataIndex: "nsc",
  },
  {
    title: "Lat",
    dataIndex: "lat",
    inputMode: "decimal",
    rules: [numericRangeRule(-90, 90, "must be a number between -90 and 90")],
  },
  {
    title: "Long",
    dataIndex: "long",
    inputMode: "decimal",
    rules: [
      numericRangeRule(-180, 180, "must be a number between -180 and 180"),
    ],
  },
  {
    title: "Level of Care",
    dataIndex: "level_of_care",
  },
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  columnConfig.map((column) => [column.dataIndex, column.title]),
);

const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field;

const columns: TableColumn[] = columnConfig.map((column) => ({
  ...column,
  title: (column.rules ?? []).some(
    (rule) => typeof rule === "object" && rule.required === true,
  ) ? (
    <>
      <span className="text-red-500 mr-1">*</span>
      {column.title}
    </>
  ) : (
    column.title
  ),
}));

const isEmptyValues = (values: RowValues): boolean =>
  FACILITY_FIELDS.every((field) => !String(values[field] ?? "").trim());

const toPayloadRow = (values: RowValues): BulkFacilityRow => ({
  ...EMPTY_VALUES,
  ...values,
});

const clearAllErrors = (form: FormInstance<FormValues>) => {
  form.setFields(
    form.getFieldsError().map(({ name }) => ({
      name: name as NamePath<FormValues>,
      errors: [],
    })),
  );
};

const emptySubmissionAlertError: BulkRowError[] = [
  {
    row: 0,
    field: "",
    message:
      "Nothing to submit. Add at least one facility row before submitting.",
  },
];

const getUnknownPostError = (body: PostError["data"]): BulkRowError[] => {
  return [
    {
      row: 0,
      field: "",
      message: body?.message || "Bulk create failed. Please try again.",
    },
  ];
};

const AddFacilities: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [rowKeys, setRowKeys] = useState<string[]>(() => [createKey()]);
  const [errorRowKeys, setErrorRowKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [alertErrors, setAlertErrors] = useState<BulkRowError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const showNotification = useGlobalNotification();
  const canSubmit = usePermissionCheck(ROUTE_KEYS.BULK_CREATE_FACILITIES);
  const [bulkCreateFacilities] = useBulkCreateFacilitiesMutation();

  const dismissErrors = useCallback(() => {
    clearAllErrors(form); // form
    setAlertErrors([]); // alert
    setErrorRowKeys(new Set()); // row level tinting
  }, []);

  const handlePaste = useCallback(
    (
      event: React.ClipboardEvent<HTMLInputElement>,
      startKey: string,
      startColumn: number,
    ) => {
      event.preventDefault();

      const text = event.clipboardData.getData("text");
      if (!text) return;

      const grid = text
        .trim()
        .split(/\r?\n/)
        .map((row) =>
          row.split("\t").map((cell) => (cell === "-" ? "" : cell)),
        );

      const currentKeys = rowKeys;
      const startRow = currentKeys.indexOf(startKey);
      if (startRow === -1) return;

      const nextKeys = [...currentKeys];
      const nextValues: Record<string, RowValues> = {
        ...(form.getFieldsValue().rows ?? {}),
      };
      const touchedKeys: string[] = [];

      // Example values
      // cells: ['Karachi', '1', ....]
      // rowOffset: 0
      grid.forEach((cells, rowOffset) => {
        const targetIndex = startRow + rowOffset;

        if (!nextKeys[targetIndex]) nextKeys[targetIndex] = createKey();
        const key = nextKeys[targetIndex];
        if (!nextValues[key]) nextValues[key] = { ...EMPTY_VALUES };

        // Example values
        // value: Karachi
        // columnOffset: 0
        cells.forEach((value, columnOffset) => {
          const column = columns[startColumn + columnOffset];
          if (!column) return;
          nextValues[key] = {
            ...nextValues[key],
            [column.dataIndex]: value.trim(),
          };
        });

        if (!touchedKeys.includes(key)) touchedKeys.push(key);
      });

      form.setFieldsValue({ rows: nextValues });
      dismissErrors();
      setRowKeys(nextKeys);
    },
    [form, rowKeys, dismissErrors],
  );

  const clearTable = useCallback(() => {
    dismissErrors();
    const fresh = createKey();
    form.setFieldsValue({ rows: { [fresh]: { ...EMPTY_VALUES } } });
    setRowKeys([fresh]);
  }, [form, dismissErrors]);

  const deleteRow = useCallback(
    (key: string) => {
      if (rowKeys.length === 1) {
        clearTable();
        return;
      }

      setAlertErrors([]);
      setRowKeys((current) => current.filter((rowKey) => rowKey !== key));
    },
    [rowKeys, clearTable],
  );

  const addRow = useCallback(() => {
    const fresh = createKey();
    form.setFieldsValue({ rows: { [fresh]: { ...EMPTY_VALUES } } });
    setRowKeys((current) => [...current, fresh]);
  }, [form]);

  const validateRows = useCallback(async (): Promise<boolean> => {
    clearAllErrors(form);
    setErrorRowKeys(new Set());

    try {
      await form.validateFields();
      return true;
    } catch (error) {
      const errorFields = (error as FormValidationError).errorFields ?? [];

      const clientErrors: BulkRowError[] = [];
      const failedKeys = new Set<string>();

      errorFields.forEach(({ name, errors }) => {
        const key = String(name[1]);
        const row = rowKeys.indexOf(key) + 1;
        const field = name[2];

        if (row > 0 && typeof field === "string" && errors.length > 0) {
          clientErrors.push({ row, field, message: errors[0] });
          failedKeys.add(key);
        }
      });

      setAlertErrors(clientErrors);
      setErrorRowKeys(failedKeys);

      return false;
    }
  }, [form, rowKeys]);

  const submitBatch = useCallback(
    async (storedRows: Record<string, RowValues>) => {
      setSubmitting(true);
      try {
        const response = await bulkCreateFacilities({
          facilities: rowKeys.map((key) => toPayloadRow(storedRows[key])),
        }).unwrap();

        showNotification(
          "success",
          "Facilities added",
          `${response.data?.created ?? rowKeys.length} facilities created successfully.`,
        );

        navigate(ROUTES.ADMIN_FACILITIES);
      } catch (error) {
        const body = (error as PostError).data;

        let serverErrors: BulkRowError[];
        if (Array.isArray(body?.errors) && body.errors.length > 0)
          serverErrors = body.errors;
        else serverErrors = getUnknownPostError(body);

        setAlertErrors(serverErrors);

        // failedKeys is used to highlight erroredRows
        // erroredFields is used to populate individual form item errors
        const failedKeys = new Set<string>();
        const erroredFields: {
          name: NamePath<FormValues>;
          errors: string[];
        }[] = serverErrors.flatMap((serverError) => {
          if (serverError.row < 0 || !serverError.field) return [];

          const key = rowKeys[serverError.row - 1];
          failedKeys.add(key);

          return [
            {
              name: rowFieldPath(key, serverError.field),
              errors: [serverError.message],
            },
          ];
        });

        if (erroredFields.length > 0) form.setFields(erroredFields);
        setErrorRowKeys(failedKeys);

        showNotification(
          "error",
          "Bulk add failed",
          `The batch was rejected — ${serverErrors.length} problem${serverErrors.length === 1 ? "" : "s"} found.`,
        );
      } finally {
        setSubmitting(false);
      }
    },
    [bulkCreateFacilities, form, navigate, rowKeys, showNotification],
  );

  const onSubmit = useCallback(async () => {
    if (submitting) return;

    const storedRows = form.getFieldsValue().rows ?? {};

    if (
      rowKeys.every((key) => isEmptyValues(storedRows[key] ?? EMPTY_VALUES))
    ) {
      setAlertErrors(emptySubmissionAlertError);
      return;
    }

    if (!(await validateRows())) return;

    await submitBatch(storedRows);
  }, [submitting, rowKeys, form, validateRows, submitBatch]);

  const dataSource = useMemo(() => rowKeys.map((key) => ({ key })), [rowKeys]);

  const tableColumns = useMemo<ColumnsType<FacilityRow>>(() => {
    return [
      ...columns.map((column, columnIndex) => ({
        ...column,
        render: (_: unknown, record: FacilityRow) => {
          return (
            <Form.Item
              name={["rows", record.key, column.dataIndex]}
              rules={column.rules}
            >
              <Input
                inputMode={column.inputMode}
                onPaste={(event) => handlePaste(event, record.key, columnIndex)}
              />
            </Form.Item>
          );
        },
      })),
      {
        title: "Action",
        key: "action",
        render: (_: unknown, record: FacilityRow) => (
          <Button
            className="!mb-4"
            danger
            size="small"
            type="link"
            onClick={() => deleteRow(record.key)}
          >
            Delete
          </Button>
        ),
      },
    ];
  }, [handlePaste, deleteRow]);

  return (
    <Form<FormValues>
      form={form}
      validateTrigger={false}
      initialValues={{ rows: { [rowKeys[0]]: { ...EMPTY_VALUES } } }}
      disabled={submitting}
    >
      <Space direction="vertical" size="middle" className="w-full mt-4">
        <AlertErrors
          alertErrors={alertErrors}
          setAlertErrors={setAlertErrors}
        />
        <Table<FacilityRow>
          columns={tableColumns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          rowClassName={(record) =>
            errorRowKeys.has(record.key) ? "bg-red-50" : ""
          }
          scroll={{ x: "max-content" }}
        />
        <Flex align="center" gap="middle">
          <Popconfirm
            title="Are you want to clear the table?"
            onConfirm={clearTable}
          >
            <Button type="link" danger>
              Clear Table
            </Button>
          </Popconfirm>

          <Button type="link" onClick={dismissErrors}>
            <span className="text-amber-600">Dismiss Errors</span>
          </Button>

          <Button type="link" onClick={addRow}>
            Add Row
          </Button>

          <div className="ml-auto">
            <Popconfirm
              title="Are you sure you want to submit?"
              onConfirm={onSubmit}
            >
              <Button type="primary" loading={submitting} disabled={!canSubmit}>
                Submit
              </Button>
            </Popconfirm>
          </div>
        </Flex>
      </Space>
    </Form>
  );
};

export default AddFacilities;

const AlertErrors = ({
  alertErrors,
  setAlertErrors,
}: {
  alertErrors: BulkRowError[];
  setAlertErrors: React.Dispatch<React.SetStateAction<BulkRowError[]>>;
}) => {
  if (alertErrors.length === 0) {
    return null;
  }

  return (
    <Alert
      type="error"
      showIcon
      closable
      onClose={() => setAlertErrors([])}
      message={`${alertErrors.length} problem(s) must be fixed before this batch can be submitted`}
      description={
        <ul className="list-disc pl-5">
          {alertErrors.map((error, index) => (
            <li key={index}>
              {error.row > 0 ? `Row ${error.row}` : "Batch"}
              {error.field ? ` - ${fieldLabel(error.field)}: ` : ": "}
              {error.message}
            </li>
          ))}
        </ul>
      }
    />
  );
};
