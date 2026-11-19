import { forwardRef } from "react";
import {
  CalendarOutlined,
  CoffeeOutlined,
  IdcardOutlined,
  MedicineBoxOutlined,
  ScheduleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import logo from "@/assets/layout/small_logo.png";
import type { FoodItem, FoodLibrary, Handout, PlanContent, PlanRecord } from "../types";
import { formatDate, formatPortion, formatPortionUr } from "../utils/planUtils";
import { FoodImage } from "./visuals";

export interface HandoutProps {
  record: PlanRecord;
  plan: PlanContent;
  handout: Handout;
  library: FoodLibrary;
  patient: { name: string; mrNo: string; ageYears: number; sex: string };
  language: "en" | "ur";
  includeImages: boolean;
}

const T = {
  en: {
    org: "SINDH ELECTRONIC MEDICAL RECORD",
    tagline: "A suitable diet plan for a healthy tomorrow",
    title: "My Nutrition Plan",
    subtitle: "An easy and balanced diet plan for your better health",
    name: "Name",
    age: "Age",
    mr: "MR #",
    date: "Date",
    years: "years",
    week: "My daily meal plan",
    day: "Day",
    advice: "Important advice for better health",
    water: "Drink water",
    waterText: (l: number) => `About ${Math.round((l * 1000) / 250)} glasses (${l} litres) of clean water daily.`,
    activity: "Physical activity",
    notes: "Notes",
  },
  ur: {
    org: "SINDH ELECTRONIC MEDICAL RECORD",
    tagline: "صحت مند کل کے لیے مناسب غذا منصوبہ",
    title: "میرا غذائی منصوبہ",
    subtitle: "آپ کی بہتر صحت کے لیے ایک آسان اور متوازن غذا کا منصوبہ",
    name: "نام",
    age: "عمر",
    mr: "ایم آر نمبر",
    date: "تاریخ",
    years: "سال",
    week: "میرا یومیہ کھانے کا منصوبہ",
    day: "دن",
    advice: "بہتر صحت کے لیے اہم ہدایات",
    water: "پانی کا استعمال",
    waterText: (l: number) => `روزانہ تقریباً ${Math.round((l * 1000) / 250)} گلاس صاف پانی پئیں۔`,
    activity: "جسمانی سرگرمی",
    notes: "ہدایات",
  },
};

/** 12-hour clock: "7:00 AM" in English, "صبح 7:00" (morning/afternoon/evening/night) in Urdu. */
const mealTime = (time: string, ur: boolean) => {
  const [h, min = 0] = (time ?? "").split(":").map(Number);
  if (!Number.isFinite(h)) return time;
  const clock = `${h % 12 || 12}:${String(min).padStart(2, "0")}`;
  if (!ur) return `${clock} ${h < 12 ? "AM" : "PM"}`;
  const part = h >= 4 && h < 12 ? "صبح" : h < 16 && h >= 12 ? "دوپہر" : h >= 16 && h < 19 ? "شام" : "رات";
  return `${part} ${clock}`;
};

const PatientHandout = forwardRef<HTMLDivElement, HandoutProps>(
  ({ record, plan, handout, library, patient, language, includeImages }, ref) => {
    const t = T[language];
    const ur = language === "ur";
    const foods: Record<string, FoodItem> = Object.fromEntries(library.foods.map((f) => [f.id, f]));
    const targets = record.context.targets;
    const recs = record.context.recommendations.filter((r) => r.id !== "hydration" && r.id !== "activity");

    // Keep the header with the first three days and use the remaining page for four.
    const dayNumbers = plan.days.map((_, index) => index + 1);
    const pages: number[][] = [dayNumbers.slice(0, 3), dayNumbers.slice(3)];

    const Footer = ({ page }: { page: number }) => (
      <div className="na-handout-footer">
        <span />
        <span style={{ direction: "ltr" }}>{page} / {pages.length}</span>
      </div>
    );

    const dayRow = (dayNo: number) => {
      const day = plan.days[dayNo - 1];
      return (
        <div className="na-handout-day" key={dayNo}>
          <span className="na-handout-day-label">
            {t.day} {dayNo}
          </span>
          <div className="na-handout-meals">
            {day.meals.map((m) => {
              const slot = library.mealSlots.find((s) => s.slot === m.slot)!;
              const items = m.items.map((i) => ({ food: foods[i.foodId], portions: i.portions })).filter((i) => i.food);
              return (
                <div className="na-handout-meal" key={m.slot}>
                  <div className="name">{ur ? slot.labelUr : slot.label}</div>
                  <div className="time">{mealTime(m.time, ur)}</div>
                  {includeImages && (
                    <div className="imgs">
                      {items.slice(0, 3).map(({ food }) => (
                        <FoodImage key={food.id} food={food} size={54} />
                      ))}
                    </div>
                  )}
                  <div>
                    {items.map(({ food, portions }, idx) => (
                      <span key={food.id}>
                        {ur ? food.nameUr : food.name}{" "}
                        <span style={{ color: "#6b7280" }}>({ur ? formatPortionUr(food, portions) : formatPortion(food, portions)})</span>
                        {idx < items.length - 1 ? (ur ? "، " : ", ") : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const tips = (
      <>
        <div className="na-handout-section" style={{ marginTop: 12 }}>
          <MedicineBoxOutlined /> {t.advice}
        </div>
        <div className="na-handout-tips">
          {/* Each tip shows only when it has text in the chosen language. */}
          {recs.filter((r) => (ur ? r.titleUr : r.title)?.trim() && (ur ? r.detailUr : r.detail)?.trim()).map((r) => (
            <div className="na-handout-tip" key={r.id}>
              <div className="t">{ur ? r.titleUr : r.title}</div>
              <div>{ur ? r.detailUr : r.detail}</div>
            </div>
          ))}
          <div className="na-handout-tip">
            <div className="t">{t.water}</div>
            <div>{targets ? t.waterText(targets.waterLitres) : ur ? "دن بھر باقاعدگی سے صاف پانی پئیں۔" : "Drink clean water regularly through the day."}</div>
          </div>
          {(ur ? handout.activityGuidanceUr : handout.activityGuidance)?.trim() && (
            <div className="na-handout-tip">
              <div className="t">{t.activity}</div>
              <div>{ur ? handout.activityGuidanceUr : handout.activityGuidance}</div>
            </div>
          )}
          {(ur ? handout.patientNotesUr : handout.patientNotes)?.trim() && (
            <div className="na-handout-tip">
              <div className="t">{t.notes}</div>
              <div>{ur ? handout.patientNotesUr : handout.patientNotes}</div>
            </div>
          )}
        </div>
      </>
    );

    return (
      <div ref={ref} lang={ur ? "ur" : "en"}>
        {pages.map((days, idx) => (
          <div key={idx} className={`na-handout-page ${ur ? "rtl" : ""}`}>
            {idx === 0 && (
              <>
                <div className="flex items-start justify-between" style={{ gap: 16 }}>
                  <div className="flex items-center" style={{ gap: 10, direction: "ltr" }}>
                    <img src={logo} alt="" style={{ height: 52 }} />
                    <div style={{ fontWeight: 800, color: "#064526", fontSize: 14, lineHeight: 1.25, fontFamily: "Inter, Arial, sans-serif" }}>
                      SINDH ELECTRONIC
                      <br />
                      MEDICAL RECORD
                    </div>
                  </div>
                  <div style={{ color: "#064526", fontSize: 13, maxWidth: 220, textAlign: ur ? "left" : "right" }}>{t.tagline}</div>
                </div>
                <h1 style={{ textAlign: "center", color: "#064526", fontSize: ur ? 32 : 28, margin: "10px 0 2px", fontWeight: 800 }}>{t.title}</h1>
                <div style={{ textAlign: "center", color: "#374151", fontSize: 14 }}>{t.subtitle}</div>
                <div className="na-handout-strip">
                  {[
                    { icon: <UserOutlined />, l: t.name, v: patient.name },
                    { icon: <IdcardOutlined />, l: t.mr, v: patient.mrNo, ltr: true },
                    { icon: <ScheduleOutlined />, l: t.age, v: `${patient.ageYears} ${t.years}` },
                    { icon: <CalendarOutlined />, l: t.date, v: formatDate(record.reviewedAt ?? record.updatedAt), ltr: true },
                  ].map((c) => (
                    <div key={c.l}>
                      <span style={{ color: "#064526", fontSize: 18 }}>{c.icon}</span>
                      <div>
                        <div className="l">{c.l}</div>
                        <b style={c.ltr ? { direction: "ltr", display: "inline-block" } : undefined}>{c.v}</b>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="na-handout-section">
                  <CoffeeOutlined /> {t.week}
                </div>
              </>
            )}
            {days.map(dayRow)}
            {idx === pages.length - 1 && tips}
            <Footer page={idx + 1} />
          </div>
        ))}
      </div>
    );
  },
);

export default PatientHandout;
