import { useState } from "react";
import { Button, Form, Steps, theme } from "antd";
import BasicInfoSection from "./BasicInfoSection";
import PersonalDetailsSection from "./PersonalDetailSection";
import { useSignupMutation } from "@/features/auth/services/authApiServices";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/shared/Loader";
import Title from "@/components/shared/Title";
import { useGlobalNotification } from "@/hooks/useNotification";
import { SIGNUP_MESSAGES } from "@/data/messages";
import { ROUTES } from "@/data/routes";
import dayjs from "dayjs";

const steps = [
  {
    title: "Basic Info",
    content: <BasicInfoSection />,
  },
  {
    title: "Personal Details",
    content: <PersonalDetailsSection />,
  },
];

const SignUpForm = () => {
  const showNotification = useGlobalNotification();
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [signupUser, { isLoading }] = useSignupMutation();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const validateCurrentStep = async () => {
    try {
      // Get all field names
      const fields = form.getFieldsValue();
      const fieldNames = Object.keys(fields);

      // Validate only the fields that belong to current step
      await form.validateFields(fieldNames);
      return true;
    } catch (error) {
      showNotification(
        SIGNUP_MESSAGES.STEPS_FAILED.type,
        SIGNUP_MESSAGES.STEPS_FAILED.title,
        SIGNUP_MESSAGES.STEPS_FAILED.description
      );
      return false;
    }
  };

  const next = async () => {
    try {
      const isValid = await validateCurrentStep();
      if (!isValid) return;
      showNotification(
        SIGNUP_MESSAGES.STEPS_SUCCESS.type,
        SIGNUP_MESSAGES.STEPS_SUCCESS.title,
        SIGNUP_MESSAGES.STEPS_SUCCESS.description
      );
      setCurrent((prevCurrent) => prevCurrent + 1);
    } catch (error) {
      // console.error("Validation failed:", error);
    }
  };

  const prev = () => {
    setCurrent((prevCurrent) => prevCurrent - 1);
  };

  const onFinish = async () => {
    // const formValues = form.getFieldsValue(true);
    const { confirm_password, dob, ...formValues } = form.getFieldsValue(true);

    const formattedDOB = dob ? dayjs(dob).format("YYYY-MM-DD") : null;

    const payload = {
      ...formValues,
      dob: formattedDOB,
      email: formValues?.email?.trim().toLowerCase(),
    };

    try {
      const response = await signupUser(payload).unwrap();

      if (response?.success) {
        showNotification(
          SIGNUP_MESSAGES.SUCCESS.type,
          SIGNUP_MESSAGES.SUCCESS.title,
          response?.message || SIGNUP_MESSAGES.SUCCESS.description
        );
        navigate(ROUTES.LOGIN);
      } else {
        // In case response is OK but success is false
        showNotification(
          SIGNUP_MESSAGES.FAILURE.type,
          SIGNUP_MESSAGES.FAILURE.title,
          response?.message || SIGNUP_MESSAGES.FAILURE.description
        );
      }
    } catch (error: any) {
      // Handle network or unexpected errors
      showNotification(
        SIGNUP_MESSAGES.FAILURE.type,
        SIGNUP_MESSAGES.FAILURE.title,
        error.data?.error?.data?.message || SIGNUP_MESSAGES.FAILURE.description
      );
    }
  };

  return (
    <>
      <Title
        className="!text-green-custom !my-6 text-center"
        level={4}
        text="Create your account"
      />
      {isLoading && <Loader />}
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        onValuesChange={(changedValues) => {
          // ← Yeh add karo
          if (changedValues.division_id !== undefined) {
            form.setFieldsValue({
              district_id: undefined,
              taluka_id: undefined,
              uc_id: undefined,
            });
          }
          if (changedValues.district_id !== undefined) {
            form.setFieldsValue({
              taluka_id: undefined,
              uc_id: undefined,
            });
          }
          if (changedValues.taluka_id !== undefined) {
            form.setFieldsValue({
              uc_id: undefined,
            });
          }
        }}
        style={{
          maxWidth: 900,
          minHeight: 300,
          background: colorBgContainer,
          padding: 24,
          borderRadius: 8,
          margin: "0 auto",
        }}
      >
        <Steps current={current} style={{ marginBottom: 24 }}>
          {steps.map((item) => (
            <Steps.Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <div>{steps[current].content}</div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {current > 0 && (
            <Button style={{ marginRight: 8 }} onClick={() => prev()}>
              Previous
            </Button>
          )}
          {current < steps.length - 1 && (
            <div className="flex flex-col gap-2">
              <Button
                className="bg-green-custom w-25"
                type="primary"
                onClick={() => next()}
              >
                Next
              </Button>
              <p>
                Already have an account?{" "}
                <a onClick={() => navigate(ROUTES.LOGIN)}>Login</a>
              </p>
            </div>
          )}
          {current === steps.length - 1 && (
            <Button
              className="bg-green-custom w-25"
              type="primary"
              htmlType="submit"
            >
              Submit
            </Button>
          )}
        </div>
      </Form>
    </>
  );
};

export default SignUpForm;
