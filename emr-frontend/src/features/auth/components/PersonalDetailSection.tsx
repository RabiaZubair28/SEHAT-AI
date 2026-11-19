import React from "react";
import { Divider } from "antd";
import InputField from "@/components/ui/InputField";
import SingleSelectDropDown from "@/components/ui/SingleSelect";
import RadioButton from "@/components/ui/RadioButton";
import DatePickerField from "@/components/ui/DatePicker";
import { TextFieldType } from "@/data/types";
import {
  SignUpFieldLabels,
  SignUpFieldPlaceholders,
  SignUpFieldNames,
  GenderOptions,
  BloodTypeOptions,
  MaritalStatusOptions,
} from "@/features/auth/data/constants";
import { useLocationCascade } from "@/hooks/useLocationCascade";
import Loader from "@/components/shared/Loader";
const PersonalDetailsSection: React.FC = () => {
  const {
    locationOptions,
    isLocationLoading,
    handlers: { onDivisionChange, onDistrictChange, onTalukaChange },
  } = useLocationCascade();

  return (
    <>
      {isLocationLoading && <Loader />}
      <Divider orientation="left" orientationMargin="0">
        Personal Details
      </Divider>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <InputField
          name={SignUpFieldNames.CNIC}
          label={SignUpFieldLabels.CNIC}
          placeholder={SignUpFieldPlaceholders.CNIC}
          required
          type={TextFieldType.Number}
          rules={[
            {
              validator: (_: any, value: Number) => {
                if (!value || value.toString().length === 13) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("CNIC must be exactly 13 digits")
                );
              },
            },
          ]}
          maxLength={13}
        />
        <DatePickerField
          name={SignUpFieldNames.DateOfBirth}
          label={SignUpFieldLabels.DateOfBirth}
          placeholder={SignUpFieldPlaceholders.DateOfBirth}
          required
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <RadioButton
          label={SignUpFieldLabels.Gender}
          name={SignUpFieldNames.Gender}
          options={GenderOptions}
          required
          onChange={() => {}}
        />
        <SingleSelectDropDown
          name={SignUpFieldNames.BloodType}
          label={SignUpFieldLabels.BloodType}
          placeholder={SignUpFieldPlaceholders.BloodType}
          options={BloodTypeOptions}
          onChange={() => {}}
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <InputField
          name={SignUpFieldNames.Contact}
          label={SignUpFieldLabels.Contact}
          placeholder={SignUpFieldPlaceholders.Contact}
          required
          type={TextFieldType.Number}
          maxLength={11}
          rules={[
            {
              pattern: /^03\d{9}$/,
              message:
                "Phone number must be a valid Number (e.g., 03XXXXXXXXX)",
            },
          ]}
        />
        <InputField
          name={SignUpFieldNames.EmergencyContact}
          label={SignUpFieldLabels.EmergencyContact}
          placeholder={SignUpFieldPlaceholders.EmergencyContact}
          type={TextFieldType.Number}
          maxLength={11}
          rules={[
            {
              pattern: /^03\d{9}$/,
              message:
                "Phone number must be a valid Number (e.g., 03XXXXXXXXX)",
            },
          ]}
        />
      </div>

      <InputField
        name={SignUpFieldNames.Address}
        label={SignUpFieldLabels.Address}
        placeholder={SignUpFieldPlaceholders.Address}
        required
        maxLength={255}
      />
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <SingleSelectDropDown
          name="division_id"
          label="Division"
          placeholder="Select division"
          required
          options={locationOptions.divisions}
          onChange={(value) => {
            console.log("Division selected:", value);
            onDivisionChange(value);
          }}
          showSearch
        />
        <SingleSelectDropDown
          name="district_id"
          label="District"
          placeholder="Select district"
          required
          options={locationOptions.districts}
          onChange={(value) => {
            console.log("District selected:", value);
            onDistrictChange(value);
          }}
          showSearch
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <SingleSelectDropDown
          name="taluka_id"
          label="Taluka"
          placeholder="Select Taluka"
          required
          options={locationOptions.talukas}
          onChange={(value) => {
            console.log("Taluka selected:", value);
            onTalukaChange(value);
          }}
          showSearch
        />
        <SingleSelectDropDown
          name="uc_id"
          label="UC"
          placeholder="Select UC"
          required
          options={locationOptions.ucs}
          onChange={() => {}}
          showSearch
        />
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <InputField
          name={SignUpFieldNames.Qualifications}
          label={SignUpFieldLabels.Qualifications}
          placeholder={SignUpFieldPlaceholders.Qualifications}
          disallowNumbers
          maxLength={255}
        />
        <InputField
          name={SignUpFieldNames.Specialization}
          label={SignUpFieldLabels.Specialization}
          placeholder={SignUpFieldPlaceholders.Specialization}
          disallowNumbers
          maxLength={100}
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <SingleSelectDropDown
          name={SignUpFieldNames.MaritalStatus}
          label={SignUpFieldLabels.MaritalStatus}
          placeholder={SignUpFieldPlaceholders.MaritalStatus}
          required
          options={MaritalStatusOptions}
          onChange={() => {}}
        />
        <InputField
          name={SignUpFieldNames.Nationality}
          label={SignUpFieldLabels.Nationality}
          placeholder={SignUpFieldPlaceholders.Nationality}
          required
          maxLength={100}
          disallowNumbers
        />
      </div>

      <InputField
        name={SignUpFieldNames.Religion}
        label={SignUpFieldLabels.Religion}
        placeholder={SignUpFieldPlaceholders.Religion}
        required
        maxLength={25}
        disallowNumbers
      />
    </>
  );
};

export default PersonalDetailsSection;
