import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Dropdown,
  Input,
  Modal,
  Popover,
  Select,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CoffeeOutlined,
  ExperimentOutlined,
  FireOutlined,
  PieChartOutlined,
  PlusOutlined,
  RightOutlined,
  RiseOutlined,
  ScheduleOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { FoodItem, FoodLibrary, Handout, MealSlot, PlanContent, PlanResponse } from "../types";
import { MAX_PORTION, MIN_PORTION, clonePlan, exclusionReason, suggestSubstitutes, validatePlan } from "../utils/planUtils";
import { CardTitle } from "./AdvisorOverview";
import { FoodImage, SLOT_ICON } from "./visuals";

interface Props {
  response: PlanResponse;
  library: FoodLibrary;
  saving: boolean;
  onSave: (changes: { plan?: PlanContent; handout?: Partial<Handout> }) => Promise<PlanResponse | null>;
  onSubmit: () => Promise<PlanResponse | null>;
  submitting: boolean;
}

const LIBRARY_CATEGORIES = [
  { value: "all", label: "All foods" },
  { value: "grain", label: "Grains" },
  { value: "poultry", label: "Poultry" },
  { value: "meat_fish", label: "Meat & fish" },
  { value: "eggs", label: "Eggs" },
  { value: "legume", label: "Legumes" },
  { value: "vegetable", label: "Vegetables" },
  { value: "fruit", label: "Fruits" },
  { value: "nuts", label: "Nuts" },
  { value: "dairy", label: "Dairy" },
  { value: "beverage", label: "Beverages" },
];

const matchesLibraryCategory = (food: FoodItem, category: string) => {
  if (category === "all") return true;
  if (category === "poultry") return food.id.includes("chicken");
  if (category === "meat_fish") return (food.containsMeat === true && !food.id.includes("chicken")) || food.containsFish === true;
  if (category === "eggs") return food.id === "boiled_egg" || food.id === "omelette";
  return food.group === category;
};

const MealPlanEditor: React.FC<Props> = ({ response, library, saving, onSave, onSubmit, submitting }) => {
  const record = response.plan!;
  const foodsById = useMemo(() => Object.fromEntries(library.foods.map((f) => [f.id, f])), [library.foods]);
  const [plan, setPlan] = useState<PlanContent>(() => clonePlan(record.content));
  const [handout, setHandout] = useState<Handout>(record.handout);
  const [day, setDay] = useState(1);
  const [search, setSearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState("all");
  const [dropSlot, setDropSlot] = useState<MealSlot | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const revision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const canEdit = unlocked;
  const restrictions = record.context.restrictions ?? [];
  const prefs = record.preferences;
  const targets = record.context.targets;

  // Adopt a new server version (e.g. after regeneration) when there are no pending edits.
  useEffect(() => {
    if (!dirty) {
      setPlan(clonePlan(record.content));
      setHandout(record.handout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id, record.contentHash]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const { totals, warnings } = useMemo(
    () => validatePlan(plan, foodsById, targets, prefs, restrictions),
    [plan, foodsById, targets, prefs, restrictions],
  );
  const dayTotal = totals[day - 1];
  const dayWarnings = warnings.filter((w) => w.day === day && w.severity !== "info");

  const save = async (nextPlan: PlanContent, nextHandout: Handout) => {
    const rev = revision.current;
    const res = await onSave({ plan: nextPlan, handout: nextHandout });
    if (res && rev === revision.current) setDirty(false);
  };

  const scheduleSave = (nextPlan: PlanContent, nextHandout: Handout) => {
    revision.current += 1;
    setDirty(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(nextPlan, nextHandout), 1500);
  };

  const updatePlan = (mutate: (draft: PlanContent) => void) => {
    if (!canEdit) return;
    const next = clonePlan(plan);
    mutate(next);
    setPlan(next);
    scheduleSave(next, handout);
  };

  const updateHandout = (patch: Partial<Handout>) => {
    if (!canEdit) return;
    const next = { ...handout, ...patch };
    setHandout(next);
    scheduleSave(plan, next);
  };

  const meal = (draft: PlanContent, slot: MealSlot) => draft.days[day - 1].meals.find((m) => m.slot === slot)!;

  const addFood = (slot: MealSlot, foodId: string) =>
    updatePlan((d) => {
      const m = meal(d, slot);
      const existing = m.items.find((i) => i.foodId === foodId);
      if (existing) existing.portions = Math.min(MAX_PORTION, existing.portions + 1);
      else m.items.push({ foodId, portions: 1 });
    });

  const changePortion = (slot: MealSlot, foodId: string, delta: number) =>
    updatePlan((d) => {
      const item = meal(d, slot).items.find((i) => i.foodId === foodId)!;
      item.portions = Math.min(MAX_PORTION, Math.max(MIN_PORTION, item.portions + delta));
    });

  const removeFood = (slot: MealSlot, foodId: string) =>
    updatePlan((d) => {
      const m = meal(d, slot);
      m.items = m.items.filter((i) => i.foodId !== foodId);
    });

  const swapFood = (slot: MealSlot, fromId: string, toId: string) =>
    updatePlan((d) => {
      const m = meal(d, slot);
      const item = m.items.find((i) => i.foodId === fromId)!;
      if (m.items.some((i) => i.foodId === toId)) m.items = m.items.filter((i) => i.foodId !== fromId);
      else item.foodId = toId;
    });

  const unlock = () => {
    setUnlocked(true);
  };

  // Foods this patient must not have are hidden from the library (allergies, restrictions).
  const safeFoods = library.foods.filter((f) => !exclusionReason(f, prefs, restrictions));
  const hiddenCount = library.foods.length - safeFoods.length;
  const libraryFoods = safeFoods.filter(
    (f) => matchesLibraryCategory(f, libraryCategory) && (!search || f.name.toLowerCase().includes(search.toLowerCase()) || f.nameUr.includes(search)),
  );

  const addFoodMenu = (slot: MealSlot) => (
    <div style={{ width: 290, maxHeight: 340, overflow: "auto" }}>
      {safeFoods
        .filter((f) => f.slots.includes(slot))
        .map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => addFood(slot, f.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-[var(--green-50)]"
          >
            <FoodImage food={f} size={40} />
            <span style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>{f.name}</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>
                {f.serving} · {f.nutrients.kcal} kcal
              </div>
            </span>
          </button>
        ))}
    </div>
  );

  const stat = (icon: React.ReactNode, label: string, value: string | number, unit: string, off = false) => (
    <div className="na-stat">
      <div className="i">{icon}</div>
      <div className="l">{label}</div>
      <div className={`v ${off ? "off" : ""}`}>{value}</div>
      <div className="t">{unit}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {record.status === "changes_requested" && record.reviewComment && (
        <Alert type="warning" showIcon message={`Changes requested by ${record.reviewedBy ?? "reviewer"}`} description={record.reviewComment} />
      )}
      {response.generationNote && <Alert type="info" showIcon closable message={response.generationNote} />}

      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 340px)" }}>
        {/* ---------------- Meal plan ---------------- */}
        <div className="na-card">
          <CardTitle
            icon={<ScheduleOutlined />}
            title="Personalized Meal Plan"
            extra={
              <div className="flex items-center gap-2">
                <Select
                  value={day}
                  onChange={setDay}
                  style={{ width: 130 }}
                  suffixIcon={null}
                  options={plan.days.map((d) => ({
                    value: d.day,
                    label: (
                      <span>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        Day {d.day}
                        {warnings.some((w) => w.day === d.day && w.severity === "error") && (
                          <span style={{ color: "#b42318", marginLeft: 6 }}>•</span>
                        )}
                      </span>
                    ),
                  }))}
                />
                {!canEdit && record.status !== "superseded" && (
                  <Button onClick={unlock}>Edit</Button>
                )}
              </div>
            }
          />

          <div className="flex flex-col gap-3">
            {plan.days[day - 1].meals.map((m) => {
              const slotInfo = library.mealSlots.find((s) => s.slot === m.slot)!;
              return (
                <div
                  key={m.slot}
                  className={`na-meal-row ${dropSlot === m.slot ? "drop-target" : ""}`}
                  onDragOver={(e) => {
                    if (!canEdit) return;
                    e.preventDefault();
                    setDropSlot(m.slot);
                  }}
                  onDragLeave={() => setDropSlot(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropSlot(null);
                    const food = foodsById[e.dataTransfer.getData("text/food-id")];
                    if (food && food.slots.includes(m.slot) && !exclusionReason(food, prefs, restrictions)) addFood(m.slot, food.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: "var(--green-700)", fontSize: 20 }}>{SLOT_ICON[m.slot]}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{slotInfo.label}</div>
                      <div className="na-muted" style={{ fontSize: 12 }}>{dayjs(`2000-01-01T${m.time}`).format("h:mm A")}</div>
                    </div>
                  </div>
                  <div className="na-meal-foods flex flex-nowrap gap-2">
                    {m.items.map((item) => {
                      const f: FoodItem | undefined = foodsById[item.foodId];
                      if (!f) return null;
                      const reason = exclusionReason(f, prefs, restrictions);
                      const subs = suggestSubstitutes(f.id, m.slot, library.foods, prefs, restrictions);
                      return (
                        <div key={item.foodId} className={`na-food-card ${reason ? "error" : ""}`}>
                          <FoodImage food={f} size={100} />
                          <div className="na-food-card-info">
                            <div className="na-food-card-name">{f.name}</div>
                            <div className="na-muted na-food-card-serving">{f.serving}</div>
                            {reason && <div style={{ fontSize: 11, color: "#b42318" }}>{reason}</div>}
                            <div className="na-stepper">
                              <button type="button" disabled={!canEdit || item.portions <= MIN_PORTION} onClick={() => changePortion(m.slot, f.id, -0.5)} aria-label={`Decrease ${f.name}`}>
                                −
                              </button>
                              <span>{item.portions}</span>
                              <button type="button" disabled={!canEdit || item.portions >= MAX_PORTION} onClick={() => changePortion(m.slot, f.id, 0.5)} aria-label={`Increase ${f.name}`}>
                                +
                              </button>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="actions">
                              <Dropdown
                                trigger={["click"]}
                                menu={{
                                  items: subs.length
                                    ? subs.map((s) => ({ key: s.id, label: `${s.name} (${s.nutrients.kcal} kcal)` }))
                                    : [{ key: "none", label: "No safe substitutes", disabled: true }],
                                  onClick: ({ key }) => swapFood(m.slot, f.id, key),
                                }}
                              >
                                <Button size="small" type="link" aria-label={`Swap ${f.name}`}>Swap</Button>
                              </Dropdown>
                              <Button size="small" type="link" danger onClick={() => removeFood(m.slot, f.id)} aria-label={`Remove ${f.name}`}>Remove</Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {canEdit && (
                      <Popover trigger="click" content={addFoodMenu(m.slot)} title={`Add to ${slotInfo.label}`}>
                        <button type="button" className="na-add-tile" aria-label={`Add food to ${slotInfo.label}`}>
                          <PlusOutlined style={{ fontSize: 17 }} />
                        </button>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------- Right column ---------------- */}
        <div className="flex flex-col gap-4">
          <div className="na-card">
            <CardTitle icon={<AppstoreOutlined />} title="Food Library" />
            <Input prefix={<SearchOutlined />} placeholder="Search food items..." value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
            <div className="na-category-scroll" role="tablist" aria-label="Filter food library by category">
              {LIBRARY_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  role="tab"
                  aria-selected={libraryCategory === category.value}
                  className={`na-category-pill ${libraryCategory === category.value ? "active" : ""}`}
                  onClick={() => setLibraryCategory(category.value)}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", maxHeight: 340, overflow: "auto" }}>
              {libraryFoods.map((f) => {
                const slots = library.mealSlots.filter((s) => f.slots.includes(s.slot));
                return (
                  <Tooltip key={f.id} title={`${f.serving} · ${f.nutrients.kcal} kcal · ${f.nutrients.protein} g protein`}>
                    <div className="na-lib-card" draggable={canEdit} onDragStart={(e) => e.dataTransfer.setData("text/food-id", f.id)}>
                      <FoodImage food={f} size={94} className="mx-auto" />
                      <div className="name">{f.name}</div>
                      <Dropdown
                        disabled={!canEdit}
                        trigger={["click"]}
                        menu={{
                          items: slots.map((s) => ({ key: s.slot, label: `Day ${day} · ${s.label}` })),
                          onClick: ({ key }) => addFood(key as MealSlot, f.id),
                        }}
                      >
                        <Button
                          size="small"
                          type="primary"
                          shape="circle"
                          disabled={!canEdit}
                          aria-label={`Add ${f.name} to a meal`}
                        />
                      </Dropdown>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
            {hiddenCount > 0 && (
              <div className="na-muted" style={{ fontSize: 12, marginTop: 8 }}>
                {hiddenCount} foods hidden because of this patient's allergies, diet or restrictions.
              </div>
            )}
          </div>

          <div className="na-card">
            <CardTitle icon={<BarChartOutlined />} title={`Nutrition Summary (Day ${day})`} />
            {dayTotal && (
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
                {stat(<FireOutlined />, "Calories", dayTotal.kcal.toLocaleString(), "kcal", !!targets && Math.abs(dayTotal.kcal / targets.kcal - 1) > 0.15)}
                {stat(<ThunderboltOutlined />, "Protein", dayTotal.protein, "g", !!targets && dayTotal.protein < targets.protein * 0.85)}
                {stat(<ExperimentOutlined />, "Iron", dayTotal.iron, "mg")}
                {stat(<PieChartOutlined />, "Fiber", dayTotal.fiber, "g")}
                {targets && stat(<CoffeeOutlined />, "Water", targets.waterLitres, "L")}
              </div>
            )}
            <div className="mt-3 flex flex-col gap-1" style={{ fontSize: 12 }}>
              {!targets && <span className="na-muted">Food totals are shown for review. Individual nutrient and fluid targets have not been established.</span>}
              {dayWarnings.length === 0 && targets ? (
                <span style={{ color: "var(--green-700)" }}>
                  <CheckCircleOutlined /> Within targets ({targets.kcal} kcal, {targets.protein} g protein)
                </span>
              ) : (
                dayWarnings.map((w, i) => (
                  <span key={i} style={{ color: w.severity === "error" ? "#b42318" : "#b54708" }}>
                    • {w.message.replace(/^Day \d+: /, "")}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="na-card">
            <CardTitle icon={<RiseOutlined />} title="Physical Activity Guidance" />
            <div className="na-activity-row" onClick={() => setActivityOpen(true)} role="button" tabIndex={0}>
              {/* <RiseOutlined style={{ color: "var(--green-700)", fontSize: 18 }} /> */}
              <span style={{ flex: 1 }}>{handout.activityGuidance}</span>
              <RightOutlined style={{ color: "#6b7280" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end" style={{ padding: "10px 0" }}>
        <Button
          type="primary"
          loading={saving || submitting}
          onClick={async () => {
            clearTimeout(timer.current);
            if (dirty) {
              const saved = await onSave({ plan, handout });
              if (!saved) return;
              setDirty(false);
            }
            await onSubmit();
          }}
        >
          Submit for Review
        </Button>
      </div>

      <Modal title="Physical activity guidance" open={activityOpen} onCancel={() => setActivityOpen(false)} footer={<Button type="primary" onClick={() => setActivityOpen(false)}>Done</Button>}>
        <div className="na-muted" style={{ fontSize: 12, marginBottom: 6 }}>English</div>
        <Input.TextArea rows={3} maxLength={600} value={handout.activityGuidance} disabled={!canEdit} onChange={(e) => updateHandout({ activityGuidance: e.target.value })} />
        <div className="na-muted" style={{ fontSize: 12, margin: "12px 0 6px" }}>Urdu</div>
        <Input.TextArea rows={3} dir="rtl" maxLength={600} value={handout.activityGuidanceUr} disabled={!canEdit} className="na-urdu" onChange={(e) => updateHandout({ activityGuidanceUr: e.target.value })} />
      </Modal>

    </div>
  );
};

export default MealPlanEditor;
