type Facility = {
  id: number;
  name: string;
  code: string;
};

type Option = {
  label: string;
  value: string;
};

export const formatFacilitiesToOptions = (
  facilitiesData: Facility[] | undefined
): Option[] => {
  if (!Array.isArray(facilitiesData)) return [];

  return facilitiesData.map((facility) => ({
    label: facility.name,
    value: facility.id.toString(), // ✅ convert to string for dropdown use
  }));
};
