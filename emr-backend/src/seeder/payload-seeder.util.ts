type PermissionPayloadItem = Record<string, any>;

const clonePayload = (payload: PermissionPayloadItem[] = []) =>
  JSON.parse(JSON.stringify(payload));

const getPermissionKey = (
  payload: PermissionPayloadItem,
  index: number,
): string => {
  if (payload?.method && payload?.route) {
    return `${payload.method}:${payload.route}`;
  }

  return `fallback:${index}:${JSON.stringify(payload)}`;
};

const sortPayload = (payload: PermissionPayloadItem[] = []) =>
  [...payload].sort((left, right) =>
    getPermissionKey(left, 0).localeCompare(getPermissionKey(right, 0)),
  );

export const mergeSeededPayload = (
  existingPayload: PermissionPayloadItem[] = [],
  seededPayload: PermissionPayloadItem[] = [],
): PermissionPayloadItem[] => {
  const seededKeys = new Set(
    seededPayload.map((payload, index) => getPermissionKey(payload, index)),
  );

  const mergedPayload = clonePayload(seededPayload);
  const existingOnlyPayload = clonePayload(existingPayload).filter(
    (payload, index) => !seededKeys.has(getPermissionKey(payload, index)),
  );

  return [...mergedPayload, ...existingOnlyPayload];
};

export const payloadsAreEqual = (
  leftPayload: PermissionPayloadItem[] = [],
  rightPayload: PermissionPayloadItem[] = [],
): boolean =>
  JSON.stringify(sortPayload(leftPayload)) ===
  JSON.stringify(sortPayload(rightPayload));
