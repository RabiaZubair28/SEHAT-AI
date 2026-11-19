import { useState, useRef, useEffect } from "react";
import { Form, Row, Col, Button } from "antd";
import { FormGenerator } from "@/components/shared/DynamicFormGenerator";
import { useReferralFormFields } from "../hooks/useReferralFormHook";
import RadioButton from "@/components/ui/RadioButton";
import { REFERRAL_TYPES } from "../data/constants";
import { useGlobalNotification } from "@/hooks/useNotification";
import {
  useReferPatientInsideMutation,
  useReferPatientSelfMutation,
  useReferPatientOutsideMutation,
  useUnassignPatientMutation,
} from "@/features/referrals/services/ReferralApiServices";
import { useSelector } from "react-redux";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { ROUTES } from "@/data/routes";
import { FormFieldConfig, Roles } from "@/data/types";
import { ReferralIn, ReferralOut, ApiResponse } from "@/data/types";
import { capitalizeFirstLetter } from "@/utils/formats/capitalize";
import Loader from "@/components/shared/Loader";
import { hasPermission } from "@/utils/permissionUtils";

export interface ReferralFormValues {
  referralType: string;
  referred_to_id?: number;
  district_id?: number;
  facility_id?: number;
  refer_out_reason?: string;
  levelOfCare: string;
  typeOfService: string;
}

export default function ReferralForm() {
  const [referralType, setReferralType] = useState<string>(REFERRAL_TYPES.IN);
  const [form] = Form.useForm();
  const formRef = useRef<any>(null);
  const levelOfCare = Form.useWatch("levelOfCare", form);
  const showNotification = useGlobalNotification();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.authUser.user);
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const location = useLocation();
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const permissions = useSelector((state: RootState) =>
    state.authUser.userPermissions?.payload,
  );
  const canSelfRefer =
    !isAdmin &&
    Boolean(user) &&
    hasPermission(permissions, "/referrals/self-referral", "POST");
  const { patientId } = useParams();
  const selectedPatientId = location.state?.patientId || patientId;
  const [referInside, { isLoading: referInLoading }] =
    useReferPatientInsideMutation();
  const [referOutside, { isLoading: referOutLoading }] =
    useReferPatientOutsideMutation();
  const [referSelf, { isLoading: referSelfLoading }] =
    useReferPatientSelfMutation();
  const [unassignPatient, { isLoading: unassignLoading }] =
    useUnassignPatientMutation();

  const { formFields } = useReferralFormFields(
    referralType,
    levelOfCare,
    selectedPatientId,
  );

  const isReferLoading =
    referInLoading || referOutLoading || referSelfLoading || unassignLoading;

  useEffect(() => {
    if (!levelOfCare) return;
    form.resetFields(["district_id", "facility_id"]);
  }, [levelOfCare, form]);

  useEffect(() => {
    if (!canSelfRefer && referralType === REFERRAL_TYPES.SELF) {
      setReferralType(REFERRAL_TYPES.IN);
      form.setFieldValue("referralType", REFERRAL_TYPES.IN);
    }
  }, [canSelfRefer, referralType, form]);

  const handleUnassign = async () => {
    if (!selectedPatientId) {
      showNotification("error", "Missing Patient", "Patient ID not found.");
      return;
    }

    try {
      const response = await unassignPatient({
        patient_id: Number(selectedPatientId),
        facility_id: user?.facility?.id,
      }).unwrap();

      if (response?.success) {
        showNotification(
          "success",
          "Patient Unassigned",
          "Patient has been moved to the unassigned queue.",
        );
        form.resetFields();

        if (adminUser) {
          navigate(ROUTES.ADMIN_PENDING);
        } else if (user?.role?.name === Roles.FRONT_DESK) {
          navigate(ROUTES.SEARCH_PATIENT);
        } else {
          navigate(ROUTES.PATIENT_QUEUE);
        }
      } else {
        showNotification(
          "error",
          "Unassign Failed",
          response?.message || "Failed to unassign patient.",
        );
      }
    } catch (error) {
      const apiError = (error as { data?: ApiResponse })?.data;
      showNotification(
        "error",
        "Unassign Error",
        apiError?.message || "An error occurred while unassigning patient.",
      );
    }
  };

  const onFinish = async (values: ReferralFormValues) => {
    if (referralType === REFERRAL_TYPES.SELF && !canSelfRefer) {
      showNotification(
        "error",
        "Permission Denied",
        "You do not have permission to submit a self referral.",
      );
      return;
    }

    if (!selectedPatientId) {
      showNotification("error", "Missing Patient", "Patient ID not found.");
      return;
    }

    try {
      let response: ApiResponse;

      if (
        referralType === REFERRAL_TYPES.IN ||
        referralType === REFERRAL_TYPES.SELF
      ) {
        const isSelfReferral = referralType === REFERRAL_TYPES.SELF;
        const payLoad: ReferralIn = {
          patient_id: Number(selectedPatientId),
          service_id: Number(values.referred_to_id),
        };

        response = await (isSelfReferral
          ? referSelf(payLoad)
          : referInside(payLoad)
        ).unwrap();

        if (response?.success) {
          const doctorData = response?.data?.doctor;
          const patientData = response?.data?.appointment?.patient;
          const tokenNumber = response?.data?.appointment?.token_number;

          const patientName = patientData
            ? `${capitalizeFirstLetter(
                patientData.first_name,
              )} ${capitalizeFirstLetter(patientData.last_name)}`
            : "patient";

          const doctorName = doctorData
            ? `Dr. ${capitalizeFirstLetter(
                doctorData.first_name,
              )} ${capitalizeFirstLetter(doctorData.last_name)}`
            : "the assigned doctor";

          const message = tokenNumber
            ? `${patientName} has been assigned to ${doctorName} on Queue number ${tokenNumber}.`
            : `${patientName} has been assigned to ${doctorName}.`;

          showNotification(
            "success",
            isSelfReferral
              ? "Self Referral Submitted"
              : "Internal Referral Submitted",
            message,
            30,
          );
        } else {
          showNotification(
            "error",
            response?.error,
            response?.message ||
              `Failed to submit ${isSelfReferral ? "self" : "internal"} referral.`,
          );
          return;
        }
      } else {
        const payLoad: ReferralOut = {
          patient_id: Number(selectedPatientId),
          district_id: Number(values.district_id),
          facility_id: Number(values.facility_id),
          level_of_care: values.levelOfCare,
          refer_out_reason: values.refer_out_reason || "",
          type_of_service: values.typeOfService,
          type: "external",
        };
        response = await referOutside(payLoad).unwrap();

        if (response?.success) {
          showNotification(
            "success",
            "External Referral Submitted",
            "The referral was successfully submitted externally.",
          );
        } else {
          showNotification(
            "error",
            "External Referral Failed",
            response?.message || "Failed to submit external referral.",
          );
          return;
        }
      }

      form.resetFields();

      if (adminUser) {
        navigate(ROUTES.ADMIN_PENDING);
      } else if (user?.role?.name === Roles.FRONT_DESK) {
        navigate(ROUTES.SEARCH_PATIENT);
      } else {
        navigate(ROUTES.PATIENT_QUEUE);
      }
    } catch (error) {
      const apiError = (error as { data?: ApiResponse })?.data;
      showNotification(
        "error",
        "Referral Error",
        apiError?.message || "An error occurred while submitting the referral.",
      );
    }
  };

  if (isReferLoading) return <Loader />;

  return (
    <>
      <Form
        ref={formRef}
        form={form}
        onFinish={onFinish}
        layout="vertical"
        style={{ marginTop: 24 }}
        initialValues={{ referralType: REFERRAL_TYPES.IN }}
      >
        <RadioButton
          options={Object.values(REFERRAL_TYPES).filter(
            (type) => type !== REFERRAL_TYPES.SELF || canSelfRefer,
          )}
          onChange={(value) => {
            setReferralType(value);
            form.resetFields(
              Object.keys(form.getFieldsValue()).filter(
                (key) => key !== "referralType",
              ),
            );
          }}
          label="Referral Type"
          name="referralType"
          required
        />

        <Row gutter={16}>
          {formFields.map((field: FormFieldConfig) => (
            <Col
              key={field.name}
              xs={24}
              sm={24}
              md={field.colSpan || 8}
              lg={field.colSpan || 8}
            >
              {FormGenerator(field)}
            </Col>
          ))}
        </Row>
        <div className="flex justify-end gap-2">
          <Button
            danger
            //    disabled={!hasAccess || referralType !== REFERRAL_TYPES.IN}
            onClick={handleUnassign}
          >
            Unassigned
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            //disabled={!hasAccess}
          >
            Submit
          </Button>
        </div>
      </Form>
    </>
  );
}
