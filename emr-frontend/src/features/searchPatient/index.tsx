import React, { useState } from "react";
import { Col, Form, Input, Row, Space, theme } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import CustomButton from "@/components/ui/Button";
import TopBar from "@/components/ui/TopBar";
import { JSX } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { usePermissionCheck } from "@/hooks/usePermission";
import { ROUTE_KEYS } from "@/data/routeKey";
import { useGetAllPatientsQuery } from "@/features/registerpatient/services/patientRegisterServices";
import { PatientQueryParams } from "@/data/types";
import { useGlobalNotification } from "@/hooks/useNotification";
import PatientTable from "./components/SearchTable";

interface FormValues {
  mr_no?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  cnic?: string;
  immunisation_number?: string;
}

const PatientSearchForm: React.FC = () => {
  const navigate = useNavigate();
  const showNotification = useGlobalNotification();
  const { token } = theme.useToken();
  const [form] = Form.useForm<FormValues>();
  const hasAccess = usePermissionCheck(ROUTE_KEYS.GET_A_PATIENT_BY_ID);

  const [queryParams, setQueryParams] = useState<PatientQueryParams | null>(
    null,
  );

  const { data, isFetching } = useGetAllPatientsQuery(queryParams!, {
    skip: !queryParams,
    refetchOnMountOrArgChange: true,
  });

  const patients = data?.data || [];
  const total = data?.count || 0;

  const formStyle: React.CSSProperties = {
    maxWidth: "none",
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    padding: 24,
  };

  const getFields = () => {
    const searchFields = [
      {
        name: "mr_no",
        label: "MR.NO",
        placeholder: "Enter MR No",
        min: 8,
        minMessage: "MR No. must be at least 8 digits long",
        maxLength: 16,
      },
      {
        name: "cnic",
        label: "CNIC",
        placeholder: "Enter CNIC",
        min: 13,
        minMessage: "CNIC must be 13 digits long",
        maxLength: 13,
      },
      {
        name: "first_name",
        label: "FIRST NAME",
        placeholder: "Enter first name",
        min: 2,
        minMessage: "First name must be at least 2 characters long",
        maxLength: 70,
      },
      {
        name: "last_name",
        label: "LAST NAME",
        placeholder: "Enter last name",
        min: 2,
        minMessage: "Last name must be at least 2 characters long",
        maxLength: 70,
      },
      {
        name: "phone_number",
        label: "PHONE",
        placeholder: "Enter phone no",
        maxLength: 12,
        min: 12,
        minMessage: "Phone number must be 11 digits long",
        masked: true,
        pattern: "####-#######",
      },
      {
        name: "immunisation_number",
        label: "QR NUMBER",
        placeholder: "Enter Immunisation QR Number",
        minMessage: "Immunisation number must be 14 digits long",
        min: 14,
        maxLength: 14,
      },
    ];

    const children: JSX.Element[] = [];

    searchFields.forEach((field, index) => {
      children.push(
        <Col xs={24} sm={24} md={12} lg={12} key={index}>
          <Form.Item
            name={field.name}
            label={
              <span className="!text-xs text-green-custom font-bold w-18">
                {field.label}
              </span>
            }
            rules={
              field.min ? [{ min: field.min, message: field.minMessage }] : []
            }
          >
            {field.masked ? (
              <Input
                prefix={<SearchOutlined />}
                placeholder={field.pattern}
                maxLength={field.maxLength}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 4) {
                    value = value.slice(0, 4) + "-" + value.slice(4, 11);
                  }
                  form.setFieldValue(field.name as keyof FormValues, value);
                }}
              />
            ) : (
              <Input
                prefix={<SearchOutlined />}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
              />
            )}
          </Form.Item>
        </Col>,
      );
    });

    return children;
  };

  const onFinish = (values: FormValues) => {
    if (!hasAccess) {
      return showNotification(
        "error",
        "You don't have permission to search patients",
      );
    }

    const hasSearchCriteria = Object.values(values).some((v) => v?.trim());

    if (!hasSearchCriteria) {
      setQueryParams(null);
      return;
    }

    setQueryParams({ page: 1, limit: 4, ...values });
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev!, page }));
  };

  return (
    <>
      <Form
        form={form}
        name="patient_search"
        style={formStyle}
        onFinish={onFinish}
        className="shadow-sm"
      >
        <Row gutter={24}>{getFields()}</Row>
        <div className="flex flex-col-reverse items-start md:flex-row justify-between items-center mt-4 gap-y-4 md:gap-y-0">
          <p
            className="!text-green-custom text-base font-semibold cursor-pointer"
            onClick={() => navigate("/patient-register")}
          >
            New Registration?
          </p>
          <Space size="small">
            <CustomButton
              size="sm"
              title="Search Patient"
              type="submit"
              disabled={!hasAccess}
            />
          </Space>
        </div>
      </Form>

      {queryParams && (
        <>
          <br />
          <TopBar title="Search Results" />
          <br />
          <PatientTable
            data={patients}
            loading={isFetching}
            total={total}
            currentPage={queryParams.page || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </>
  );
};

export default PatientSearchForm;
