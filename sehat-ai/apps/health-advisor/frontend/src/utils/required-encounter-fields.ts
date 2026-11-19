type Field = {
  name?: string;
  label?: string;
  type?: string;
  required?: boolean | ((values: any, index?: number) => boolean);
  visibleIf?: (values: any, index?: number) => boolean;
  fields?: Field[];
  subFields?: { name: string }[];
};
type Tab = { tabKey: string; title?: string; fields?: Field[] };
export interface MissingEncounterField {
  name: (string | number)[];
  errors: string[];
  tabKey: string;
}
const empty = (value: any): boolean => value == null ||
  (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);

/** Inspect the host's actual field definitions, including unmounted and conditional fields. */
export function missingEncounterFields(tabs: Tab[], values: any): MissingEncounterField[] {
  const missing: MissingEncounterField[] = [];
  for (const tab of tabs) {
    const visit = (field: Field, parent: (string | number)[] = [], index?: number) => {
      if (!field.name || (field.visibleIf && !field.visibleIf(values, index))) return;
      const name = [...parent, field.name];
      const value = name.reduce((result: any, key) => result?.[key], values);
      const required = typeof field.required === 'function' ? field.required(values, index) : field.required;
      const add = () => missing.push({ name, tabKey: tab.tabKey,
        errors: [`${tab.title ?? 'Nutrition'}: ${field.label ?? field.name} is required.`] });
      if (field.type === 'formList') {
        // An active list with required row fields needs at least one complete row.
        if (empty(value) && (required || field.fields?.some(child =>
          (!child.visibleIf || child.visibleIf(values, 0)) &&
          (typeof child.required === 'function' ? child.required(values, 0) : child.required)))) add();
        if (Array.isArray(value)) value.forEach((_, row) => field.fields?.forEach(child => visit(child, [...name, row], row)));
      } else if (required && (empty(value) || (field.type === 'compactfield' &&
        field.subFields?.some(child => empty(value?.[child.name]))))) add();
    };
    tab.fields?.forEach(field => visit(field));
  }
  return missing;
}
