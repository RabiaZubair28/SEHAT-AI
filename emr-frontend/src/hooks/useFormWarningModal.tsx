// Create a custom hook for warning management

import { useEffect, useState, useCallback } from "react";
import { debounce } from "lodash";

const useWarningModal = (form: any, FORM_FIELDS: any[]) => {
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [lastChangedField, setLastChangedField] = useState("");

  const checkForWarnings = useCallback(
    debounce((changedFields: any[], allValues: any) => {
      if (!changedFields.length) return;

      const fieldName = changedFields[0].name[0];
      setLastChangedField(fieldName);

      // Find the field definition that matches the changed field
      const allFields = FORM_FIELDS.flatMap((tab) => tab.fields);
      const fieldDef = allFields.find((f) => f.name === fieldName);

      if (fieldDef?.warningEnableCondition) {
        const message = fieldDef.warningEnableCondition(allValues);
        if (message) {
          setWarningMessage(message);
          setWarningVisible(true);
        }
      }
    }, 500),
    []
  );

  // Watch form changes
  useEffect(() => {
    const unsubscribe = form.watch((value: any, info: any) => {
      checkForWarnings(info.changedFields, value);
    });

    return () => unsubscribe();
  }, [form, checkForWarnings]);

  return {
    warningVisible,
    warningMessage,
    lastChangedField,
    setWarningVisible,
  };
};


export default useWarningModal;