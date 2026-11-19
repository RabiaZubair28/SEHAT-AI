import { Button, Form, Row, Col, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar.tsx";
import MedicineBatchTable from "./components/MedicineBatchesTable.tsx";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes.ts";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/index.tsx";
import { useDropDownPagination } from "@/hooks/useDropDownPagination.tsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Roles } from "@/data/types.tsx";
import { useGetFacilitiesQuery } from "../../services/facilitiesApi.tsx";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter.tsx";
import SingleSelectDropDown from "@/components/ui/SingleSelect.tsx";
import { useDynamicMedicines } from "@/features/patient-journey/hooks/useDynamicMedicines.ts";
import { FilterOutlined } from "@ant-design/icons";

export default function MedicineBatches() {
  const navigate = useNavigate();
  const adminUser = useSelector(
    (state: RootState) => state.authAdmin.admin ?? state.authUser.user,
  );
  const [activeKey, setActiveKey] = useState<string>("1");
  const [form] = Form.useForm();
  const pagination = useDropDownPagination();

  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("");

  const userRoleName = adminUser?.role?.name;
  const isDispenser = userRoleName === Roles.DISPENSER;
  const isFacilityScoped =
    userRoleName === Roles.FACILITY_INCHARGE || isDispenser;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityScoped && userFacilityId);
  const newRequestRoute = isDispenser
    ? ROUTES.MEDICINE_BATCHES_NEW_REQUEST
    : ROUTES.ADMIN_STOCK_MANAGEMENT_NEW_REQUEST;

  // Add these states
  const [searchParams, setSearchParams] = useState<{
    facility?: number;
    medicine?: number;
  }>({});

  const { data: facilitiesResponse, refetch: refetchFacilities } =
    useGetFacilitiesQuery({
      page: pagination.currentPage,
      limit: 10,
      name: facilitySearchTerm,
    });

  const handleFacilitySearch = useCallback(
    (value: string) => {
      if (isDropdownDisabled) return;
      setFacilitySearchTerm(value);
      pagination.reset();
      refetchFacilities();
    },
    [isDropdownDisabled, pagination, refetchFacilities],
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

  useEffect(() => {
    if (isFacilityScoped && userFacilityId && adminUser?.facility) {
      const userFacilityOption = {
        label: adminUser.facility.name,
        value: userFacilityId,
      };
      setFacilityOptions([userFacilityOption]);
      // Automatically set search params and enable fetching
      setSearchParams({ facility: userFacilityId });
      // setShouldFetch(true);
      form.setFieldsValue({ facility: userFacilityId });
    }
  }, [isFacilityScoped, userFacilityId, adminUser, form]);

  const handleFacilityChange = useCallback(
    (value: any) => {
      if (!isDropdownDisabled) form.setFieldsValue({ facility: value });
    },
    [isDropdownDisabled, form],
  );

  const {
    completeStockMedicinesOptions,
    stockMedicinePaginationProps,
    paginatedContraceptiveOptions,
    contraceptivePaginationProps,
  } = useDynamicMedicines({
    skipSupplements: true,
    skipMedicines: true,
    skipOtc: true,
    skipShortTermContraceptives: true,
    skipLarcContraceptives: true,
  });

  const handleMedicineChange = useCallback(
    (value: any) => form.setFieldsValue({ medicine: value }),
    [form],
  );

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setSearchParams(values);
  };

  const handleReset = () => {
    form.resetFields();
    setFacilitySearchTerm("");
    pagination.reset();
    setSearchParams({});

    // restore facility for facility-scoped roles
    if (isFacilityScoped && userFacilityId) {
      form.setFieldsValue({ facility: userFacilityId });
    }
  };

  useEffect(() => {
    form.resetFields();
    setSearchParams({});
    if (isFacilityScoped && userFacilityId) {
      form.setFieldsValue({ facility: userFacilityId });
      setSearchParams({ facility: userFacilityId });
    }
  }, [activeKey, form, isFacilityScoped, userFacilityId]);

  return (
    <>
      <TopBar title="Medicine Batches" />

      {/* Request button */}
      {isFacilityScoped && (
        <div className="flex justify-end mt-6 mb-6">
          <Button
            type="primary"
            onClick={() => navigate(newRequestRoute)}
          >
            Add new batch
          </Button>
        </div>
      )}
      <Form form={form} layout="vertical">
        <Row gutter={16} className="mt-6">
          <Col xs={24} sm={12} md={12} lg={8}>
            <Form.Item name="facility" label="Search By Facility">
              <SingleSelectDropDown
                placeholder={
                  isDropdownDisabled
                    ? `${adminUser?.facility?.name || "N/A"}`
                    : "Select Facility"
                }
                options={facilityOptions}
                showSearch={!isDropdownDisabled}
                onChange={handleFacilityChange}
                onSearch={handleFacilitySearch}
                fetchMore={
                  isDropdownDisabled ? undefined : pagination.fetchMore
                }
                isLoadingMore={pagination.isLoadingMore}
                filterOption={false}
                disabled={isDropdownDisabled}
              />
            </Form.Item>
          </Col>
          {activeKey === "1" && (
            <Col xs={24} sm={12} md={12} lg={8}>
              <Form.Item name="medicine" label="Search By Medicine">
                <SingleSelectDropDown
                  placeholder="Select medicine"
                  options={completeStockMedicinesOptions.filter((m) => {
                    return m.contraceptive === false;
                  })}
                  showSearch
                  onChange={handleMedicineChange}
                  filterOption={false}
                  fetchMore={stockMedicinePaginationProps.fetchMore}
                  isLoadingMore={stockMedicinePaginationProps.isLoadingMore}
                  onSearch={stockMedicinePaginationProps.onSearch}
                />
              </Form.Item>
            </Col>
          )}

          {activeKey === "2" && (
            <Col xs={24} sm={12} md={12} lg={8}>
              <Form.Item name="medicine" label="Search By Contraceptive">
                <SingleSelectDropDown
                  placeholder="Select contraceptive"
                  options={paginatedContraceptiveOptions}
                  showSearch
                  onChange={handleMedicineChange}
                  filterOption={false}
                  fetchMore={contraceptivePaginationProps.fetchMore}
                  isLoadingMore={contraceptivePaginationProps.isLoadingMore}
                  onSearch={contraceptivePaginationProps.onSearch}
                />
              </Form.Item>
            </Col>
          )}

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
        destroyOnHidden
        items={[
          {
            key: "1",
            label: "Medicine",
            children: (
              <MedicineBatchTable
                searchParams={searchParams}
                contraceptives={false}
              />
            ),
          },
          {
            key: "2",
            label: "Contraceptive",
            children: (
              <MedicineBatchTable
                searchParams={searchParams}
                contraceptives={true}
              />
            ),
          },
        ]}
      />
    </>
  );
}
