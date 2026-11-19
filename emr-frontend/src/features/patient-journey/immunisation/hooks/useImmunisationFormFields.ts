import { useMemo } from "react";
import {
  IMMUNISATION_FORM_FIELDS,
  WOMEN_IMMUNISATION_FORM_FIELDS,
} from "../../data/immunisationConstants";

type ExtraHandlers = {
  onScanClick?: () => void;
};

export const useImmunisationFormFields = (
  extraHandlers: ExtraHandlers = {}
) => {
  const mapTabs = (tabs: any[]) =>
    tabs.map((tab) => ({
      ...tab,
      fields: tab.fields.map((field: any) => {
        const updatedField = { ...field };

        if (
          field.name === "scanImmunisationCard" &&
          extraHandlers.onScanClick
        ) {
          updatedField.onClick = extraHandlers.onScanClick;
        }

        return updatedField;
      }),
    }));

  const formFields = useMemo(
    () => mapTabs(IMMUNISATION_FORM_FIELDS),
    [extraHandlers],
  );

  const womenFormFields = useMemo(
    () => mapTabs(WOMEN_IMMUNISATION_FORM_FIELDS),
    [extraHandlers],
  );

  return { formFields, womenFormFields };
};
