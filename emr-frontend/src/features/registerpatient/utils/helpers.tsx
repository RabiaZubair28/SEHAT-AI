import { PatientFormValues } from "@/data/types";

export const mapPatientFormValuesToPayload = (
  values: PatientFormValues,
): Omit<any, "id" | "mr_no"> => {
  let cnicValue;

  if (values.nationalityStatus === "Pakistani") {
    if (values.cnic_provider && values.cnic_provider !== "CNIC Not Available") {
      cnicValue = values?.cnic?.replace(/-/g, "");
    }
  } else {
    cnicValue =
      values?.international_id &&
      values.international_id !== "" &&
      values.international_id !== "undefined"
        ? values.international_id
        : undefined;
  }

  const payload: any = {
    first_name: values.first_name,
    last_name: values.last_name,
    nationalityStatus: values.nationalityStatus,
    cnic_provider: values.cnic_provider,
    dob: values.dob,
    gender: values.gender,
    phone_provider: values.phone_provider,
    phone_number: values.phone_number,
    address: values.address,
    division_id: values.division_id,
    district_id: values.district_id,
    taluka_id: values.taluka_id,
    uc_id: values.uc_id,
    additional_info: {
      guardian_name: values.guardian_name,
      marital_status: values.marital_status,
      blood_group: values.blood_group || null,
    },
    social_determinants: {
      mother_tongue: values.mother_tongue,
      occupation_head_of_household: values.occupation_head_of_household,
      household_members_count: Number(values.household_members_count),
      years_of_education: values.years_of_education,
      dwelling_type: values.dwelling_type,
    },
  };

  if (cnicValue !== undefined && cnicValue !== null && cnicValue !== "") {
    payload.cnic = String(cnicValue);
  }

  if (
    values.qr_number !== undefined &&
    values.qr_number !== null &&
    values.qr_number !== "" &&
    String(values.qr_number) !== "undefined"
  ) {
    payload.immunisation_number = String(values.qr_number);
  }

  return payload;
};
