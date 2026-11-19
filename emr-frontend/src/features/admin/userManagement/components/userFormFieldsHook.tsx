import { useState, useEffect, useMemo, useCallback } from "react";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useGetFacilitiesQuery } from "../../services/facilitiesApi";
import { useGetRolesQuery } from "@/services/roleApiServices";
import { formatRolesToOptions } from "@/utils/formats/rolesFormatter";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { FormElementType, TextFieldType } from "@/data/types";
import { useLocationCascade } from "@/hooks/useLocationCascade";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/data/routes";
import {
  GenderOptions,
  BloodTypeOptions,
  MaritalStatusOptions,
} from "@/features/auth/data/constants";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const useUserFormFields = (initialValues?: any) => {
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("");
  const [facilityOptions, setFacilityOptions] = useState<any[]>([]);
  const pagination = useDropDownPagination();

  const {
    locationOptions,
    isLocationLoading,
    handlers: { onDivisionChange, onDistrictChange, onTalukaChange },
  } = useLocationCascade(initialValues);

  const location = useLocation();
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const user = useSelector((state: RootState) =>
    isAdmin ? state.authAdmin.admin : state.authUser.user
  );

  const userFacilityId = user?.facility?.id;

  // Fetch paginated facilities
  const {
    data: facilitiesResponse,
    refetch: refetchFacilities,
    isFetching: isFacilitiesFetching,
  } = useGetFacilitiesQuery({
    page: pagination.currentPage,
    limit: 10,
    name: facilitySearchTerm,
    facility_id: userFacilityId,
  });

  // Fetch the specific facility if editing a user
  const {
    data: editingFacilityResponse,
    isFetching: isEditingFacilityFetching,
  } = useGetFacilitiesQuery(
    {
      facility_id: initialValues?.facility_id,
    },
    {
      skip: !initialValues?.facility_id, // Only fetch if editing
    }
  );

  const { data: roles } = useGetRolesQuery();

  const handleFacilitySearch = useCallback(
    (value: string) => {
      setFacilitySearchTerm(value);
      pagination.reset();
      refetchFacilities();
    },
    [refetchFacilities, pagination]
  );

  const roleOptions = useMemo(() => {
    return formatRolesToOptions(roles);
  }, [roles]);

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

  // Effect to handle facility options updates
  useEffect(() => {
    if (!facilities.length) return;

    if (pagination.currentPage === 1) {
      setFacilityOptions(facilities);
    } else {
      setFacilityOptions((prev) => [...prev, ...facilities]);
    }
  }, [facilities, pagination.currentPage]);

  // Effect to preload the editing user's facility
  useEffect(() => {
    if (
      editingFacilityResponse?.data &&
      editingFacilityResponse.data.length > 0
    ) {
      const editingFacility = formatFacilitiesToOptions(
        editingFacilityResponse.data
      )[0];

      // Check if this facility is already in options
      const alreadyExists = facilityOptions.some(
        (opt) => opt.value === editingFacility.value
      );

      if (!alreadyExists) {
        // Add the editing facility at the beginning
        setFacilityOptions((prev) => [editingFacility, ...prev]);
      }
    }
  }, [editingFacilityResponse]);

  useEffect(() => {
    if (facilitySearchTerm !== "") {
      if (pagination.currentPage === 1) {
        setFacilityOptions(facilities);
      }
    }
  }, [facilitySearchTerm, facilities, pagination.currentPage]);

  // BASIC INFO FIELDS
  const basicInfoFields = useMemo(
    () => [
      {
        name: "first_name",
        label: "First Name",
        type: "input" as FormElementType,
        placeHolder: "Enter First Name",
        inputType: TextFieldType.Text,
        required: true,
        disallowNumbers: true,
        maxLength: 100,
      },
      {
        name: "last_name",
        label: "Last Name",
        placeHolder: "Enter Last Name",
        type: "input" as FormElementType,
        inputType: TextFieldType.Text,
        required: true,
        disallowNumbers: true,
        maxLength: 100,
      },
      {
        name: "email",
        label: "Email",
        placeHolder: "Enter Email",
        type: "input" as FormElementType,
        inputType: TextFieldType.Email,
        rules: [
          {
            type: TextFieldType.Email,
            message: "Email is not valid!",
          },
        ],
        required: true,
      },
      {
        name: "password",
        label: "Password",
        placeHolder: "Enter Password",
        type: "input" as FormElementType,
        inputType: TextFieldType.Password,
        rules: [
          {
            min: 8,
            message: "Password must be at least 8 characters long",
          },
        ],
        required: true,
      },
      {
        name: "role_id",
        label: "Role",
        type: "select" as FormElementType,
        placeholder: "Select Role",
        required: true,
        options: roleOptions || [],
        showSearch: true,
      },
      {
        name: "facility_id",
        label: "Facility",
        type: "select" as FormElementType,
        required: true,
        placeholder: "Select Facility",
        options: facilityOptions || [],
        showSearch: true,
        fetchMore: pagination.fetchMore,
        isLoadingMore: pagination.isLoadingMore,
        onSearch: handleFacilitySearch,
        searchLoading: isFacilitiesFetching || isEditingFacilityFetching,
        filterOption: false,
      },
    ],
    [
      roleOptions,
      facilityOptions,
      isFacilitiesFetching,
      isEditingFacilityFetching,
      pagination.fetchMore,
      pagination.isLoadingMore,
      handleFacilitySearch,
    ]
  );

  const personalDetailsFields = useMemo(
    () => [
      {
        name: "cnic",
        label: "CNIC",
        type: "input" as FormElementType,
        placeHolder: "Enter your CNIC (13 digits)",
        inputType: TextFieldType.Number,
        required: true,
        maxLength: 13,
        rules: [
          {
            validator: (_: any, value: any) => {
              if (!value || value.toString().length === 13) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("CNIC must be exactly 13 digits")
              );
            },
          },
        ],
      },
      {
        name: "dob",
        label: "Date of Birth",
        type: "date" as FormElementType,
        placeHolder: "Select your date of birth",
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        type: "radio" as FormElementType,
        options: GenderOptions,
        required: true,
      },
      {
        name: "blood_type",
        label: "Blood Type",
        type: "select" as FormElementType,
        placeholder: "Select your blood type",
        options: BloodTypeOptions,
      },
      {
        name: "contact",
        label: "Contact Number",
        type: "maskedInput" as FormElementType,
        placeHolder: "Enter your contact number",
        inputType: TextFieldType.Number,
        required: true,
        maxLength: 11,
        pattern: "03XX-XXXXXXX",
        prefix: "03",
        rules: [
          {
            validator: (_: any, value: string) => {
              if (!value) {
                return Promise.resolve(); // allow empty if optional, or reject if required
              }

              // Remove non-digit characters (like '-') before validating
              const digitsOnly = value.replace(/\D/g, "");

              // Phone number must start with '03' and have 11 digits
              if (/^03\d{9}$/.test(digitsOnly)) {
                return Promise.resolve();
              }

              return Promise.reject(
                new Error("Phone number must be 11 digits (e.g., 03XX-XXXXXXX)")
              );
            },
          },
        ],
      },
      {
        name: "emergency_contact",
        label: "Emergency Contact",
        type: "input" as FormElementType,
        placeHolder: "Enter emergency contact number",
        inputType: TextFieldType.Number,
        maxLength: 11,
        rules: [
          {
            pattern: /^03\d{9}$/,
            message: "Phone number must be a valid Number (e.g., 03XXXXXXXXX)",
          },
        ],
      },
      {
        name: "address",
        label: "Address",
        type: "input" as FormElementType,
        placeHolder: "Enter your full address",
        required: true,
        maxLength: 255,
      },
      {
        name: "division_id",
        label: "Division",
        type: "select" as FormElementType,
        placeholder: "Select division",
        required: true,
        options: locationOptions.divisions,
        showSearch: true,
      },
      {
        name: "district_id",
        label: "District",
        type: "select" as FormElementType,
        placeholder: "Select district",
        required: true,
        options: locationOptions.districts,
        showSearch: true,
      },
      {
        name: "taluka_id",
        label: "Taluka",
        type: "select" as FormElementType,
        placeholder: "Select Taluka",
        required: true,
        options: locationOptions.talukas,
        showSearch: true,
      },
      {
        name: "uc_id",
        label: "UC",
        type: "select" as FormElementType,
        placeholder: "Select UC",
        required: true,
        options: locationOptions.ucs,
        showSearch: true,
      },
      {
        name: "qualifications",
        label: "Qualifications",
        type: "input" as FormElementType,
        placeHolder: "Enter your qualifications",
        disallowNumbers: true,
        maxLength: 255,
      },
      {
        name: "specialization",
        label: "Specialization",
        type: "input" as FormElementType,
        placeHolder: "Enter your specialization",
        disallowNumbers: true,
        maxLength: 100,
      },
      {
        name: "marital_status",
        label: "Marital Status",
        type: "select" as FormElementType,
        placeholder: "Select marital status",
        required: true,
        options: MaritalStatusOptions,
      },
      {
        name: "nationality",
        label: "Nationality",
        type: "input" as FormElementType,
        placeHolder: "Enter your nationality",
        required: true,
        maxLength: 100,
        disallowNumbers: true,
      },
      {
        name: "religion",
        label: "Religion",
        type: "input" as FormElementType,
        placeHolder: "Enter your religion",
        required: true,
        maxLength: 25,
        disallowNumbers: true,
      },
    ],
    [locationOptions]
  );

  return {
    basicInfoFields,
    isLocationLoading,
    personalDetailsFields,
    pagination,
    locationHandlers: {
      onDivisionChange,
      onDistrictChange,
      onTalukaChange,
    },
  };
};

export default useUserFormFields;
