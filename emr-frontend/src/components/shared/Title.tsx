import React from "react";
import { Typography } from "antd";

interface TitleProps {
  level?: 1 | 2 | 3 | 4 | 5;
  text: string;
  className?: string;
  // color?: string;
  // align?: "left" | "center" | "right";
}

const Title: React.FC<TitleProps> = ({
  level = 4,
  text,
  className = "",
  // color = "text-green-custom",
  // align = "text-center",
}) => {
  return (
    <Typography.Title level={level} className={className}>
      {text}
    </Typography.Title>
  );
};

export default Title;
