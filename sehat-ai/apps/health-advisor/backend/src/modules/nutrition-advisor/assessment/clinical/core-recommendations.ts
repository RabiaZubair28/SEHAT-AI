import { Finding, NutrientTargets, Recommendation } from '../../models/types';

export function coreRecommendations(findings: Finding[], targets: NutrientTargets | null): Recommendation[] {
  const recs: Recommendation[] = [];
  const find = (id: string) => findings.find((f) => f.id === id);
  if (find('lab:hb')?.status === 'low') {
    recs.push({
      id: 'iron_rich', priority: 1, icon: '🥩', tone: 'red', evidence: ['lab:hb'],
      title: 'Increase iron-rich foods',
      titleUr: 'آئرن سے بھرپور غذا',
      detail: 'Include daals, chana, spinach, eggs, kaleji or lean meat to help improve haemoglobin. Avoid tea within one hour of meals.',
      detailUr: 'دالیں، چنے، پالک، انڈے، کلیجی یا گوشت کھائیں۔ کھانے کے ایک گھنٹے کے اندر چائے نہ پئیں۔',
      basis: 'WHO guideline: daily iron intake in adults; dietary counselling for low Hb',
    });
    recs.push({
      id: 'vitamin_c', priority: 2, icon: '🍊', tone: 'green', evidence: ['lab:hb'],
      title: 'Include vitamin C foods with meals',
      titleUr: 'وٹامن سی شامل کریں',
      detail: 'Eat guava, kinnow, lemon or tomato salad with meals to help the body absorb iron.',
      detailUr: 'کھانے کے ساتھ امرود، کینو، لیموں یا سلاد کھائیں تاکہ آئرن بہتر جذب ہو۔',
      basis: 'Vitamin C enhances non-haem iron absorption (WHO/FAO)',
    });
  }

  const bmi = find('obs:bmi');
  if (bmi?.status === 'high') {
    recs.push({
      id: 'balanced_portions', priority: 3, icon: '🍽️', tone: 'blue', evidence: ['obs:bmi'],
      title: 'Choose balanced portions',
      titleUr: 'متوازن مقدار میں کھائیں',
      detail: `Aim for about ${targets?.kcal ?? '—'} kcal a day: half the plate vegetables, a quarter whole grains, a quarter protein. Limit fried food, sweets and sugary drinks.`,
      detailUr: 'آدھی پلیٹ سبزیاں، چوتھائی اناج اور چوتھائی پروٹین رکھیں۔ تلی ہوئی چیزیں، مٹھائی اور میٹھے مشروبات کم کریں۔',
      basis: 'WHO healthy diet fact sheet; energy deficit of ~500 kcal/day',
    });
  } else if (bmi?.status === 'low') {
    recs.push({
      id: 'energy_dense', priority: 3, icon: '🍽️', tone: 'blue', evidence: ['obs:bmi'],
      title: 'Eat regular, energy-rich meals',
      titleUr: 'باقاعدہ اور توانائی بخش کھانا',
      detail: 'Eat 3 meals and 2 snacks daily. Add milk, eggs, daal, peanuts and an extra roti to increase energy and protein.',
      detailUr: 'روزانہ 3 کھانے اور 2 ہلکے ناشتے کریں۔ دودھ، انڈے، دال، مونگ پھلی اور ایک اضافی روٹی شامل کریں۔',
      basis: 'Energy surplus of ~300 kcal/day for underweight adults',
    });
  } else {
    recs.push({
      id: 'balanced_diet', priority: 4, icon: '🍽️', tone: 'blue', evidence: bmi ? ['obs:bmi'] : [],
      title: 'Keep a balanced diet',
      titleUr: 'متوازن غذا لیں',
      detail: 'Eat grains, vegetables, fruit, daal or protein, and dairy every day in moderate portions.',
      detailUr: 'روزانہ اناج، سبزیاں، پھل، دال یا پروٹین اور دودھ سے بنی چیزیں مناسب مقدار میں کھائیں۔',
      basis: 'WHO healthy diet fact sheet',
    });
  }

  return recs;
}
