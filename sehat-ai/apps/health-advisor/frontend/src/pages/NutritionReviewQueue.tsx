import React from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Empty, Table, Tag } from "antd";
import { useGetAdvisorReviewQueueQuery } from "@/features/patient-journey/services/nutritionAdvisorApi";
import NutritionAdvisor from "./NutritionAdvisor";
import { STATUS_META } from "../types";
import "../styles/advisor.css";

/**
 * Reviewer worklist: Nutrition plans submitted at this facility, so a medical
 * officer can approve plans for patients who are not in their own queue (NA-21).
 */
const NutritionReviewQueue: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const encounter = Number(params.get("encounter")) || undefined;
  const { data = [], isFetching, refetch } = useGetAdvisorReviewQueueQuery(undefined, { refetchOnMountOrArgChange: true });

  if (encounter) {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button onClick={() => setParams({})}>
            Back to review list
          </Button>
        </div>
        <NutritionAdvisor appointmentServiceId={encounter} initialView="share" />
      </div>
    );
  }

  return (
    <div className="na-card">
      <div className="na-card-title">
        <span className="na-card-icon">🩺</span>
        <span style={{ flex: 1 }}>Nutrition Plan Reviews</span>
        <Button onClick={() => refetch()} loading={isFetching}>
          Refresh
        </Button>
      </div>
      <Table
        rowKey="planId"
        loading={isFetching}
        dataSource={data}
        locale={{ emptyText: <Empty description="No nutrition plans are waiting for review." /> }}
        onRow={(row) => ({ onClick: () => setParams({ encounter: String(row.appointmentServiceId) }), style: { cursor: "pointer" } })}
        columns={[
          { title: "Patient", dataIndex: "patientName" },
          { title: "MR #", dataIndex: "mrNo" },
          { title: "Version", dataIndex: "version", render: (v) => `v${v}` },
          { title: "Submitted by", dataIndex: "submittedBy", render: (v) => v ?? "—" },
          { title: "Updated", dataIndex: "updatedAt", render: (v) => new Date(v).toLocaleString() },
          {
            title: "Status",
            dataIndex: "status",
            render: (s: keyof typeof STATUS_META) => <Tag color={STATUS_META[s].color}>{STATUS_META[s].label}</Tag>,
          },
          {
            title: "",
            render: (_, row) => (
              <Button type={row.status === "pending_review" ? "primary" : "default"} size="small">
                {row.status === "pending_review" ? "Review" : "Open"}
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
};

export default NutritionReviewQueue;
