import { missingEncounterFields } from '../../frontend/src/utils/required-encounter-fields';

const tabs = [
  { tabKey: '1', title: 'Admission', fields: [{ name: 'admission', required: true }] },
  { tabKey: '2', title: 'Vitals', fields: [
    { name: 'weight', required: true },
    { name: 'height', type: 'compactfield', required: true, subFields: [{ name: 'feet' }, { name: 'inches' }] },
    { name: 'muac', required: true, visibleIf: (v: any) => v.sex === 'Female' },
    { name: 'bp', required: (v: any) => v.age > 14 },
  ] },
  { tabKey: '3', title: 'Supplements', fields: [
    { name: 'supplements_prescribed', required: true },
    { name: 'supplements', type: 'formList', visibleIf: (v: any) => v.supplements_prescribed === true, fields: [
      { name: 'supplementName', required: true }, { name: 'supplementDosage', required: true },
      { name: 'other_supplement', required: true, visibleIf: (v: any, i?: number) => v.supplements?.[i!]?.supplementName === 'Other' },
    ] },
  ] },
  { tabKey: '4', title: 'Counseling', fields: [{ name: 'counsling_status', required: true }, { name: 'notes' }] },
];
const complete = () => ({ admission: 'Self', weight: 70, height: { feet: 5, inches: 0 }, age: 35,
  sex: 'Male', bp: 120, supplements_prescribed: false, counsling_status: false });

describe('all pre-Advisor mandatory fields', () => {
  it('reports every incomplete tab, even without mounted form controls', () => {
    expect(new Set(missingEncounterFields(tabs, {}).map(f => f.tabKey))).toEqual(new Set(['1', '2', '3', '4']));
  });
  it('accepts explicit No answers and zero inches, without requiring optional fields', () => {
    expect(missingEncounterFields(tabs, complete())).toEqual([]);
  });
  it.each(['supplements_prescribed', 'counsling_status'])('blocks an unanswered %s even when admission and vitals are complete', key => {
    const values: any = complete(); delete values[key];
    expect(missingEncounterFields(tabs, values).map(f => f.name)).toEqual([[key]]);
  });
  it('requires a supplement row when Yes is selected', () => {
    expect(missingEncounterFields(tabs, { ...complete(), supplements_prescribed: true }).map(f => f.name)).toEqual([['supplements']]);
  });
  it('reports nested dosage and conditional Other supplement fields', () => {
    const values = { ...complete(), supplements_prescribed: true, supplements: [{ supplementName: 'Other' }] };
    expect(missingEncounterFields(tabs, values).map(f => f.name)).toEqual([
      ['supplements', 0, 'supplementDosage'], ['supplements', 0, 'other_supplement'],
    ]);
  });
  it('honors age and sex conditions', () => {
    expect(missingEncounterFields(tabs, { ...complete(), sex: 'Female', age: 10, bp: undefined }).map(f => f.name)).toEqual([['muac']]);
  });
  it('rejects missing compact height parts', () => {
    expect(missingEncounterFields(tabs, { ...complete(), height: { feet: 5 } }).map(f => f.name)).toEqual([['height']]);
  });
});
