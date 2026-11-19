import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Checkbox, Input, Modal, Segmented, Select, Switch, Table } from "antd";
import {
  AuditOutlined,
  CheckCircleFilled,
  FilePdfOutlined,
  MessageOutlined,
  PhoneOutlined,
  PictureOutlined,
  TranslationOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import type { FoodLibrary, Overview, PlanResponse } from "../types";
import PatientHandout from "./PatientHandout";
import { buildHandoutPdf, ensureUrduFont, saveBlob } from "../services/handoutPdf";
import { CardTitle } from "./AdvisorOverview";
import {
  useCreateAdvisorDeliveryMutation,
  useReviewAdvisorPlanMutation,
} from "@/features/patient-journey/services/nutritionAdvisorApi";
import { useGlobalNotification } from "@/hooks/useNotification";

interface Props {
  response: PlanResponse;
  overview: Overview;
  library: FoodLibrary;
  canReview: boolean;
  onSubmitForReview: () => Promise<PlanResponse | null>;
  onFinalize?: () => Promise<boolean>;
}

const normalize = (raw: string) => {
  const d = raw.replace(/[^\d+]/g, "");
  const n = d.startsWith("+92") ? d.slice(3) : d.startsWith("0092") ? d.slice(4) : d.startsWith("92") && d.length === 12 ? d.slice(2) : d.startsWith("0") ? d.slice(1) : d;
  return /^3\d{9}$/.test(n) ? `+92${n}` : null;
};

const ToggleRow: React.FC<{ icon: React.ReactNode; label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void }> = ({ icon, label, checked, onChange }) => (
  <div className="flex items-center gap-3" style={{ padding: "10px 0", borderBottom: "1px solid #f0f3f1" }}>
    <span className="na-icon sm">{icon}</span>
    <span style={{ flex: 1, fontSize: 14 }}>{label}</span>
    <Switch checked={checked} onChange={onChange} />
  </div>
);

const ReviewAndShare: React.FC<Props> = ({ response, overview, library, canReview, onSubmitForReview, onFinalize }) => {
  const record = response.plan!;
  const showNotification = useGlobalNotification();
  const handoutRef = useRef<HTMLDivElement>(null);
  const previewBox = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<"en" | "ur">(record.handout.urduProofread ? "ur" : "en");
  const [includeImages, setIncludeImages] = useState(true);
  const [viaWhatsApp, setViaWhatsApp] = useState(!onFinalize);
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [recordSubmitted, setRecordSubmitted] = useState(false);
  const submissionInFlight = useRef(false);
  const [fit, setFit] = useState<"fit" | "actual">("fit");
  const [fitScale, setFitScale] = useState(0.6);
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState(overview.patient.phone ?? "");
  const [consent, setConsent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<null | "download" | "send">(null);
  const [reviewPdfOpen, setReviewPdfOpen] = useState(false);
  const [markedReviewed, setMarkedReviewed] = useState(false);
  const [reviewPromptOpen, setReviewPromptOpen] = useState(false);
  const [planWarningsOpen, setPlanWarningsOpen] = useState(false);
  const [processingApproval, setProcessingApproval] = useState(false);

  const [review, { isLoading: reviewing }] = useReviewAdvisorPlanMutation();
  const [createDelivery] = useCreateAdvisorDeliveryMutation();

  const approved = record.status === "approved";
  const pending = record.status === "pending_review";
  const editableStatus = record.status === "draft" || record.status === "changes_requested";
  const normalizedPhone = normalize(phone);
  const differsFromRegistered = !!normalizedPhone && normalizedPhone !== overview.patient.phone;
  const scale = fit === "fit" ? fitScale : 1;

  useEffect(() => {
    ensureUrduFont();
  }, []);

  useEffect(() => {
    setMarkedReviewed(false);
  }, [record.id, record.contentHash]);

  useEffect(() => {
    setMessage(
      language === "ur"
        ? `السلام علیکم ${overview.patient.name}،\n\nآپ کا غذائی منصوبہ تیار ہے۔ براہ کرم اس منصوبے پر عمل کریں تاکہ آپ کی صحت بہتر ہو۔ اگر آپ کے کوئی سوالات ہوں تو براہ کرم اپنے قریبی صحت مرکز تشریف لے جائیں۔`
        : `Assalam-o-Alaikum ${overview.patient.name},\n\nYour nutrition plan is ready. Please follow it for better health, and visit your nearest health facility if you have any questions.`,
    );
  }, [language, overview.patient.name]);

  // Fit the A4 preview to the panel width.
  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFitScale(Math.min(1, (el.clientWidth - 76) / 794)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const daySummary = useMemo(
    () =>
      (response.totals ?? []).map((t) => ({
        key: t.day,
        day: `Day ${t.day}`,
        kcal: t.kcal,
        protein: t.protein,
        iron: t.iron,
        sodium: t.sodium,
        issues: (response.warnings ?? []).filter((w) => w.day === t.day && w.severity !== "info").length,
      })),
    [response],
  );

  const doReview = async (decision: "approve" | "reject" | "request_changes") => {
    try {
      await review({ planId: record.id, appointmentServiceId: record.appointmentServiceId, decision, contentHash: record.contentHash, comment: comment || undefined }).unwrap();
      setComment("");
      showNotification("success", "Nutrition plan", decision === "approve" ? `Version ${record.version} approved.` : decision === "reject" ? "Plan rejected." : "Changes requested.");
    } catch (e: any) {
      showNotification("error", "Review failed", e?.data?.message ?? "Please try again.");
    }
  };

  const deliver = async (channel: "download" | "whatsapp") => {
    if (!handoutRef.current) return;
    setBusy(channel === "download" ? "download" : "send");
    try {
      const blob = await buildHandoutPdf(handoutRef.current);
      const form = new FormData();
      form.append("channel", channel);
      form.append("language", language);
      form.append("contentHash", record.contentHash);
      if (channel === "whatsapp") {
        form.append("phone", normalizedPhone ?? phone);
        form.append("consent", String(consent));
        form.append("recipientVerified", String(verified));
        form.append("message", message);
      }
      form.append("file", blob, `nutrition-plan-v${record.version}-${language}.pdf`);
      const result = await createDelivery({ planId: record.id, form }).unwrap();
      if (channel === "download") {
        saveBlob(blob, `nutrition-plan-${overview.patient.mrNo}-v${record.version}-${language}.pdf`);
        showNotification("success", "PDF downloaded", "A copy has been kept in the patient's Nutrition record.");
      } else if (result.status === "sent") {
        showNotification("success", "Sent via WhatsApp", `Delivered to ${result.recipient}.`);
      } else {
        showNotification("error", "WhatsApp delivery failed", result.error ?? "Please try again or download the PDF.");
      }
    } catch (e: any) {
      showNotification("error", "Could not share the plan", e?.data?.message ?? e?.message ?? "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const finalizeAndSendPdf = async () => {
    if (!viaWhatsApp) {
      showNotification("info", "Enable WhatsApp delivery", "Turn on Send via WhatsApp before sending the PDF to the patient.");
      return;
    }
    if (approved) {
      if (!recordSubmitted && onFinalize && !(await onFinalize())) return;
      setRecordSubmitted(true);
      await deliver("whatsapp");
      return;
    }
    if (!canReview) {
      showNotification("error", "Review permission required", "Your account needs plan approval permission before this PDF can be sent to the patient.");
      return;
    }

    setProcessingApproval(true);
    let planToApprove = record;
    try {
      if (editableStatus) {
        const submitted = await onSubmitForReview();
        if (!submitted?.plan) return;
        planToApprove = submitted.plan;
      }
      if (planToApprove.status !== "pending_review") {
        showNotification("error", "Plan is not ready", "The plan could not be prepared for approval. Please try again.");
        return;
      }
      await review({
        planId: planToApprove.id,
        appointmentServiceId: planToApprove.appointmentServiceId,
        decision: "approve",
        contentHash: planToApprove.contentHash,
      }).unwrap();
      if (!recordSubmitted && onFinalize && !(await onFinalize())) return;
      setRecordSubmitted(true);
      showNotification("success", "Plan approved", "Your review is recorded. Sending the PDF to the patient now.");
      await deliver("whatsapp");
    } catch (e: any) {
      showNotification("error", "Could not approve the plan", e?.data?.message ?? "Please review the plan and try again.");
    } finally {
      setProcessingApproval(false);
    }
  };

  const approveAndSendPdf = async () => {
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
    setSubmittingRecord(true);
    try {
      await finalizeAndSendPdf();
    } catch (e: any) {
      showNotification("error", "Could not submit the record", e?.data?.message ?? "Please try again.");
    } finally {
      submissionInFlight.current = false;
      setSubmittingRecord(false);
    }
  };

  const handleSendPdf = async () => {
    if (submissionInFlight.current) return;
    if (!viaWhatsApp && onFinalize) {
      submissionInFlight.current = true;
      setSubmittingRecord(true);
      try {
        if (await onFinalize()) {
          setRecordSubmitted(true);
          showNotification("success", "Nutrition record submitted", "No WhatsApp message was sent.");
        }
      } finally {
        submissionInFlight.current = false;
        setSubmittingRecord(false);
      }
      return;
    }
    if (!overview.whatsAppConfigured || !normalizedPhone || !consent || (differsFromRegistered && !verified)) {
      showNotification("warning", "WhatsApp details required", "Check WhatsApp configuration, the patient's number and delivery consent before submitting and sending.");
      return;
    }
    if (!markedReviewed) {
      setReviewPromptOpen(true);
      return;
    }
    const issues = (response.warnings ?? []).filter((warning) => warning.severity !== "info");
    if (!approved && issues.length) {
      setPlanWarningsOpen(true);
      return;
    }
    await approveAndSendPdf();
  };

  const continueAfterWarningReview = async () => {
    setPlanWarningsOpen(false);
    const blockingIssues = (response.warnings ?? []).filter((warning) => warning.severity === "error");
    if (blockingIssues.length) {
      showNotification("error", "Plan needs changes", "Resolve the highlighted safety issues in Customize Meal Plan before approving and sending this PDF.");
      return;
    }
    await approveAndSendPdf();
  };

  const handoutProps = {
    record,
    plan: record.content,
    handout: record.handout,
    library,
    patient: overview.patient,
    language,
    includeImages,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: approved ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(320px, 420px)" }}>
        {/* ---------------- PDF preview ---------------- */}
        <div className="na-card" ref={previewBox}>
          <CardTitle
            icon={<FilePdfOutlined />}
            title="PDF Review"
            extra={
              <div className="flex items-center gap-2">
                {!approved && (
                  <Segmented
                    className="na-green-segmented"
                    size="small"
                    value={language}
                    onChange={(v) => setLanguage(v as "en" | "ur")}
                    options={[
                      { value: "en", label: "English" },
                      { value: "ur", label: "اردو" },
                    ]}
                  />
                )}
                <Select
                  size="small"
                  value={fit}
                  onChange={setFit}
                  style={{ width: 120 }}
                  options={[
                    { value: "fit", label: "Fit to page" },
                    { value: "actual", label: "100%" },
                  ]}
                />
              </div>
            }
          />
          <div className="na-preview-scroller">
            <div style={{ zoom: scale, width: 794, margin: "0 auto" }}>
              <PatientHandout {...handoutProps} />
            </div>
          </div>
        </div>

        {/* Unscaled copy used only to render the PDF pages. */}
        <div style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} aria-hidden>
          <PatientHandout ref={handoutRef} {...handoutProps} />
        </div>

        {/* ---------------- Right column ---------------- */}
        <div className="flex flex-col gap-4">
          {!approved && (
            <div className="na-card">
              <CardTitle icon={<AuditOutlined />} title="Clinical Review" />
              <Table
                size="small"
                pagination={false}
                dataSource={daySummary}
                columns={[
                  { title: "", dataIndex: "day" },
                  { title: "kcal", dataIndex: "kcal" },
                  { title: "Protein", dataIndex: "protein", render: (v) => `${v} g` },
                  { title: "Iron", dataIndex: "iron", render: (v) => `${v} mg` },
                  { title: "Sodium", dataIndex: "sodium" },
                  { title: "", dataIndex: "issues", render: (v) => (v ? <span style={{ color: "#b54708" }}>{v} issue</span> : <CheckCircleFilled style={{ color: "var(--green-700)" }} />) },
                ]}
              />
              <div className="na-muted" style={{ fontSize: 12, marginTop: 6 }}>
                {record.context.targets
                  ? <>Targets: {record.context.targets.kcal} kcal · {record.context.targets.protein} g protein · iron {record.context.targets.iron} mg · sodium &lt; {record.context.targets.sodiumMax} mg</>
                  : "Individual nutrient and fluid targets need doctor review."}
              </div>
              {(response.warnings ?? [])
                .filter((w) => w.severity !== "info")
                .slice(0, 6)
                .map((w, i) => (
                  <div key={i} style={{ fontSize: 12, color: w.severity === "error" ? "#b42318" : "#b54708", marginTop: 4 }}>
                    • {w.message}
                  </div>
                ))}
              {record.preferences.otherAllergies && (
                <Alert type="warning" showIcon style={{ marginTop: 8 }} message={`Other allergies to check manually: ${record.preferences.otherAllergies}`} />
              )}

              {pending &&
                (canReview ? (
                  <div className="mt-3">
                    <Input.TextArea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment (required to reject or request changes)" maxLength={1000} />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button type="primary" loading={reviewing} onClick={() => doReview("approve")}>
                        Approve v{record.version}
                      </Button>
                      <Button disabled={!comment.trim()} onClick={() => doReview("request_changes")}>
                        Request changes
                      </Button>
                      <Button danger disabled={!comment.trim()} onClick={() => doReview("reject")}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : null)}
              {record.status === "rejected" && record.reviewComment && (
                <Alert type="error" showIcon style={{ marginTop: 12 }} message="Rejected" description={record.reviewComment} />
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3" style={{ padding: "10px 0" }}>
        <ToggleRow icon={<WhatsAppOutlined />} label="Send the PDF via WhatsApp (optional)" checked={viaWhatsApp} onChange={setViaWhatsApp} />
        {viaWhatsApp && (
          <div className="na-card">
            {!overview.whatsAppConfigured && (
              <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="WhatsApp is not configured on the server. Download the PDF and share it manually." />
            )}
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              <div>
                <div className="flex items-end gap-3">
                  <span className="na-icon sm" style={{ marginBottom: 4 }}>
                    <PhoneOutlined />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="na-muted" style={{ fontSize: 13, marginBottom: 4 }}>WhatsApp Number</div>
                    <Input
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setVerified(false);
                      }}
                      placeholder="+92 300 1234567"
                      status={phone && !normalizedPhone ? "error" : undefined}
                    />
                  </div>
                </div>
                {phone && !normalizedPhone && <div style={{ color: "#b42318", fontSize: 12, marginTop: 4 }}>Enter a valid Pakistani mobile number.</div>}
                {differsFromRegistered && (
                  <Checkbox checked={verified} onChange={(e) => setVerified(e.target.checked)} style={{ marginTop: 8, fontSize: 13 }}>
                    Differs from the registered number ({overview.patient.phoneMasked ?? "none"}) — confirmed with the patient.
                  </Checkbox>
                )}
                <div style={{ marginTop: 8 }}>
                  <ToggleRow
                    icon={<TranslationOutlined />}
                    label={<>Include Urdu Version <span className="na-muted">(Recommended)</span></>}
                    checked={language === "ur"}
                    onChange={(v) => setLanguage(v ? "ur" : "en")}
                  />
                  <ToggleRow icon={<PictureOutlined />} label="Include Food Images" checked={includeImages} onChange={setIncludeImages} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3" style={{ marginBottom: 6 }}>
                  <span className="na-icon sm">
                    <MessageOutlined />
                  </span>
                  <span className="na-muted" style={{ fontSize: 13 }}>Personalized Message (optional)</span>
                </div>
                <Input.TextArea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} showCount dir={language === "ur" ? "rtl" : "ltr"} className={language === "ur" ? "na-urdu" : undefined} />
                <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 10, fontSize: 13 }}>
                  The patient agreed to receive their plan on this WhatsApp number.
                </Checkbox>
                <Button
                  block
                  style={{ marginTop: 8 }}
                  loading={busy === "download"}
                  disabled={!approved}
                  onClick={() => deliver("download")}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}
        <Checkbox checked={markedReviewed} onChange={(event) => setMarkedReviewed(event.target.checked)}>
          I am the doctor or medical officer, and I have reviewed this PDF for the patient.
        </Checkbox>
        <div className="flex justify-between">
          <Button onClick={() => setReviewPdfOpen(true)}>
            Review PDF
          </Button>
          <Button
            type="primary"
            loading={busy === "send" || reviewing || processingApproval || submittingRecord}
            disabled={!viaWhatsApp && recordSubmitted}
            onClick={handleSendPdf}
          >
            {viaWhatsApp ? (recordSubmitted ? "Send PDF via WhatsApp" : "Submit and send PDF via WhatsApp") : "Submit record"}
          </Button>
        </div>
      </div>

      <Modal
        title="Doctor or medical officer review required"
        centered
        open={reviewPromptOpen}
        onCancel={() => setReviewPromptOpen(false)}
        onOk={() => setReviewPromptOpen(false)}
        okText="OK"
        cancelButtonProps={{ style: { display: "none" } }}
      >
        A doctor or medical officer must review this PDF. After reviewing it, mark the confirmation box to approve the plan and send it to the patient.
      </Modal>

      <Modal
        title="Review plan findings"
        centered
        open={planWarningsOpen}
        onCancel={() => setPlanWarningsOpen(false)}
        onOk={continueAfterWarningReview}
        okText={(response.warnings ?? []).some((warning) => warning.severity === "error") ? "Acknowledge" : "Continue"}
        cancelText="Cancel"
      >
        <p>The AI assistant flagged these items. Review them before approving the plan:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
          {(response.warnings ?? []).filter((warning) => warning.severity !== "info").map((warning, index) => (
            <li key={`${warning.code}-${index}`} style={{ color: warning.severity === "error" ? "#b42318" : "#b54708", marginBottom: 4 }}>
              {warning.message}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        title="PDF Review"
        centered
        open={reviewPdfOpen}
        onCancel={() => setReviewPdfOpen(false)}
        footer={null}
        width={960}
      >
        <div style={{ maxHeight: "75vh", overflowY: "auto", padding: 8 }}>
          <PatientHandout {...handoutProps} />
        </div>
      </Modal>
    </div>
  );
};

export default ReviewAndShare;
