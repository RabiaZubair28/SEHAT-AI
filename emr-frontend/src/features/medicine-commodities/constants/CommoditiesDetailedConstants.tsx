import {
  CommodityItem,
  MedicineVariant,
  DispensePayload,
  DispenseItem,
} from "@/data/types";

export const setCommoditiesDetailsFormFields = (
  rejectionReason?: string | null,
  status?: string,
  userIsDispensor?: boolean,
  onRejectItem?: (index: number, itemId: number) => void,
  onQuantityChange?: (index: number, value: any) => void,
  rejectedItems?: number[],
  showDispensedFields?: boolean,
) => {
  const fields: any[] = [];

  if (userIsDispensor) {
    fields.push({
      label: "Issued To",
      name: "issued_to",
      type: "input" as const,
      inputType: "text" as const,
      required: true,
      disabled: true,
      placeholder: "Select staff type",
      colSpan: 12,
    });
  }

  if (!userIsDispensor && status === "PENDING") {
    fields.push({
      label: "Issued To",
      name: "issued_to",
      type: "input" as const,
      inputType: "text" as const,
      required: true,
      disabled: true,
      placeholder: "Issued to",
      colSpan: 12,
    });
  }

  if (
    !userIsDispensor &&
    (status === STATUS.APPROVED ||
      status === STATUS.REJECTED ||
      status === STATUS.PARTIALLY_APPROVED)
  ) {
    fields.push({
      label: "Issue From",
      name: "issue_from",
      type: "input" as const,
      inputType: "text" as const,
      required: true,
      disabled: true,
      placeholder: "Issued by",
      colSpan: 12,
    });
  }

  fields.push({
    label: "Remarks / Rejection Reason",
    name: "rejection_reason",
    type: "input" as const,
    inputType: "text" as const,
    required: false,
    disabled: true,
    colSpan: 12,
    placeholder: rejectionReason || "No remarks available",
    rows: 3,
  });

  // Add commodities table
  fields.push({
    type: "table" as const,
    name: "commodities",
    tableTitle: "Commodities Request",
    titlePrefix: "Commodity",
    showSummary: false,
    disabled: false,

    dataCount: (formValues: any) => formValues?.commodities?.length || 0,

    getGroupFields: (index: number, formValues: any) => {
      const item = formValues?.commodities?.[index];

      if (!item) return [];

      const variant: MedicineVariant = item.medicineVariant;
      const isSupplement = variant?.category === "Supplement";
      const isContraceptive = variant?.isContraceptive;
      const isRejected =
        rejectedItems?.includes(item?.id) || item?.status === STATUS.REJECTED;

      const fields: any[] = [];

      // Purpose field
      fields.push({
        label: "Purpose",
        type: "input",
        inputType: "text" as const,
        name: "purpose",
        disabled: true,
        colSpan: 4,
      });

      // Name field based on type
      if (isSupplement) {
        fields.push({
          label: "Supplement Name",
          type: "input",
          inputType: "text" as const,
          name: "supplementName",
          disabled: true,
          colSpan: 4,
        });
      } else if (isContraceptive) {
        fields.push({
          label: "Method Name",
          type: "input",
          inputType: "text" as const,
          name: "method_name",
          disabled: true,
          colSpan: 4,
        });
      } else {
        fields.push({
          label: "Medicine Name",
          type: "input",
          inputType: "text" as const,
          name: "medicineName",
          disabled: true,
          colSpan: 4,
        });
      }

      // Strength (for non-supplement, non-contraceptive)
      if (!isSupplement && !isContraceptive) {
        fields.push({
          label: "Strength",
          type: "input",
          inputType: "text" as const,
          name: "strength",
          disabled: true,
          colSpan: 4,
        });
      }

      // Form of Medicine (for non-supplement, non-contraceptive)
      if (!isSupplement && !isContraceptive) {
        fields.push({
          label: "Form of Medicine",
          type: "input",
          inputType: "text" as const,
          name: "formOfMedicine",
          disabled: true,
          colSpan: 4,
        });
      }

      // Quantity Required
      fields.push({
        label: "Quantity Required",
        type: "input",
        inputType: "text" as const,
        name: "required_quantity",
        disabled: true,
        colSpan: 4,
      });

      // Quantity Dispensed Field
      if (showDispensedFields && userIsDispensor) {
        fields.push({
          label: "Quantity Dispensed",
          type: "number" as const,
          name: "quantity_Dispensed",
          colSpan: 4,
          required: !isRejected,
          placeholder: "Enter qantity dispensed",
          disabled: isRejected,
          onChange: (value: any) => onQuantityChange?.(index, value),
          rules: [
            {
              validator: (_: any, value: number) => {
                if (isRejected) return Promise.resolve();
                if (value < 0) {
                  return Promise.reject("Quantity cannot be negative");
                }
                const maxQuantity = item.quantityRequested || 0;
                if (value > maxQuantity) {
                  return Promise.reject(
                    `Cannot exceed quantity required ${maxQuantity}`,
                  );
                }
                return Promise.resolve();
              },
            },
          ],
        });
      } else {
        // View-only field for non-dispensers or read-only view
        fields.push({
          label: "Quantity Dispensed",
          type: "input",
          inputType: "text" as const,
          name: "quantity_Dispensed_View",
          placeholder: "Entered quantity",
          disabled: true,
          colSpan: 4,
        });
      }

      // Reject Button (for dispenser mode)
      if (userIsDispensor && showDispensedFields) {
        fields.push({
          type: "button" as const,
          label: "Reject",
          name: `reject`,
          disabled: isRejected,
          colSpan: 4,
          marginTop: 30,
          danger: true,
          onClick: () => onRejectItem?.(index, item.id),
        });
      }

      return fields;
    },
  });

  return fields;
};

export function mapRequestedCommoditiesToFormValues(
  requestedCommoditiesData: CommodityItem[],
  rejectionReason?: string | null,
): Record<string, any> {
  if (!requestedCommoditiesData?.length) return {};

  const updatedValues: Record<string, any> = {
    rejection_reason: rejectionReason || "N/A",
    commodities: [],
  };

  // Create commodities array
  requestedCommoditiesData.forEach((item) => {
    const variant = item.medicineVariant;
    const isContraceptive = variant.isContraceptive;
    const category = variant.category.toLowerCase();

    const dispensedQuantity =
      item?.status === STATUS.REJECTED ? "0" : item.quantityDispensed;

    const commodityItem: any = {
      id: item.id,
      purpose: item?.purpose || "",
      medicineName: variant.medicineName || "",
      supplementName: variant.medicineName || "",
      method_name: variant.medicineName || "",
      strength: variant.strength || "",
      formOfMedicine: variant?.unit || "",
      required_quantity: item.quantityRequested,
      quantity_Dispensed: dispensedQuantity ?? "0",
      quantity_Dispensed_View: dispensedQuantity ?? "0",
      category,
      isContraceptive,
      medicineVariant: variant,
      quantityRequested: item.quantityRequested,
      status: item.status,
      notes: item.notes || "",
    };

    updatedValues.commodities.push(commodityItem);
  });

  return updatedValues;
}

export const transformCommodityRequestPayloadWithRejected = (
  medicinesRequestedByRequestID: any,
  formValues: Record<string, any>,
  rejectedItems: number[],
  rejectionReason?: string,
  mainStatus?: string,
): DispensePayload => {
  if (!medicinesRequestedByRequestID?.items?.length) {
    return {
      status: STATUS.APPROVED,
      items: [],
      ...(rejectionReason && { rejectionReason }),
    };
  }

  const items: DispenseItem[] = [];
  const commodities = formValues.commodities || [];

  for (
    let index = 0;
    index < medicinesRequestedByRequestID.items.length;
    index++
  ) {
    const item = medicinesRequestedByRequestID.items[index];
    const isRejected = rejectedItems?.includes(item.id);
    const commodityData = commodities[index] || {};

    const itemStatus = isRejected ? STATUS.REJECTED : STATUS.APPROVED;

    // Get quantity from the commodity data
    const quantityDispensed = isRejected
      ? null
      : Number(commodityData.quantity_Dispensed || 0);

    items.push({
      itemId: item.id,
      quantityDispensed,
      notes: item?.notes || "",
      status: itemStatus,
    });
  }

  return {
    status: mainStatus || STATUS.APPROVED,
    items,
    ...(rejectionReason && { rejectionReason }),
  };
};

export const STATUS = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PARTIALLY_APPROVED: "PARTIALLY_FULFILLED",
};
