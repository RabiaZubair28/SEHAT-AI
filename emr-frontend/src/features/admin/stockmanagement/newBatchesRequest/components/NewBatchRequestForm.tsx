import React, { useMemo, useState } from "react";
import { Form, Tabs, Button } from "antd";
import TopBar from "@/components/ui/TopBar";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Loader from "@/components/shared/Loader";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import { HttpStatus, Roles } from "@/data/types";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useAddMedicineBatchMutation } from "@/features/admin/services/medicineBatchesApi";
import { ROUTES } from "@/data/routes";
import { RootState } from "@/redux/store";
import MedicineBatchFields from "./MedicineBatchFields";
import { transformMedicineBatchFormValues } from "../../constants/medicineBatchFormTransformers";

type MedicineBatchFormProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  notifyChangeInForm: any;
};

const NewMedicineBatchRequestForm: React.FC<MedicineBatchFormProps> = ({
  form,
  formFields,
  handleFormValuesChange,
  notifyChangeInForm,
}) => {
  const [activeKey, setActiveKey] = useState<string>("1");
  // const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [postMedicineBatch, { isLoading }] = useAddMedicineBatchMutation();
  const showNotification = useGlobalNotification();

  const currentUser = useSelector(
    (state: RootState) => state.authAdmin.admin ?? state.authUser.user,
  );
  const listRoute =
    currentUser?.role?.name === Roles.DISPENSER
      ? ROUTES.MEDICINE_BATCHES
      : ROUTES.ADMIN_STOCK_MANAGEMENT;

  const filteredFormFields = useMemo(() => {
    return formFields.map((tab: any) => ({
      ...tab,
      fields: (tab.fields || []).filter((field: any) => {
        if (!field.visibleIf) return true;
        if (typeof field.visibleIf !== "function") return true;
        let completeFormValues = form.getFieldsValue(true);
        return field.visibleIf(completeFormValues);
      }),
    }));
  }, [formFields, notifyChangeInForm]);

  const validateCurrentTab = async () => {
    const currentTab = filteredFormFields.find(
      (tab) => tab.tabKey === activeKey,
    );
    const values = form.getFieldsValue(true);

    // Collect all field names of the current tab
    const fieldNames: any[] = [];

    currentTab?.fields?.forEach((field: any) => {
      if (field.type === "formList") {
        const listName = field.name;

        // Loop over list items
        (values[listName] || []).forEach((_item: any, index: number) => {
          field.fields.forEach((childField: any) => {
            fieldNames.push([listName, index, childField.name]);
          });
        });
      } else if (field.name) {
        fieldNames.push(field.name);
      }
    });

    // Add dynamic previousPregnancies fields

    const finalNames = [...fieldNames];

    try {
      await form.validateFields(finalNames);
      return { isValid: true };
    } catch {
      return { isValid: false };
    }
  };

  const handleSubmitContraceptivesBatchRequest = async () => {
    const validation = await validateCurrentTab();

    if (!validation.isValid) {
      return;
    }
    try {
      const completeFormValues = form.getFieldsValue(true);
      const payLoad = transformMedicineBatchFormValues(
        completeFormValues?.contraceptive,
      );

      const response = await postMedicineBatch(payLoad).unwrap();
      onResponseSuccess(response);
    } catch (error: any) {
      onResponseError(error);
    }
  };

  const handleSubmitMedicineBatchRequest = async () => {
    const validation = await validateCurrentTab();

    if (!validation.isValid) {
      return;
    }
    try {
      const completeFormValues = form.getFieldsValue(true);
      const payLoad = transformMedicineBatchFormValues(
        completeFormValues?.medicine,
      );

      const response = await postMedicineBatch(payLoad).unwrap();
      onResponseSuccess(response);
    } catch (error: any) {
      onResponseError(error);
    }
  };

  const onResponseSuccess = (response: any) => {
    if (
      response?.status === HttpStatus.OK ||
      response?.status === HttpStatus.CREATED
    ) {
      showNotification("success", "Medicine Batch Created Successfully");

      dispatch(
        clearFormData({
          formKey: "medicine_batch",
        }),
      );
      navigate(listRoute);
    } else {
      const message = Array.isArray(response?.message)
        ? response.message.join(", ") // join all error messages into one string
        : response?.message || "Issue in submitting medicine batch";
      showNotification("error", message);
    }
  };

  const onResponseError = (error: any) => {
    const message = Array.isArray(error?.data?.message)
      ? error.data.message.join(", ")
      : error?.data?.message ||
        error?.message ||
        "Issue in submitting medicine batch";

    showNotification("error", "Medicine dispatch failed", message);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <TopBar
        title="Add New Batch"
        onIconClick={() => navigate(-1)}
        showPatientInfo={false}
        showIconButton={true}
      />
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormValuesChange}
        style={{ marginTop: 12 }}
      >
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={setActiveKey}
          // destroyOnHidden={!editMode}
          items={[
            {
              key: "1",
              label: "Medicine batch",
              children: (
                <MedicineBatchFields
                  formFieldsTab={formFields?.find(
                    (tab: any) => tab.tabKey === "1",
                  )}
                  formValues={notifyChangeInForm}
                />
              ),
            },
            {
              key: "2",
              label: "Contraceptive batch",
              children: (
                <MedicineBatchFields
                  formFieldsTab={formFields?.find(
                    (tab: any) => tab.tabKey === "2",
                  )}
                  formValues={notifyChangeInForm}
                />
              ),
            },
          ]}
        />

        {activeKey === "1" && (
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Button
              type="primary"
              loading={isLoading}
              onClick={handleSubmitMedicineBatchRequest}
            >
              {"Add medicine batch"}
            </Button>
          </div>
        )}
        {activeKey === "2" && (
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Button
              type="primary"
              loading={isLoading}
              onClick={handleSubmitContraceptivesBatchRequest}
            >
              {"Add contraceptive batch"}
            </Button>
          </div>
        )}
      </Form>
    </>
  );
};

export default NewMedicineBatchRequestForm;
