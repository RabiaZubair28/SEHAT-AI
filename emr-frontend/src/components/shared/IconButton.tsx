// IconButtonFromAsset.tsx
import React from "react";
import { Button, Tooltip } from "antd";

// adjust the path as needed

interface IconButtonFromAssetProps {
  onClick: () => void;
  tooltip?: string;
  alt?: string;
  size?: number;
  icon: string;
}

const IconButton: React.FC<IconButtonFromAssetProps> = ({
  onClick,
  tooltip,
  alt = "icon",
  size = 15,
  icon,
}) => {
  const button = (
    <Button
      type="text"
      onClick={onClick}
      style={{
        padding: 0,
        height: "auto",
        background: "none",
        border: "none",
        boxShadow: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img src={icon} alt={alt} style={{ width: size, height: size }} />
    </Button>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};

export default IconButton;
