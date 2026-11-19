import { Repository } from 'typeorm';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';

interface AdministeredMedicineRaw {
  medicine_variant_id: number;
  quantity: number;
}

interface AdministeredMedicineEnriched extends AdministeredMedicineRaw {
  medicine_id: number | null;
  medicine_name: string | null;
  variant_unit: string | null;
  variant_strength: string | null;
}

export async function enrichMedicinesAdministered(
  medicineVariantRepo: Repository<MedicineVariant>,
  medicines: AdministeredMedicineRaw[],
): Promise<AdministeredMedicineEnriched[]> {
  if (!medicines || !Array.isArray(medicines)) {
    return [];
  }

  const enriched: AdministeredMedicineEnriched[] = [];

  for (const med of medicines) {
    const variantId = med.medicine_variant_id;

    if (!variantId) {
      enriched.push({
        ...med,
        medicine_id: null,
        medicine_name: null,
        variant_unit: null,
        variant_strength: null,
      });
      continue;
    }

    try {
      const variant = await medicineVariantRepo.findOne({
        where: { id: variantId },
        relations: ['medicine'],
      });

      enriched.push({
        medicine_variant_id: variantId,
        quantity: med.quantity,
        medicine_id: variant?.medicine?.id ?? null,
        medicine_name: variant?.medicine?.name ?? null,
        variant_unit: variant?.unit ?? null,
        variant_strength: variant?.strength ?? null,
      });
    } catch {
      enriched.push({
        medicine_variant_id: variantId,
        quantity: med.quantity,
        medicine_id: null,
        medicine_name: null,
        variant_unit: null,
        variant_strength: null,
      });
    }
  }

  return enriched;
}
