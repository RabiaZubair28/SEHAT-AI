import React, { useState } from "react";
import { Segmented } from "antd";
import type { Dayjs } from "dayjs";
import MonthlyPatientFlow from "./MonthlyPatientFlow";
import OverallTotals from "./OverallTotals";
import type {
  MonthlyPatientFlow as MonthlyPatientFlowType,
  OverallTotals as OverallTotalsType,
} from "../../services/dashboardService";

enum View {
  Monthly = "monthly",
  Overall = "overall",
}

const VIEW_LABELS: Record<View, string> = {
  [View.Monthly]: "Monthly",
  [View.Overall]: "Overall",
};

const VIEW_OPTIONS = Object.values(View).map((value) => ({
  label: VIEW_LABELS[value],
  value,
}));

interface Props {
  monthly: MonthlyPatientFlowType;
  overall?: OverallTotalsType;
  isOverallError: boolean;
  monthlyLoading: boolean;
  overallLoading: boolean;
  date: Dayjs;
}

const PatientFlowSwitcher: React.FC<Props> = ({
  monthly,
  overall,
  isOverallError,
  monthlyLoading,
  overallLoading,
  date,
}) => {
  const [view, setView] = useState<View>(View.Monthly);
  const isMonthly = view === View.Monthly;

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-[1]">
        <Segmented<View>
          value={view}
          onChange={setView}
          options={VIEW_OPTIONS}
        />
      </div>
      <div key={view} className="motion-safe:animate-pane-enter">
        {isMonthly ? (
          <MonthlyPatientFlow
            data={monthly}
            date={date}
            isLoading={monthlyLoading}
          />
        ) : (
          <OverallTotals
            data={overall}
            isError={isOverallError}
            isLoading={overallLoading}
          />
        )}
      </div>
    </div>
  );
};

export default PatientFlowSwitcher;
