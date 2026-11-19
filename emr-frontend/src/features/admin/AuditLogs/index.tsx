import { Button, Form, Row, Col, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar.tsx";
import { useDropDownPagination } from "@/hooks/useDropDownPagination.tsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetFacilitiesQuery } from "../services/facilitiesApi.tsx";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter.tsx";
import AuditLogsTable from "./components/AuditLogsTable.tsx";
import SingleSelectDropDown from "@/components/ui/SingleSelect.tsx";
import { FilterOutlined } from "@ant-design/icons";
import InputField from "@/components/ui/InputField.tsx";
import Loader from "@/components/shared/Loader.tsx";

export default function AuditLogs() {
  const [activeKey, setActiveKey] = useState<string>("1");
  const [form] = Form.useForm();
  const pagination = useDropDownPagination();

  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("");

  // Add these states
  const [searchParams, setSearchParams] = useState<{
    facility?: number;
    email?: string;
  }>({});

  const {
    data: facilitiesResponse,
    isFetching: isFetcingFacilites,
    refetch: refetchFacilities,
  } = useGetFacilitiesQuery({
    page: pagination.currentPage,
    limit: 10,
    name: facilitySearchTerm,
  });

  const handleFacilitySearch = useCallback(
    (value: string) => {
      setFacilitySearchTerm(value);
      pagination.reset();
      refetchFacilities();
    },
    [pagination, refetchFacilities],
  );

  useEffect(() => {
    if (facilitiesResponse?.lastPage)
      pagination.setLastPage(facilitiesResponse.lastPage);
  }, [facilitiesResponse, pagination]);

  const facilities = useMemo(
    () =>
      facilitiesResponse
        ? formatFacilitiesToOptions(facilitiesResponse.data)
        : [],
    [facilitiesResponse],
  );

  useEffect(() => {
    if (!facilities.length) return;
    if (pagination.currentPage === 1) setFacilityOptions(facilities);
    else setFacilityOptions((prev) => [...prev, ...facilities]);
  }, [facilities, pagination.currentPage]);

  useEffect(() => {
    if (facilitySearchTerm !== "" && pagination.currentPage === 1)
      setFacilityOptions(facilities);
  }, [facilitySearchTerm, facilities, pagination.currentPage]);

  // ... rest of your existing code ...

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setSearchParams(values);
  };

  const handleReset = () => {
    form.resetFields();
    setFacilitySearchTerm("");
    pagination.reset();
    setSearchParams({});
  };

  useEffect(() => {
    form.resetFields();
    setSearchParams({});
  }, [activeKey, form]);

  if (isFetcingFacilites) return <Loader />;

  return (
    <>
      <TopBar title="Audit-Logs" />

      <Form form={form} layout="vertical">
        <Row gutter={16} className="mt-6">
          <Col xs={24} sm={12} md={12} lg={8}>
            <Form.Item name="facility" label="Search By Facility">
              <SingleSelectDropDown
                placeholder={"Select facility"}
                options={facilityOptions}
                onSearch={handleFacilitySearch}
                fetchMore={pagination.fetchMore}
                isLoadingMore={pagination.isLoadingMore}
                filterOption={false}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={12} lg={8}>
            <Form.Item name="email" label="Search By Email">
              <InputField name="email" placeholder="Search by email" />
            </Form.Item>
          </Col>

          {/* Search Button */}
          <Col xs={24} sm={12} md={12} lg={3}>
            <Form.Item label=" ">
              <Button
                icon={<FilterOutlined />}
                type="primary"
                block
                onClick={handleSearch}
              >
                Search
              </Button>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={12} lg={3}>
            <Form.Item label=" ">
              <Button block onClick={handleReset}>
                Reset
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Tabs
        defaultActiveKey="1"
        activeKey={activeKey}
        onChange={setActiveKey}
        // destroyOnHidden={!editMode}
        items={[
          {
            key: "1",
            label: "Audit Logs",
            children: (
              <AuditLogsTable
                searchParams={searchParams}
                // shouldFetch={shouldFetch}
              />
            ),
          },
        ]}
      />
    </>
  );
}
