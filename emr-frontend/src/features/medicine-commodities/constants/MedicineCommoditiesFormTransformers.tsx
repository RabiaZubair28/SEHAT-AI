import { StockRefillPayload } from "@/data/types";

export const transformMedicineCommoditiesFormValues = (
  generatedRequestList: any[],
  _completeStockOptions: any[],
  notes?: string
): StockRefillPayload => {
  if (!generatedRequestList?.length) {
    return {
      notes,
      items: [],
    };
  }

  return {
    notes,
    items: generatedRequestList.map((m) => {
      return {
        medicineVariantId: m?.variant_id ?? null,
        quantityRequested: m.quantity_requested,
        purpose: m.medicine_purpose,
      };
    }),
  };
};
