import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar";
import SingleSelectDropDown from "@/components/ui/SingleSelect";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useGetFacilitiesQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Roles } from "@/data/types";
import AppointmentsTrackerTable from "./components/AppointmentTrackerTable";

const AppointmentTracker: React.FC = () => {
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const [form] = Form.useForm();
  const pagination = useDropDownPagination();
  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    null,
  );
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  const { data: facilitiesResponse, refetch: refetchFacilities } =
    useGetFacilitiesQuery({
      page: pagination.currentPage,
      limit: 10,
      name: facilitySearchTerm,
    });

  const handleFacilitySearch = useCallback(
    (value: string) => {
      // Don't allow search if dropdown is disabled
      if (isDropdownDisabled) return;

      setFacilitySearchTerm(value);
      pagination.reset();
      refetchFacilities();
    },
    [refetchFacilities, pagination, isDropdownDisabled],
  );

  useEffect(() => {
    if (facilitiesResponse?.lastPage) {
      pagination.setLastPage(facilitiesResponse.lastPage);
    }
  }, [facilitiesResponse, pagination]);

  const facilities = useMemo(() => {
    return facilitiesResponse
      ? formatFacilitiesToOptions(facilitiesResponse?.data)
      : [];
  }, [facilitiesResponse]);

  useEffect(() => {
    if (!facilities.length) return;
    if (pagination.currentPage === 1) {
      setFacilityOptions(facilities);
    } else {
      setFacilityOptions((prev) => [...prev, ...facilities]);
    }
  }, [facilities, pagination.currentPage]);

  useEffect(() => {
    if (facilitySearchTerm !== "") {
      if (pagination.currentPage === 1) {
        setFacilityOptions(facilities);
      }
    }
  }, [facilitySearchTerm, facilities, pagination.currentPage]);

  useEffect(() => {
    if (isFacilityIncharge && userFacilityId && adminUser?.facility) {
      const userFacilityOption = {
        label: adminUser.facility.name,
        value: userFacilityId,
      };
      setFacilityOptions([userFacilityOption]);
      setSelectedFacilityId(userFacilityId);
      form.setFieldsValue({ facility: userFacilityId });
    }
  }, [isFacilityIncharge, userFacilityId, adminUser, form]);

  const handleFacilityChange = useCallback(
    (value: any) => {
      if (isDropdownDisabled) return;
      setSelectedFacilityId(value);
      form.setFieldsValue({ facility: value });
    },
    [facilityOptions, form, isDropdownDisabled],
  );

  const tabItems = [
    {
      key: "1",
      label: "Patients List",
      children: <AppointmentsTrackerTable facilityId={selectedFacilityId} />,
    },
  ];

  return (
    <>
      <TopBar title="Appointments Tracker" />
      <br />
      <br />
      <div className="max-w-sm">
        <SingleSelectDropDown
          name="facility"
          label="Facility"
          placeholder={
            isDropdownDisabled
              ? `${adminUser?.facility?.name || "N/A"}`
              : "Select Facility"
          }
          options={facilityOptions}
          showSearch={!isDropdownDisabled}
          onChange={handleFacilityChange}
          fetchMore={isDropdownDisabled ? undefined : pagination.fetchMore}
          isLoadingMore={isDropdownDisabled ? false : pagination.isLoadingMore}
          onSearch={handleFacilitySearch}
          filterOption={false}
          required
          disabled={isDropdownDisabled} // Disable the entire dropdown
        />
      </div>

      <Form style={{ marginTop: "12px" }} form={form} layout="vertical">
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Form>
    </>
  );
};

export default AppointmentTracker;
