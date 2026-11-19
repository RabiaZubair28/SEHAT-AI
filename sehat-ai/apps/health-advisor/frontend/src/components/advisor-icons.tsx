import React from "react";
import type { MealSlot } from "../types";
import {
  AlertOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  EyeOutlined,
  FileTextOutlined,
  FireOutlined,
  HeartOutlined,
  LineChartOutlined,
  MoonOutlined,
  PieChartOutlined,
  QuestionCircleOutlined,
  RiseOutlined,
  SunOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";

export const SLOT_ICON: Record<MealSlot, React.ReactNode> = {
  breakfast: <SunOutlined />,
  mid_morning: <CoffeeOutlined />,
  lunch: <SunOutlined />,
  evening_snack: <CoffeeOutlined />,
  dinner: <MoonOutlined />,
};

export const findingIcon = (id: string, kind: string): React.ReactNode => {
  if (id === "lab:hb") return <ExperimentOutlined />;
  if (id === "obs:bmi") return <DashboardOutlined />;
  if (id === "obs:bp") return <HeartOutlined />;
  if (id === "obs:temp") return <FireOutlined />;
  if (id === "obs:pulse") return <LineChartOutlined />;
  if (id === "obs:pallor") return <EyeOutlined />;
  if (id === "obs:allergies") return <AlertOutlined />;
  if (kind === "patient_reported_condition") return <UserOutlined />;
  if (kind === "safety_warning") return <WarningOutlined />;
  if (kind === "unavailable") return <QuestionCircleOutlined />;
  return <FileTextOutlined />;
};

export const RECOMMENDATION_ICON: Record<string, React.ReactNode> = {
  iron_rich: <ExperimentOutlined />,
  vitamin_c: <SunOutlined />,
  balanced_portions: <PieChartOutlined />,
  balanced_diet: <HeartOutlined />,
  energy_dense: <FireOutlined />,
  diabetes_carbs: <DashboardOutlined />,
  low_salt: <AlertOutlined />,
  low_fat: <HeartOutlined />,
  fever_fluids: <FireOutlined />,
  hydration: <CoffeeOutlined />,
  activity: <RiseOutlined />,
};
