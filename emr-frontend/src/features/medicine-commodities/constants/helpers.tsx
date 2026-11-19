export const filterByContraceptiveType = (
  data: any[] = [],
  isContraceptive: boolean
) => {
  return data.filter(
    (request) =>
      request?.items?.length &&
      request.items.every(
        (item: any) =>
          item?.medicineVariant?.isContraceptive === isContraceptive
      )
  );
};

// export const filterByContraceptiveType = (
//   data: any[],
//   isContraceptive: boolean
// ) => {
//   if (!data || !Array.isArray(data)) return [];

//   return data.filter((item) => {
//     // Handle case where medicineVariant might be undefined
//     if (!item?.medicineVariant) return false;

//     // Check if medicineVariant is an array
//     if (Array.isArray(item.medicineVariant)) {
//       return item.medicineVariant.every(
//         (variant: any) => variant.isContraceptive === isContraceptive
//       );
//     }

//     // If it's a single object, check directly
//     return item.medicineVariant.isContraceptive === isContraceptive;
//   });
// };
