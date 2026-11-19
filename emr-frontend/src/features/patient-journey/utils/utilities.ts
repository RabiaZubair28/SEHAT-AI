import dayjs from "dayjs";
import { SERVICES_STATUS, ServiceType } from "../data/constants";

export const transformFormDataToApiFormat = (formData: any) => {
  let dobString: string | null = null;

  if (formData.dob) {
    try {
      if (typeof formData.dob.format === "function") {
        dobString = formData.dob.format("YYYY-MM-DD");
      } else {
        const dateObj = new Date(formData.dob);
        if (!isNaN(dateObj.getTime())) {
          dobString = dateObj.toISOString().split("T")[0];
        }
      }
    } catch (err) {
      console.error("Error formatting DOB:", err);
      dobString = null;
    }
  }

  let cnicValue;
  if (formData.nationalityStatus === "Pakistani") {
    if (
      formData.cnic_provider &&
      formData.cnic_provider !== "CNIC Not Available"
    ) {
      cnicValue = formData?.cnic?.replace(/-/g, "");
    }
  } else {
    cnicValue =
      formData?.international_id &&
      formData.international_id !== "" &&
      formData.international_id !== "undefined"
        ? formData.international_id
        : undefined;
  }

  const payload: any = {
    nationalityStatus: formData.nationalityStatus,
    cnic_provider: formData.cnic_provider,
    first_name: formData.first_name,
    last_name: formData.last_name,
    dob: dobString,
    gender: formData.gender,
    phone_provider: formData.phone_provider,
    phone_number: formData.phone_number,
    address: formData.address,
    division_id: formData.division_id,
    district_id: formData.district_id,
    facility_id: formData.facility_id,
    taluka_id: formData.taluka_id,
    other_cnic_provider: formData.other_cnic_provider,
    uc_id: formData.uc_id,
    immunisation_number: formData.immunisation_number,

    additionalInfo: {
      marital_status: formData.marital_status,
      blood_group: formData.blood_group,
      guardian_name: formData.guardian_name,
    },

    socialDeterminants: {
      dwelling_type: formData.dwelling_type,
      occupation_head_of_household: formData.occupation_head_of_household,
      household_members_count: formData.household_members_count,
      mother_tongue: formData.mother_tongue,
      years_of_education: formData.years_of_education,
    },

    medicalHistories: {
      allergies: formData.allergies || [],
      previous_illness: formData.previous_illness || [],
      addictions: formData.addictions || [],
    },
  };

  if (cnicValue !== undefined && cnicValue !== null && cnicValue !== "") {
    payload.cnic = String(cnicValue);
  }

  return payload;
};

export function calculateAge(dobString: string): number {
  const dob = dayjs(dobString);
  const now = dayjs();
  return now.diff(dob, "year");
}

export function formatDosage(dosage: string): string | null {
  const regex = /^\d-\d-\d$/;
  return regex.test(dosage) ? dosage : null;
}

export const findTabWithError = (errorFields: any[], formFields: any[]) => {
  const firstErrorField = errorFields?.[0]?.name?.[0];
  if (!firstErrorField) return null;

  const tabWithError = formFields.find((tab: any) =>
    tab.fields?.some((field: { name: any }) => field.name === firstErrorField),
  );

  return tabWithError?.tab || null;
};

export function isServiceCompleted(
  appointmentServices: any[] | undefined,
  serviceName: ServiceType,
): boolean {
  if (!appointmentServices || !appointmentServices.length) return false;

  return appointmentServices.some(
    (item) =>
      item?.service?.name === serviceName &&
      item?.status === SERVICES_STATUS.COMPLETED,
  );
}
