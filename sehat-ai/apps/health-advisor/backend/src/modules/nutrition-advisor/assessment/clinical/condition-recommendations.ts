import { Finding, MedicalRestriction, Recommendation } from '../../models/types';

export function conditionRecommendations(findings: Finding[], restrictions: MedicalRestriction[]): Recommendation[] {
  const recs: Recommendation[] = [];
  if (restrictions.includes('low_salt')) {
    recs.push({
      id: 'low_salt', priority: 2, icon: '🧂', tone: 'orange',
      evidence: findings.filter((f) => f.id === 'dx:Hypertension' || f.id === 'obs:bp').map((f) => f.id),
      title: 'Reduce salt',
      titleUr: 'نمک کم کریں',
      detail: 'Use less than one teaspoon of salt a day in total. Avoid pickles (achar), papad, chips and extra salt at the table.',
      detailUr: 'پورے دن میں ایک چائے کے چمچ سے کم نمک استعمال کریں۔ اچار، پاپڑ، چپس اور اوپر سے نمک نہ ڈالیں۔',
      basis: 'WHO sodium intake guideline (< 2 g sodium/day)',
    });
  }
  if (restrictions.includes('diabetic')) {
    recs.push({
      id: 'diabetes_carbs', priority: 2, icon: '🌾', tone: 'orange', evidence: ['dx:Diabetes'],
      title: 'Keep carbohydrates steady',
      titleUr: 'نشاستہ متوازن رکھیں',
      detail: 'Spread whole-grain roti and daal evenly across meals. Avoid sugar, sweets, sugary tea and juices; choose whole fruit instead.',
      detailUr: 'گندم کی روٹی اور دال تمام کھانوں میں برابر تقسیم کریں۔ چینی، مٹھائی، میٹھی چائے اور جوس سے پرہیز کریں؛ پورا پھل کھائیں۔',
      basis: 'Recorded diabetes; consistent-carbohydrate meal pattern',
    });
  }
  if (restrictions.includes('low_fat')) {
    recs.push({
      id: 'low_fat', priority: 3, icon: '🫒', tone: 'orange', evidence: ['dx:Dyslipidemia'],
      title: 'Limit oil and ghee',
      titleUr: 'تیل اور گھی کم کریں',
      detail: 'Cook with less oil, avoid ghee, fried snacks and fatty meat. Prefer grilling and boiling.',
      detailUr: 'کم تیل میں پکائیں، گھی، تلی ہوئی چیزوں اور چربی والے گوشت سے پرہیز کریں۔ گرل یا اُبال کر پکائیں۔',
      basis: 'Recorded dyslipidaemia; saturated fat < 10% energy (WHO)',
    });
  }

  return recs;
}
