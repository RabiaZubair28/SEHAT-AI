export type FormValues = Record<string, any>;

const evaluateFieldWarning = (
  warningFields: any[],
  allValues: FormValues,
  fieldName: string,
  ...args: unknown[]
): string[] => {
  const messages: string[] = [];
  const field = warningFields.find((f) => f.name === fieldName);

  if (field?.warningEnableCondition) {
    const warning = field.warningEnableCondition(allValues, ...args);
    if (Array.isArray(warning)) {
      messages.push(...warning);
    } else if (warning) {
      messages.push(warning);
    }
  }

  return messages;
};

const collectNewbornWarnings = (
  changedValues: FormValues,
  warningFields: any[],
  allValues: FormValues,
): string[] => {
  const messages: string[] = [];
  const changedNewborns = changedValues?.newbornAssessments || [];

  for (let index = 0; index < changedNewborns.length; index++) {
    const changedNewborn = changedNewborns[index];
    if (!changedNewborn) continue;

    const changedNewbornFields = Object.keys(changedNewborn);
    if (changedNewbornFields.length === 0) continue;

    // Check only the first changed field in this newborn
    messages.push(
      ...evaluateFieldWarning(
        warningFields,
        allValues,
        changedNewbornFields[0],
        index,
      ),
    );
  }

  return messages;
};

export const getWarningMessages = (
  changedValues: FormValues,
  _previousValues: FormValues,
  warningFields: any[],
  allValues: FormValues,
): string[] => {
  const firstChangedField = Object.keys(changedValues)[0];
  if (!firstChangedField) return [];

  switch (firstChangedField) {
    case "newbornAssessments":
      return collectNewbornWarnings(changedValues, warningFields, allValues);
    case "lmp":
      // gestationalAge is derived & disabled; LMP edits drive its warning
      return evaluateFieldWarning(warningFields, allValues, "gestationalAge");
    default:
      return evaluateFieldWarning(warningFields, allValues, firstChangedField);
  }
};
