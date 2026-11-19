import React, { useEffect, useMemo, useState } from "react";
import { Form, Tabs, Button, Modal } from "antd";
import TopBar from "@/components/ui/TopBar";
import PostDelivery from "./PostDelivery";
import PreDelivery from "./PreDelivery";
import Newborn from "./Newborn";
import Discharge from "./Discharge";
import WarningModal from "./WarningModal";
import { EditOutlined, SwapOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import DeliveryReferral from "./DeliveryReferral";
import { useReferralDropdownOptions } from "@/features/referrals/hooks/useReferralDropdownHook";
import type { DeliveryTabKey } from "../../utils/deliveryFormTransformers";
import {
  MotherCondition,
  NewbornCondition,
  VISIT_STATUS,
} from "../../data/constants";
import { useGlobalNotification } from "@/hooks/useNotification";
import TransferPatientModal from "./TransferPatientModal";
import { ServiceType } from "@/data/types";

type WarningModalState = {
  message: string[];
  visible: boolean;
};

type SaveAction = "save" | "falseLabor" | "lama" | "referToCemonc";

type DeliveryFormProps = {
  form: any;
  formFields: any[];
  onValuesChange: (changedValues: any, allValues: any) => void;
  formValues: any;
  warningModalStates: WarningModalState;
  setWarningModalStates: React.Dispatch<
    React.SetStateAction<WarningModalState>
  >;
  onSave?: (
    tabKey: DeliveryTabKey,
    values: any,
    action: SaveAction,
  ) => Promise<void> | void;
  isServiceCompleted?: boolean;
  tabLocks: Record<string, boolean>;
  setTabLocks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  tabsSavedOnce?: Record<string, boolean>;
  visitStatus?: string;
  childrenData?: any[];
  hasChildren?: boolean;
  onScanEpiClick?: (newbornIndex: number) => void;
  activeKey: DeliveryTabKey;
  setActiveKey: (key: DeliveryTabKey) => void;
};

const DeliveryForm: React.FC<DeliveryFormProps> = ({
  form,
  formFields,
  onValuesChange,
  formValues,
  warningModalStates,
  setWarningModalStates,
  onSave,
  tabLocks,
  setTabLocks,
  tabsSavedOnce,
  visitStatus,
  childrenData = [],
  hasChildren = false,
  onScanEpiClick,
  isServiceCompleted,
  activeKey,
  setActiveKey,
}) => {
  const isVisitDispatched = visitStatus === VISIT_STATUS.DISPATCHED;
  const navigate = useNavigate();
  const levelOfCare = formValues?.levelOfCare || "";
  const isTabEditable = (tabKey: string) => !tabLocks?.[tabKey];
  const isCurrentTabEditable = isTabEditable(activeKey);
  const showNotification = useGlobalNotification();

  // Transfer Patient Modal State
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
  const DELIVERY_SERVICE_TYPE = "DELIVERY";

  const {
    districtOptions,
    facilityOptions,
    onDistrictChange,
    facilityPagination,
  } = useReferralDropdownOptions(levelOfCare, 0);

  const showConfirmation = (tabKey: DeliveryTabKey): Promise<boolean> => {
    return new Promise((resolve) => {
      const messages: Record<string, string> = {
        "3": "⚠️ Once you save the newborn assessment data, you will NOT be able to edit it later. Are you sure you want to proceed?",
        "5": "⚠️ Once you save the referral data, you will NOT be able to edit it later. Are you sure you want to proceed?",
      };

      // Only show confirmation for tab 3 and 5
      if (tabKey === "3" || tabKey === "5") {
        Modal.confirm({
          title: "Confirm Save",
          content: messages[tabKey],
          okText: "Yes, Save",
          cancelText: "Cancel",
          okType: "primary",
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      } else {
        // For other tabs, proceed without confirmation
        resolve(true);
      }
    });
  };

  const childReferralOptions = useMemo(() => {
    if (!childrenData || childrenData.length === 0) return [];

    return childrenData.map((child: any, index: number) => {
      let value: string;
      if (index === 0) {
        value = "FIRST_CHILD";
      } else if (index === 1) {
        value = "SECOND_CHILD";
      } else if (index === 2) {
        value = "THIRD_CHILD";
      } else {
        value = `CHILD_${index + 1}`;
      }

      return {
        label: `Child ${index + 1} (${child.firstName} ${child.lastName})`,
        value: value,
      };
    });
  }, [childrenData]);

  const filteredFormFields = useMemo(() => {
    const hasAliveChildren = (formValues?.newbornAssessments || []).some(
      (newborn: any) => {
        if (!newborn?.condition) return false;
        return (
          newborn.condition === NewbornCondition.ALIVE_HEALTHY ||
          newborn.condition === NewbornCondition.ALIVE_UNHEALTHY
        );
      },
    );

    const isMotherDead = formValues?.motherCondition === MotherCondition.DEAD;

    return formFields.map((tab: any) => {
      let fields = tab.fields || [];

      fields = fields.map((field: any) => {
        const updatedField: any = { ...field };

        if (tab.tabKey === "5") {
          if (field.name === "referralFor") {
            let filteredOptions = field.options;

            // Filter out "Child" if no alive children
            if (!hasChildren || !hasAliveChildren) {
              filteredOptions = filteredOptions.filter(
                (opt: any) => opt.value !== "Child",
              );
            }

            // Filter out "Mother" if mother is dead
            if (isMotherDead) {
              filteredOptions = filteredOptions.filter(
                (opt: any) => opt.value !== "Mother",
              );
            }

            updatedField.options = filteredOptions;
          }

          if (field.name === "referralForChild") {
            updatedField.options = childReferralOptions;
          }

          if (field.name === "district_id") {
            updatedField.options = districtOptions;
          }

          if (field.name === "facility_id") {
            updatedField.options = facilityOptions;
            updatedField.fetchMore = facilityPagination.fetchMore;
            updatedField.isLoadingMore = facilityPagination.isLoadingMore;
          }
        }

        if (
          (field.type === "formList" ||
            field.type === "formList_unscrollable") &&
          field.fields
        ) {
          updatedField.fields = field.fields.map((nestedField: any) => {
            const updatedNestedField = { ...nestedField };

            if (
              nestedField.name === "scanImmunisationCard" &&
              nestedField.type === "label"
            ) {
              updatedNestedField.onClick = (newbornIndex?: number) => {
                if (typeof newbornIndex === "number" && onScanEpiClick) {
                  onScanEpiClick(newbornIndex);
                }
              };
            }

            // Handle double-nested formLists (2nd level)
            if (
              (nestedField.type === "formList" ||
                nestedField.type === "formList_unscrollable") &&
              nestedField.fields
            ) {
              // Disable the double-nested formList in update mode
              if (
                tab.tabKey === "3" &&
                nestedField.name === "medicinesAdministeredNewborn" &&
                tabsSavedOnce?.["3"]
              ) {
                updatedNestedField.disabled = true;
                updatedNestedField.allowAdd = false;
                updatedNestedField.allowRemove = false;
                updatedNestedField.fields = nestedField.fields.map(
                  (deepField: any) => ({
                    ...deepField,
                    disabled: true,
                  }),
                );
              }
              if (
                tab.tabKey === "3" &&
                nestedField.name === "immunization_records" &&
                tabsSavedOnce?.["3"]
              ) {
                updatedNestedField.disabled = true;
                updatedNestedField.allowAdd = false;
                updatedNestedField.allowRemove = false;
                updatedNestedField.fields = nestedField.fields.map(
                  (deepField: any) => ({
                    ...deepField,
                    disabled: true,
                  }),
                );
              }
            }

            return updatedNestedField;
          });
        }

        if (typeof field.disabled === "function") {
          updatedField.disabled = field.disabled(formValues);
        } else {
          updatedField.disabled = field.disabled;
        }

        if (!isTabEditable(tab.tabKey)) {
          updatedField.disabled = true;
        }

        if (
          tab.tabKey === "2" &&
          field.name === "medicinesAdministered" &&
          tabsSavedOnce?.["2"]
        ) {
          updatedField.disabled = true;
          if (updatedField.fields) {
            updatedField.fields = updatedField.fields.map((nestedField: any) => ({
              ...nestedField,
              required: false,
            }));
          }
        }

        return updatedField;
      });

      const visibleFields = fields.filter((field: any) => {
        if (!field.visibleIf) return true;
        if (typeof field.visibleIf !== "function") return true;
        return field.visibleIf(formValues);
      });

      return {
        ...tab,
        fields: visibleFields,
      };
    });
  }, [
    formFields,
    formValues,
    // editMode,
    districtOptions,
    facilityOptions,
    facilityPagination.fetchMore,
    facilityPagination.isLoadingMore,
    tabLocks,
    tabsSavedOnce,
    hasChildren,
    childReferralOptions,
    onScanEpiClick,
  ]);

  useEffect(() => {
    form.setFieldsValue(formValues || {});
  }, [formValues, form]);

  useEffect(() => {
    if (
      formValues?.district_id &&
      formValues?.referral_type === "external" &&
      facilityOptions.length === 0
    ) {
      onDistrictChange(formValues.district_id);
    }
  }, [
    formValues?.district_id,
    formValues?.referral_type,
    facilityOptions.length,
    onDistrictChange,
  ]);

  const validateCurrentTab = async () => {
    const currentTab = filteredFormFields.find(
      (tab: any) => tab.tabKey === activeKey,
    );

    if (!currentTab?.fields?.length) {
      return { isValid: true as const };
    }

    try {
      // Get ALL field instances from the form
      const allFields = form.getFieldsError();

      // Filter to only fields from current tab
      const tabFieldNames = currentTab.fields.map((f: any) => f.name);
      const tabFields = allFields.filter((field: any) => {
        const rootName = Array.isArray(field.name) ? field.name[0] : field.name;
        return tabFieldNames.includes(rootName);
      });

      // Extract the field paths to validate
      const fieldsToValidate = tabFields.map((f: any) => f.name);

      await form.validateFields(fieldsToValidate);
      return { isValid: true as const };
    } catch (error: any) {
      if (error.errorFields?.[0]?.name) {
        form.scrollToField(error.errorFields[0].name);
      }
      return { isValid: false as const };
    }
  };

  const validateSpecificTab = async (tabKey: string) => {
    if (tabsSavedOnce?.[tabKey] && tabLocks[tabKey]) {
      return { isValid: true };
    }

    const tab = filteredFormFields.find((t: any) => t.tabKey === tabKey);
    if (!tab?.fields?.length) return { isValid: true };

    try {
      // Get ALL field instances from the form
      const allFields = form.getFieldsError();

      // Filter to only fields from this specific tab
      const tabFieldNames = tab.fields.map((f: any) => f.name);
      const tabFields = allFields.filter((field: any) => {
        const rootName = Array.isArray(field.name) ? field.name[0] : field.name;
        return tabFieldNames.includes(rootName);
      });

      // Extract the field paths to validate
      const fieldsToValidate = tabFields.map((f: any) => f.name);

      await form.validateFields(fieldsToValidate);
      return { isValid: true };
    } catch (error: any) {
      setActiveKey(tabKey as DeliveryTabKey);
      if (error.errorFields?.[0]?.name) {
        setTimeout(() => form.scrollToField(error.errorFields[0].name), 100);
      }
      showNotification(
        "error",
        "Validation Error",
        `Please fill all required fields in ${tab.title}`,
      );
      return { isValid: false };
    }
  };

  const goToNextTab = () => {
    const currentKeyNum = Number(activeKey);
    if (currentKeyNum < formFields.length) {
      setActiveKey(String(currentKeyNum + 1) as DeliveryTabKey);
    }
  };

  const handleSubmitWithAction = (action: SaveAction) => async () => {
    // if (!editMode) return;

    const allValues = form.getFieldsValue(true);

    // ============ TAB 1: PRE-DELIVERY ============
    if (activeKey === "1") {
      const validation = await validateCurrentTab();
      if (!validation.isValid) return;

      if (onSave) {
        if (action === "save") {
          // Save and navigate to tab 2
          await onSave("1", allValues, "save");
          setActiveKey("2");
        } else if (action === "falseLabor") {
          // Save and complete service
          await onSave("1", allValues, "falseLabor");
        } else if (action === "referToCemonc") {
          // Save and navigate to tab 5
          await onSave("1", allValues, "save");
          setActiveKey("5");
        }
      }
      return;
    }

    // ============ TAB 2: POST-DELIVERY ============
    if (activeKey === "2") {
      const validation = await validateCurrentTab();
      if (!validation.isValid) return;

      if (onSave && action === "save") {
        await onSave("2", allValues, "save");
        setActiveKey("3");
      }
      return;
    }

    // ============ TAB 3: NEWBORN ============
    if (activeKey === "3") {
      if (action === "save") {
        const validation = await validateCurrentTab();
        if (!validation.isValid) return;

        const confirmed = await showConfirmation("3");
        if (!confirmed) return;

        if (onSave) {
          try {
            await onSave("3", allValues, "save");
            setActiveKey("4");
          } catch (error) {
            // If save fails, you stay on current tab
          }
        }
      } else if (action === "lama" || action === "referToCemonc") {
        // Validate tabs 2 & 3
        const tab2Validation = await validateSpecificTab("2");
        if (!tab2Validation.isValid) return;

        setActiveKey("3"); // Switch back to tab 3 for validation
        const tab3Validation = await validateCurrentTab();
        if (!tab3Validation.isValid) return;

        const confirmed = await showConfirmation("3");
        if (!confirmed) return;

        if (onSave) {
          // Save tab 2 first (if not already saved)
          if (!tabsSavedOnce?.["2"]) {
            await onSave("2", allValues, "save");
          }

          // Save tab 3 with the action
          if (action === "lama") {
            await onSave("3", allValues, "lama");
          } else {
            // referToCemonc
            await onSave("3", allValues, "save");
            setActiveKey("5");
          }
        }
      }
      return;
    }

    // ============ TAB 4: DISCHARGE ============
    if (activeKey === "4") {
      const tab2Validation = await validateSpecificTab("2");
      if (!tab2Validation.isValid) return;

      const tab3Validation = await validateSpecificTab("3");
      if (!tab3Validation.isValid) return;

      const validation = await validateCurrentTab();
      if (!validation.isValid) return;

      if (onSave && action === "save") {
        await onSave("4", allValues, "save");
      }
      return;
    }

    // ============ TAB 5: REFERRAL ============
    if (activeKey === "5") {
      const validation = await validateCurrentTab();
      if (!validation.isValid) return;

      const confirmed = await showConfirmation("5");
      if (!confirmed) return;

      if (onSave && action === "save") {
        await onSave("5", allValues, "referToCemonc");
      }
      return;
    }
  };

  const tabItems = [
    {
      key: "1",
      label: "Pre-delivery assessment",
      children: (
        <>
          {tabLocks["1"] && !isVisitDispatched && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              {!isServiceCompleted && (
                <Button
                  icon={<EditOutlined />}
                  type="default"
                  size="small"
                  onClick={() =>
                    setTabLocks((prev) => ({ ...prev, "1": false }))
                  }
                >
                  Edit
                </Button>
              )}
            </div>
          )}

          <PreDelivery
            formFields={filteredFormFields}
            editMode={isTabEditable("1")}
          />
        </>
      ),
      forceRender: true,
    },
    {
      key: "2",
      label: "Post-delivery-assessment",
      children: (
        <>
          {tabLocks["2"] && !isVisitDispatched && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              {!isServiceCompleted && (
                <Button
                  icon={<EditOutlined />}
                  type="default"
                  size="small"
                  onClick={() =>
                    setTabLocks((prev) => ({ ...prev, "2": false }))
                  }
                >
                  Edit
                </Button>
              )}
            </div>
          )}

          <PostDelivery
            formFields={filteredFormFields}
            formValues={formValues}
          />
        </>
      ),
      forceRender: true,
    },

    {
      key: "3",
      label: "Newborn assessment",
      children: (
        <>
          {tabLocks["3"] && !isVisitDispatched && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              {/* <Button
                icon={<EditOutlined />}
                type="default"
                size="small"
                onClick={() => setTabLocks((prev) => ({ ...prev, "3": false }))}
              >
                Edit
              </Button> */}
            </div>
          )}

          <Newborn formFields={filteredFormFields} formValues={formValues} />
        </>
      ),

      forceRender: true,
    },
    {
      key: "4",
      label: "Discharge",
      forceRender: true,
      children: (
        <>
          {tabLocks["4"] && !isVisitDispatched && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              {!isServiceCompleted && (
                <Button
                  icon={<EditOutlined />}
                  type="default"
                  size="small"
                  onClick={() =>
                    setTabLocks((prev) => ({ ...prev, "4": false }))
                  }
                >
                  Edit
                </Button>
              )}
            </div>
          )}

          <Discharge formFields={filteredFormFields} />
        </>
      ),
    },
    {
      key: "5",
      label: "Delivery Referral",
      forceRender: true,
      children: (
        <>
          {tabLocks["5"] && !isVisitDispatched && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              {/* <Button
                icon={<EditOutlined />}
                type="default"
                size="small"
                onClick={() => setTabLocks((prev) => ({ ...prev, "5": false }))}
              >
                Edit
              </Button> */}
            </div>
          )}

          <DeliveryReferral
            formFields={filteredFormFields}
            formValues={formValues}
          />
        </>
      ),
    },
  ];

  return (
    <>
      <WarningModal
        visible={warningModalStates.visible}
        message={warningModalStates.message}
        onClose={() =>
          setWarningModalStates({ ...warningModalStates, visible: false })
        }
      />
      <TransferPatientModal
        visible={isTransferModalVisible}
        onClose={() => setIsTransferModalVisible(false)}
        serviceType={DELIVERY_SERVICE_TYPE as ServiceType}
      />
      <TopBar
        title="Delivery"
        onIconClick={() => navigate(-1)}
        showPatientInfo={true}
        showIconButton={true}
      />
      <Form
        onValuesChange={(changedValues, allValues) => {
          let nextAllValues = { ...allValues };
          let nextChangedValues = { ...changedValues };

          if ("levelOfCare" in changedValues) {
            form.setFieldsValue({
              district_id: undefined,
              facility_id: undefined,
            });

            nextAllValues.district_id = undefined;
            nextAllValues.facility_id = undefined;

            nextChangedValues = {
              ...nextChangedValues,
              district_id: undefined,
              facility_id: undefined,
            };
          }

          if ("district_id" in changedValues) {
            const districtId = changedValues.district_id;
            onDistrictChange(districtId);

            form.setFieldsValue({
              facility_id: undefined,
            });

            nextAllValues.facility_id = undefined;
            nextChangedValues = {
              ...nextChangedValues,
              facility_id: undefined,
            };
          }

          if ("referral_type" in changedValues) {
            // Clear all typeOfService fields when referral type changes
            form.setFieldsValue({
              typeOfServiceMother: undefined,
              typeOfServiceChild1: undefined,
              typeOfServiceChild2: undefined,
              typeOfServiceChild3: undefined,
            });

            nextAllValues.typeOfServiceMother = undefined;
            nextAllValues.typeOfServiceChild1 = undefined;
            nextAllValues.typeOfServiceChild2 = undefined;
            nextAllValues.typeOfServiceChild3 = undefined;

            nextChangedValues = {
              ...nextChangedValues,
              typeOfServiceMother: undefined,
              typeOfServiceChild1: undefined,
              typeOfServiceChild2: undefined,
              typeOfServiceChild3: undefined,
            };
          }

          // onValuesChange(nextChangedValues, nextAllValues);
          queueMicrotask(() => {
            onValuesChange(nextChangedValues, nextAllValues);
          });
        }}
        style={{ marginTop: "12px" }}
        form={form}
        disabled={isServiceCompleted}
        layout="vertical"
      >
        <Tabs
          activeKey={activeKey}
          onChange={(k) => setActiveKey(k as DeliveryTabKey)}
          items={tabItems}
        />
        {!isVisitDispatched && !isServiceCompleted && (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div>
              {(activeKey === "1" || activeKey === "2") && (
                <Button
                  type="primary"
                  icon={<SwapOutlined />}
                  onClick={() => setIsTransferModalVisible(true)}
                >
                  Transfer Patient
                </Button>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {isCurrentTabEditable ? (
                <>
                  {activeKey === "1" && (
                    <>
                      <Button onClick={handleSubmitWithAction("falseLabor")}>
                        False labour
                      </Button>
                      <Button onClick={handleSubmitWithAction("referToCemonc")}>
                        Refer to CEmONC
                      </Button>
                    </>
                  )}

                  {activeKey === "3" && (
                    <>
                      <Button onClick={handleSubmitWithAction("lama")}>
                        LAMA
                      </Button>
                      <Button onClick={handleSubmitWithAction("referToCemonc")}>
                        Refer to CEmONC
                      </Button>
                    </>
                  )}

                  <Button
                    type="primary"
                    onClick={handleSubmitWithAction("save")}
                  >
                    Save
                  </Button>
                </>
              ) : (
                activeKey !== "5" && (
                  <Button type="primary" onClick={goToNextTab}>
                    Next
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </Form>
    </>
  );
};

export default DeliveryForm;
