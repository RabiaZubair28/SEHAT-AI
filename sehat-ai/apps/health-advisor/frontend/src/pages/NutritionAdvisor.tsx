import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Result, Segmented, Spin } from "antd";
import { RootState } from "@/redux/store";
import { useGlobalNotification } from "@/hooks/useNotification";
import { ServiceType } from "@/features/patient-journey/data/constants";
import {
  nutritionAdvisorApi,
  useGenerateAdvisorPlanMutation,
  useGetAdvisorFoodsQuery,
  useGetAdvisorOverviewQuery,
  useGetCurrentAdvisorPlanQuery,
  useSubmitAdvisorPlanMutation,
  useUpdateAdvisorPlanMutation,
} from "@/features/patient-journey/services/nutritionAdvisorApi";
import AdvisorOverview from "../components/AdvisorOverview";
import PatientDetailsForm from "../components/PatientDetailsForm";
import MealPlanEditor from "../components/MealPlanEditor";
import ReviewAndShare from "../components/ReviewAndShare";
import { ensureUrduFont } from "../services/handoutPdf";
import type { Handout, PlanContent, PlanResponse, Preferences } from "../types";
import "../styles/advisor.css";

type View = "details" | "overview" | "plan" | "share";
const REVIEW_ROUTE = "/nutrition-advisor/plans/:plan_id/review";

const errorText = (e: any) => {
  const msg = e?.data?.message;
  const reasons: string[] = e?.data?.reasons ?? [];
  return [Array.isArray(msg) ? msg.join(", ") : msg ?? "Something went wrong. Please try again.", ...reasons].join(" ");
};

/**
 * AI Nutrition Advisor tab. Works on the patient's existing Nutrition
 * encounter; it never creates or replaces the enrolment or other tabs (NA-02).
 */
interface NutritionAdvisorProps {
  /** Open a specific encounter (reviewer queue); defaults to the patient in context. */
  appointmentServiceId?: number;
  initialView?: View;
  beforeGenerate?: () => Promise<boolean>;
  getNutritionInput?: () => unknown;
  onFinalize?: () => Promise<boolean>;
}

const NutritionAdvisor: React.FC<NutritionAdvisorProps> = ({ appointmentServiceId: explicitId, initialView = "details", beforeGenerate, getNutritionInput, onFinalize }) => {
  const dispatch = useDispatch();
  const showNotification = useGlobalNotification();
  const selectedPatientData = useSelector((s: RootState) => s.patientRecords.selectedPatientData);
  const permissions = useSelector((s: RootState) => s.authUser?.userPermissions?.payload ?? []);

  const appointmentServiceId = useMemo(
    () =>
      explicitId ??
      selectedPatientData?.appointmentServices?.find((s: any) => s.service?.name === ServiceType.NUTRITION)?.id as
        | number
        | undefined,
    [explicitId, selectedPatientData?.appointmentServices],
  );
  const canReview = permissions.some((p: any) => p.route === REVIEW_ROUTE && p.method === "POST");

  const [view, setView] = useState<View>(initialView);
  const [lockedClicked, setLockedClicked] = useState(false);
  const [draftPreferences, setDraftPreferences] = useState<Preferences | null>(null);
  const [detailsSavedForSession, setDetailsSavedForSession] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const generationInFlight = useRef(false);
  const generatedNutritionInput = useRef<string | null>(null);
  const generationSequence = useRef(0);
  useEffect(() => {
    generationSequence.current++;
    setView(initialView);
    setDraftPreferences(null);
    setDetailsSavedForSession(false);
    setGenerationError(null);
    return () => { generationSequence.current++; };
  }, [appointmentServiceId, initialView]);

  const skip = !appointmentServiceId;
  const foods = useGetAdvisorFoodsQuery(undefined, { skip, refetchOnMountOrArgChange: true });
  // Read the Nutrition form once per visit to this tab, so the summary shows
  // the vitals just entered even before the record is saved.
  const overviewInput = useMemo(() => getNutritionInput?.(), [appointmentServiceId]); // eslint-disable-line react-hooks/exhaustive-deps
  const overview = useGetAdvisorOverviewQuery({ appointmentServiceId: appointmentServiceId!, nutritionInput: overviewInput }, { skip });
  const current = useGetCurrentAdvisorPlanQuery(appointmentServiceId!, { skip });
  const [generate, { isLoading: generating }] = useGenerateAdvisorPlanMutation();
  const [updatePlan, { isLoading: saving }] = useUpdateAdvisorPlanMutation();
  const [submitPlan, { isLoading: submitting }] = useSubmitAdvisorPlanMutation();

  useEffect(() => ensureUrduFont(), []);

  const planResp = current.currentData?.plan?.context.generation ? current.currentData : null;
  const record = planResp?.plan ?? null;

  const putCurrent = (res: PlanResponse) =>
    dispatch(nutritionAdvisorApi.util.upsertQueryData("getCurrentAdvisorPlan", appointmentServiceId!, res) as any);

  const handleGenerate = async (preferences: Preferences) => {
    if (generationInFlight.current) return;
    generationInFlight.current = true;
    setPreparing(true);
    const sequence = ++generationSequence.current;
    setGenerationError(null);
    try {
      if (beforeGenerate && !(await beforeGenerate())) return;
      if (sequence !== generationSequence.current) return;
      setPreparing(false);
      const nutritionInput = getNutritionInput?.();
      const inputSnapshot = JSON.stringify(nutritionInput);
      const res = await generate({ appointmentServiceId: appointmentServiceId!, preferences, nutritionInput }).unwrap();
      if (sequence !== generationSequence.current) return;
      generatedNutritionInput.current = inputSnapshot ?? null;
      putCurrent(res);
      showNotification("success", "AI meal plan generated", "Advice and a 7-day meal plan are ready for you to review and edit.");
      setDraftPreferences(null);
      setDetailsSavedForSession(true);
      setView("overview");
    } catch (e) {
      if (sequence !== generationSequence.current) return;
      setGenerationError(errorText(e));
      showNotification("error", "Could not generate a plan", errorText(e), 8);
    } finally {
      generationInFlight.current = false;
      setPreparing(false);
    }
  };

  const handlePatientDetailsContinue = (preferences: Preferences) => {
    setDraftPreferences(preferences);
    void handleGenerate(preferences);
  };

  const handleSave = async (changes: { plan?: PlanContent; handout?: Partial<Handout> }) => {
    if (!record) return null;
    try {
      const res = await updatePlan({ planId: record.id, appointmentServiceId: appointmentServiceId!, ...changes }).unwrap();
      putCurrent(res);
      return res;
    } catch (e) {
      showNotification("error", "Draft not saved", `${errorText(e)} Your changes are still on screen — try saving again.`, 8);
      return null;
    }
  };

  const handleSubmit = async (): Promise<PlanResponse | null> => {
    if (!record) return null;
    if (record.status !== "draft" && record.status !== "changes_requested") {
      setView("share");
      return planResp;
    }
    try {
      const res = await submitPlan({ planId: record.id, appointmentServiceId: appointmentServiceId! }).unwrap();
      putCurrent(res);
      showNotification("success", "Plan ready for your review", "Review the PDF, mark it reviewed, and approve it before sending it to the patient.");
      setView("share");
      return res;
    } catch (e) {
      showNotification("error", "Could not submit", errorText(e), 8);
      return null;
    }
  };

  if (!appointmentServiceId) {
    return (
      <Result
        status="info"
        title="Nutrition Advisor is not available yet"
        subTitle="The Advisor works on a patient enrolled in the Nutrition service for this visit."
      />
    );
  }

  if (overview.isLoading || (overview.isFetching && !overview.currentData) || foods.isLoading || current.isLoading || (current.isFetching && !current.currentData)) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (overview.isError || foods.isError || !overview.currentData || !foods.data) {
    return (
      <Result
        status="warning"
        title="The Nutrition Advisor could not load"
        subTitle={`${errorText(overview.error ?? foods.error)} The other Nutrition tabs keep working normally.`}
        extra={
          <Button onClick={() => { overview.refetch(); foods.refetch(); current.refetch(); }}>
            Try again
          </Button>
        }
      />
    );
  }

  const ov = overview.currentData;
  const activeOverview = record ? { ...ov, targets: record.context.targets,
    eligibility: record.context.clinicalReview?.individualized
      ? { status: "held" as const, reasons: record.context.clinicalReview.reasons }
      : { status: "eligible" as const, reasons: [] },
    effective: record.context.effective ?? ov.effective, dataQuality: record.context.dataQuality,
    findings: record.context.findings, recommendations: record.context.recommendations,
    preferences: record.preferences,
    activityGuidance: { ...ov.activityGuidance, text: record.handout.activityGuidance, textUr: record.handout.activityGuidanceUr },
  } : { ...ov, findings: [], recommendations: [] };
  const planTabsEnabled = !!record;
  const library = foods.data;
  const preferences = draftPreferences ?? record?.preferences ?? ov.preferences;
  const hasNutritionDetails = !draftPreferences && (detailsSavedForSession || !!record);

  // Steps open in order; locked steps stay visible and explain what comes first.
  const isLocked = (v: View) =>
    v !== "details" && (!hasNutritionDetails || ((v === "plan" || v === "share") && !planTabsEnabled));
  const lockedHint = !hasNutritionDetails
    ? null
    : !planTabsEnabled
      ? "Steps 3 and 4 open once the AI meal plan has been generated."
      : null;
  const handleTabChange = (nextView: View) => {
    if (isLocked(nextView)) {
      setLockedClicked(true);
      return;
    }
    setLockedClicked(false);
    setView(nextView);
  };

  const stepLabel = (v: View, n: number, text: string) => (
    <span style={isLocked(v) ? { opacity: 0.5 } : undefined}>{n}. {text}</span>
  );

  const continueFromOverview = () => {
    if (record) {
      setView("plan");
      return;
    }
    if (activeOverview.eligibility.status === "eligible") void handleGenerate(preferences);
  };

  return (
    <div className="flex flex-col gap-4" style={{ paddingBottom: 16 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            className="na-green-segmented"
            value={view}
            onChange={(v) => handleTabChange(v as View)}
            options={[
              { value: "details", label: stepLabel("details", 1, "Patient Nutrition Details") },
              { value: "overview", label: stepLabel("overview", 2, "Nutrition Overview") },
              { value: "plan", label: stepLabel("plan", 3, "Customize Meal Plan") },
              { value: "share", label: stepLabel("share", 4, "PDF & Share") },
            ]}
          />
      </div>

      {lockedHint && <Alert type={lockedClicked ? "warning" : "info"} showIcon message={lockedHint} />}

      {generationError && <Alert type="error" showIcon message="Could not generate a plan"
        description={<>{generationError}<div style={{ marginTop: 6 }}>The AI advice is optional — you can still submit the Nutrition record from the Counseling tab.</div></>} />}

      <div style={{ display: view === "details" ? undefined : "none" }}>
        <PatientDetailsForm
          overview={ov}
          foods={library.foods}
          value={preferences}
          onContinue={handlePatientDetailsContinue}
          generating={generating || preparing}
        />
      </div>

      {view === "overview" && (
        <>
          <AdvisorOverview overview={activeOverview} />
          <div className="flex justify-end" style={{ padding: "10px 0" }}>
            <Button
              type="primary"
              loading={generating}
              disabled={!record && activeOverview.eligibility.status !== "eligible"}
              onClick={continueFromOverview}
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {view === "plan" && planResp && (
        <MealPlanEditor
          key={record!.id}
          response={planResp}
          library={library}
          saving={saving}
          onSave={handleSave}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {view === "share" && planResp && (
        <ReviewAndShare
          response={planResp}
          overview={activeOverview}
          library={library}
          canReview={canReview}
          onFinalize={onFinalize ? async () => {
            if (getNutritionInput && generatedNutritionInput.current !== JSON.stringify(getNutritionInput())) {
              showNotification("warning", "Generate advice from the current details", "The Nutrition form must match the reviewed plan. Generate advice again before submitting this record.");
              setView("details");
              return false;
            }
            return onFinalize();
          } : undefined}
          onSubmitForReview={handleSubmit}
        />
      )}

    </div>
  );
};

export default NutritionAdvisor;
