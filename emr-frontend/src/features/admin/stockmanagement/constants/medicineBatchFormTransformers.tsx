interface ApiPayloadItem {
  variantId: number;
  batchNumber?: string;
  expiryDate: string;
  purchaseDate: string;
  stockQuantity: number;
  limitQuantity?: number | null;
  otc: boolean;
  medicineId: number;
}

export const transformMedicineBatchFormValues = (
  generatedRequestList: any[],
): ApiPayloadItem[] => {
  return generatedRequestList.map((m) => {
    const variantId = m?.variantId ?? null;

    return {
      variantId,
      batchNumber: m.batch_number,
      expiryDate: m.expiry_date,
      purchaseDate: m.purchase_date,
      stockQuantity: m.stock_quantitys,
      limitQuantity: m.limit_quantity ?? null,
      otc: Array.isArray(m.is_otc) ? m.is_otc.includes(true) : !!m.is_otc,
      medicineId: m.medicineName,
    };
  });
};
