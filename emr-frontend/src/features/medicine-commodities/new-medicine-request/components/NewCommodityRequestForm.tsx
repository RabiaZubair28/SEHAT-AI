import React, { useMemo, useState } from "react";
import { Form, Tabs, Button } from "antd";
import TopBar from "@/components/ui/TopBar";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Loader from "@/components/shared/Loader";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import { HttpStatus } from "@/data/types";
import { useGlobalNotification } from "@/hooks/useNotification";
import { ROUTES } from "@/data/routes";
import MedicineCommodityFields from "./MedicineRequest";
import { transformMedicineCommoditiesFormValues } from "../../constants/MedicineCommoditiesFormTransformers";
import { useCreateCommodityRequestMutation } from "../../services/medicinecommoditiyApi";

type MedicineBatchFormProps = {
  form: any;
  formFields: any[];
  handleFormValuesChange: (values: any, changedValues: any) => void;
  stockmedicineOptions: any[];
  contraceptiveOptions: any[];
  notifyChangeInForm: any;
};

const NewCommodityRequestForm: React.FC<MedicineBatchFormProps> = ({
  form,
  formFields,
  handleFormValuesChange,
  notifyChangeInForm,
  stockmedicineOptions,
  contraceptiveOptions,
}) => {
  const [activeKey, setActiveKey] = useState<string>("1");
  // const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [createCommodityRequest, { isLoading }] =
    useCreateCommodityRequestMutation();
  const showNotification = useGlobalNotification();

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
    const fieldNames: any = [];

    currentTab?.fields?.forEach((field: any) => {
      if (field.type === "formList") {
        const listName = field.name;

        // Loop over list items
        (values[listName] || []).forEach((index: any) => {
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

  const handleSubmitContraceptivesCommodityRequest = async () => {
    const validation = await validateCurrentTab();

    if (!validation.isValid) {
      return;
    }
    try {
      const completeFormValues = form.getFieldsValue(true);
      const payLoad = transformMedicineCommoditiesFormValues(
        completeFormValues?.contraceptive,
        // stockmedicineOptions,
        contraceptiveOptions,
      );

      const response = await createCommodityRequest(payLoad).unwrap();
      onResponseSuccess(response);
    } catch (error: any) {
      onResponseError(error);
    }
  };

  const handleSubmitMedicineCommodityRequest = async () => {
    const validation = await validateCurrentTab();

    if (!validation.isValid) {
      return;
    }
    try {
      const completeFormValues = form.getFieldsValue(true);
      const payLoad = transformMedicineCommoditiesFormValues(
        completeFormValues?.medicine,
        stockmedicineOptions,
      );

      const response = await createCommodityRequest(payLoad).unwrap();
      onResponseSuccess(response);
    } catch (error: any) {
      onResponseError(error);
    }
  };

  const onResponseSuccess = (response: any) => {
    if (
      response?.httpStatus === HttpStatus.OK ||
      response?.httpStatus === HttpStatus.CREATED
    ) {
      showNotification(
        "success",
        "Medicine commoditiy request created Successfully",
      );

      dispatch(
        clearFormData({
          formKey: "medicine_commodity",
        }),
      );
      navigate(ROUTES.COMMODITY_REQUESTS);
    } else {
      const message = Array.isArray(response?.message)
        ? response.message.join(", ") // join all error messages into one string
        : response?.message || "Issue in submitting medicine commodity";
      showNotification("error", message);
    }
  };

  const onResponseError = (error: any) => {
    const message = Array.isArray(error?.data?.message)
      ? error.data.message.join(", ")
      : error?.data?.message ||
        error?.message ||
        "Issue in submitting commodity request";

    showNotification("error", "Medicine commodity dispatch failed", message);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <TopBar
        title="New Commodity Request"
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
              label: "Medicine request",
              children: (
                <MedicineCommodityFields
                  formFieldsTab={formFields?.find(
                    (tab: any) => tab.tabKey === "1",
                  )}
                  formValues={notifyChangeInForm}
                />
              ),
            },
            {
              key: "2",
              label: "Contraceptive request",
              children: (
                <MedicineCommodityFields
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
              onClick={handleSubmitMedicineCommodityRequest}
            >
              {"Generate medicine request"}
            </Button>
          </div>
        )}
        {activeKey === "2" && (
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Button
              type="primary"
              loading={isLoading}
              onClick={handleSubmitContraceptivesCommodityRequest}
            >
              {"Generate contraceptive request"}
            </Button>
          </div>
        )}
      </Form>
    </>
  );
};

export default NewCommodityRequestForm;
