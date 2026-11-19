import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useGetPatientByIdQuery } from "@/features/patient-journey/services/patientProfileApi";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import {
  getPersonalDetailsFields,
  getSociodemographicFields,
  getMedicalHistoryFields,
  getVisitHistoryFields,
} from "../data/patientFormFields";
import PatientProfileForm from "./components/PatientProfileForm";
import { useLocationCascade } from "@/hooks/useLocationCascade";
import Loader from "@/components/shared/Loader";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Roles } from "@/data/types";

interface FormValues {
  division_id?: number;
  district_id?: number;
  taluka_id?: number;
  uc_id?: number;
  showOtherField?: boolean;
  selectedCnicProvider?: string;
}

const PatientProfile = () => {
  const { patientId } = useParams();
  const { data: patientData } = useGetPatientByIdQuery(Number(patientId));
  const [formValues, setFormValues] = useState<FormValues>({});
  const [showQrModal, setShowQRModal] = useState(false);
  const { locationOptions, handlers, ucPagination, isLocationLoading } =
    useLocationCascade();
  const user = useSelector((state: RootState) => state.authUser.user);
  const isFrontDesk = user?.role?.name === Roles.FRONT_DESK;
  const isVaccinator = user?.role?.name === Roles.VACCINATOR;

  useEffect(() => {
    if (patientData) {
      setFormValues({
        division_id: patientData.division_id,
        district_id: patientData.district_id,
        taluka_id: patientData.taluka_id,
        uc_id: patientData.uc_id,
      });

      if (patientData.division_id)
        handlers.onDivisionChange(patientData.division_id);
      if (patientData.district_id)
        handlers.onDistrictChange(patientData.district_id);
      if (patientData.taluka_id) handlers.onTalukaChange(patientData.taluka_id);

      setSelectedPatientData(patientData);
    }
  }, [patientData, handlers]);

  const staticFields = useMemo(() => {
    const base = [
      {
        tab: "2",
        title: "Sociodemographic Details",
        fields: getSociodemographicFields(),
      },
      { tab: "3", title: "Medical History", fields: getMedicalHistoryFields() },
      { tab: "4", title: "Visit History", fields: getVisitHistoryFields() },
    ];

    return isFrontDesk || isVaccinator
      ? base.filter((t) => t.tab === "2")
      : base;
  }, [isFrontDesk, isVaccinator]);

  const personalDetailsFields = useMemo(
    () =>
      getPersonalDetailsFields({
        divisions: locationOptions.divisions,
        districtsData: locationOptions.districts,
        talukasData: locationOptions.talukas,
        ucOptions: locationOptions.ucs,
        ucPagination,
        onDivisionChange: handlers.onDivisionChange,
        onDistrictChange: handlers.onDistrictChange,
        onTalukaChange: handlers.onTalukaChange,
        handleOnClickQRCode: () => {
          setShowQRModal(true);
        },
      }),
    [locationOptions, ucPagination, handlers, setShowQRModal],
  );

  const formFields = useMemo(
    () => [
      { tab: "1", title: "Personal Details", fields: personalDetailsFields },
      ...staticFields,
    ],
    [personalDetailsFields, staticFields],
  );

  if (!patientData) return <div />;

  return (
    <>
      {isLocationLoading && <Loader />}
      <PatientProfileForm
        setFormValueChange={setFormValues}
        formFields={formFields}
        setShowQRModal={setShowQRModal}
        showQrModal={showQrModal}
        formValues={formValues}
        patientData={patientData}
        isFrontDesk={isFrontDesk}
        isVaccinator={isVaccinator}
      />
    </>
  );
};

export default PatientProfile;
