import React from "react";
import { Alert, Button, Popover, Tag, Tooltip } from "antd";
import {
  BarChartOutlined,
  BulbOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  FireOutlined,
  PieChartOutlined,
  ThunderboltOutlined,
  UserOutlined,
  WarningFilled,
} from "@ant-design/icons";
import type { Finding, Overview, SourcedValue } from "../types";
import { formatDate } from "../utils/planUtils";
import { findingIcon, RECOMMENDATION_ICON } from "./visuals";

interface Props {
  overview: Overview;
}

const chipTone = (f: Finding) => {
  if (f.kind === "safety_warning" || f.status === "low" || f.status === "abnormal") return "alert";
  if (f.status === "high" || f.kind === "unavailable" || f.status === "outdated" || f.status === "missing") return "attention";
  if (f.kind === "recorded_diagnosis" || f.status === "info") return "neutral";
  return "ok";
};

const sourceTip = (source?: string, recordedAt?: string | null) =>
  source ? `${source}${recordedAt ? ` · ${formatDate(recordedAt)}` : ""}` : undefined;

export const CardTitle: React.FC<{ icon: React.ReactNode; title: string; extra?: React.ReactNode }> = ({ icon, title, extra }) => (
  <div className="na-card-title">
    <span className="na-icon">{icon}</span>
    <span style={{ flex: 1 }}>{title}</span>
    {extra}
  </div>
);

const AdvisorOverview: React.FC<Props> = ({ overview }) => {
  const { measurements: m, effective, targets, dataQuality, eligibility, patient, preferences } = overview;
  const issue = (field: string) => dataQuality.some((i) => i.field === field);

  const val = (field: string, key: string, digits = 0) => {
    const v = m[key] as SourcedValue | undefined;
    if (!v || v.value == null) return <span className="v na-muted">Not recorded</span>;
    return (
      <Tooltip title={sourceTip(v.source, v.recordedAt)}>
        <span className={issue(field) ? "v issue" : "v"}>
          {issue(field) && <WarningFilled style={{ marginRight: 4 }} />}
          {typeof v.value === "number" ? Number(v.value).toFixed(digits) : String(v.value)} {v.unit ?? ""}
          {v.isOutdated && <Tag color="orange" style={{ marginLeft: 6, marginRight: 0 }}>Outdated</Tag>}
        </span>
      </Tooltip>
    );
  };

  const corrected = (key: "weightKg" | "heightCm", unit: string) =>
    preferences.measurementCorrections?.[key] ? (
      <span className="v">
        {effective[key]} {unit} <Tag color="green" style={{ marginRight: 0 }}>Corrected</Tag>
      </span>
    ) : null;

  const bmiCategory = overview.findings.find((f) => f.id === "obs:bmi")?.value?.match(/\((.*)\)/)?.[1];

  const methodsContent = (
    <div style={{ maxWidth: 420 }}>
      {(targets?.methods ?? []).map((mt) => (
        <div key={mt.nutrient} style={{ fontSize: 12, marginBottom: 6 }}>
          <b>{mt.nutrient}:</b> {mt.method}
        </div>
      ))}
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>Calculated with approved clinical formulas, not by the AI model.</div>
    </div>
  );

  const tile = (icon: React.ReactNode, label: string, value: string) => (
    <div className="na-tile">
      <span className="na-icon round">{icon}</span>
      <div>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
        <div className="sub">per day</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {eligibility.status === "needs_data" && (
        <Alert
          type="warning"
          showIcon
          message="Please correct these measurements before a plan is recommended"
          description={eligibility.reasons.join(" ")}
        />
      )}
      {eligibility.status === "eligible" && dataQuality.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Some recorded values look inconsistent — please re-check them"
          description={dataQuality.map((i) => `${i.label} (${i.value}): ${i.message}`).join(" · ")}
        />
      )}

      <div className="na-grid-2">
        {/* ---------------- Patient Summary ---------------- */}
        <div className="na-card">
          <CardTitle icon={<UserOutlined />} title="Patient Summary" />
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div className="na-kv">
              <div className="na-kv-row"><span className="k">Age</span><span className="v">{patient.ageYears} years</span></div>
              <div className="na-kv-row"><span className="k">Gender</span><span className="v">{patient.sex}</span></div>
              <div className="na-kv-row"><span className="k">Weight</span>{corrected("weightKg", "kg") ?? val("weight", "weightKg", 1)}</div>
              <div className="na-kv-row"><span className="k">Height</span>{corrected("heightCm", "cm") ?? val("height", "heightCm", 0)}</div>
              <div className="na-kv-row">
                <span className="k">BMI</span>
                <span className="v">{effective.bmi != null ? `${effective.bmi}${bmiCategory ? ` (${bmiCategory})` : ""}` : "—"}</span>
              </div>
            </div>
            <div className="na-kv">
              <div className="na-kv-row">
                <span className="k">BP</span>
                {m.systolicBp?.value != null ? (
                  <Tooltip title={sourceTip(m.systolicBp.source, m.systolicBp.recordedAt)}>
                    <span className={issue("bp") ? "v issue" : "v"}>
                      {issue("bp") && <WarningFilled style={{ marginRight: 4 }} />}
                      {m.systolicBp.value} / {m.diastolicBp?.value ?? "—"} mmHg
                    </span>
                  </Tooltip>
                ) : (
                  <span className="v na-muted">Not recorded</span>
                )}
              </div>
              <div className="na-kv-row"><span className="k">Pulse</span>{val("pulse", "pulse")}</div>
              <div className="na-kv-row"><span className="k">Temperature</span>{val("temperature", "temperatureF", 1)}</div>
              <div className="na-kv-row"><span className="k">MUAC</span>{val("muac", "muacCm", 1)}</div>
              <div className="na-kv-row">
                <span className="k">Edema</span>
                <span className="v">{m.edema?.value ? (m.edema.value === "No edema" ? "No" : m.edema.value) : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Daily Nutritional Targets ---------------- */}
        <div className="na-card">
          <CardTitle
            icon={<BarChartOutlined />}
            title="Daily Nutritional Targets"
            extra={
              targets && (
                <Popover content={methodsContent} title="How targets are calculated" trigger="click">
                  <Button
                    type="link"
                    size="small"
                    style={{ color: "var(--green-700, #0a5d34)" }}
                    aria-label="View how nutritional targets are calculated"
                    title="View calculation methods"
                  />
                </Popover>
              )
            }
          />
          {targets ? (
            <>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {tile(<FireOutlined />, "Calories", `${targets.kcal.toLocaleString()} kcal`)}
                {tile(<ThunderboltOutlined />, "Protein", `${targets.protein} g`)}
                {tile(<PieChartOutlined />, "Carbohydrates", `${targets.carbs} g`)}
                {tile(<DashboardOutlined />, "Fats", `${targets.fat} g`)}
              </div>
              <div className="na-muted" style={{ fontSize: 13, marginTop: 12 }}>
                Fibre ≥ {targets.fiber} g · Iron {targets.iron} mg · Sodium &lt; {targets.sodiumMax.toLocaleString()} mg · Water {targets.waterLitres} L
              </div>
            </>
          ) : (
            <div className="na-muted">
              {eligibility.status === "held" && overview.patient.ageYears < 18
                ? "Adult target formulas do not apply to children; the doctor sets this patient's targets."
                : "Targets will appear once weight and height are valid."}
            </div>
          )}
        </div>

        {/* ---------------- Clinical Findings & Evidence ---------------- */}
        <div className="na-card">
          <CardTitle icon={<FileSearchOutlined />} title="Clinical Findings & Evidence" />
          {overview.findings.length === 0 && <div className="na-muted">No findings recorded.</div>}
          {overview.findings.map((f) => (
            <div key={f.id} className="na-row na-finding-row">
              <span className="na-finding-icon">{findingIcon(f.id, f.kind)}</span>
              <Tooltip title={sourceTip(f.source, f.recordedAt)}>
                <div style={{ minWidth: 0 }}>
                  <div className="na-muted" style={{ fontSize: 13 }}>{f.label}</div>
                  {f.value && <div style={{ fontWeight: 600 }}>{f.value}</div>}
                </div>
              </Tooltip>
              <div className={`na-chip ${chipTone(f)}`}>{f.interpretation}</div>
            </div>
          ))}
        </div>

        {/* ---------------- Nutrition Recommendations ---------------- */}
        <div className="na-card">
          <CardTitle icon={<BulbOutlined />} title="Nutrition Recommendations" />
          {overview.recommendations.length === 0 ? (
            <div className="na-muted">No automated recommendations — this patient is held for professional assessment.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {overview.recommendations.map((r) => {
                const evidence = r.evidence
                  .map((id) => overview.findings.find((f) => f.id === id))
                  .filter(Boolean)
                  .map((f) => `${f!.label}${f!.value ? ` ${f!.value}` : ""}`);
                return (
                  <Tooltip key={r.id} placement="left" title={`${evidence.length ? `Based on ${evidence.join(", ")}. ` : ""}${r.basis}`}>
                  <div className="na-rec">
                    <span className="na-icon na-rec-icon">{RECOMMENDATION_ICON[r.id] ?? <BulbOutlined />}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="title">{r.title}</div>
                      <div className="detail">{r.detail}</div>
                    </div>
                  </div>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisorOverview;
