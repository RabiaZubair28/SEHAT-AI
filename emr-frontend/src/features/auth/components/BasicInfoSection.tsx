import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Divider } from "antd";
import InputField from "@/components/ui/InputField";
import SingleSelectDropDown from "@/components/ui/SingleSelect";
import { TextFieldType } from "@/data/types";
import { useGetFacilitiesQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { formatRolesToOptions } from "@/utils/formats/rolesFormatter";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useGetRolesQuery } from "@/services/roleApiServices";
import {
  SignUpFieldLabels,
  SignUpFieldPlaceholders,
  SignUpFieldNames,
} from "@/features/auth/data/constants";

const BasicInfoSection: React.FC = () => {
  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("");

  const pagination = useDropDownPagination();

  const { data: facilitiesResponse, refetch: refetchFacilities } =
    useGetFacilitiesQuery({
      page: pagination.currentPage,
      limit: 10,
      name: facilitySearchTerm,
    });

  const { data: roles } = useGetRolesQuery();

  const handleFacilitySearch = useCallback(
    (value: string) => {
      setFacilitySearchTerm(value);
      // Reset to first page when searching
      pagination.reset();

      // Refetch with new search term
      refetchFacilities();
    },
    [refetchFacilities, pagination]
  );

  //original will modified later
  const roleOptions = useMemo(() => {
    return formatRolesToOptions(roles);
  }, [roles]);

  useEffect(() => {
    if (facilitiesResponse?.lastPage) {
      pagination.setLastPage(facilitiesResponse.lastPage);
    }
  }, [facilitiesResponse, pagination]);
  //original will modified later
  // const roleOptions = useMemo(() => {
  //   return roles ? formatRolesToOptions(roles) : [];
  // }, [roles]);

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
        setFacilityOptions(facilities); // Only reset on page 1
      }
    }
  }, [facilitySearchTerm, facilities, pagination.currentPage]);

  return (
    <>
      <Divider orientation="left" orientationMargin="0">
        Basic Information
      </Divider>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <InputField
          name={SignUpFieldNames.FirstName}
          label={SignUpFieldLabels.FirstName}
          placeholder={SignUpFieldPlaceholders.FirstName}
          required
          maxLength={255}
          disallowNumbers
          rules={[
            {
              max: 255,
              message: "can not exceed 255 characters",
            },
          ]}
        />
        <InputField
          name={SignUpFieldNames.LastName}
          label={SignUpFieldLabels.LastName}
          placeholder={SignUpFieldPlaceholders.LastName}
          required
          maxLength={255}
          disallowNumbers
          rules={[
            {
              max: 255,
              message: "can not exceed 255 characters",
            },
          ]}
        />
      </div>

      <InputField
        name={SignUpFieldNames.Email}
        label={SignUpFieldLabels.Email}
        placeholder={SignUpFieldPlaceholders.Email}
        required
        rules={[
          {
            type: TextFieldType.Email,
            message: "Email is not valid!",
          },
        ]}
      />

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <InputField
          name={SignUpFieldNames.Password}
          label={SignUpFieldLabels.Password}
          placeholder={SignUpFieldPlaceholders.Password}
          required
          type={TextFieldType.Password}
          rules={[
            {
              min: 8,
              message: "Password must be at least 8 characters long",
            },
          ]}
        />
        <InputField
          name={SignUpFieldNames.ConfirmPassword}
          label={SignUpFieldLabels.ConfirmPassword}
          placeholder={SignUpFieldPlaceholders.ConfirmPassword}
          required
          type={TextFieldType.Password}
          dependencies={[SignUpFieldNames.Password]}
          rules={[
            ({ getFieldValue }: any) => ({
              validator(_: any, value: string) {
                if (
                  !value ||
                  getFieldValue(SignUpFieldNames.Password) === value
                ) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match!"));
              },
            }),
          ]}
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <SingleSelectDropDown
          name={SignUpFieldNames.Role}
          label={SignUpFieldLabels.Role}
          placeholder={SignUpFieldPlaceholders.Role}
          options={roleOptions}
          required
          onChange={() => {}}
        />
        <SingleSelectDropDown
          name={SignUpFieldNames.Facility}
          label={SignUpFieldLabels.Facility}
          placeholder={SignUpFieldPlaceholders.Facility}
          options={facilityOptions}
          showSearch={true}
          onChange={() => {}}
          fetchMore={pagination.fetchMore}
          isLoadingMore={pagination.isLoadingMore}
          onSearch={handleFacilitySearch}
          filterOption={false}
          required
        />
      </div>
    </>
  );
};

export default BasicInfoSection;
