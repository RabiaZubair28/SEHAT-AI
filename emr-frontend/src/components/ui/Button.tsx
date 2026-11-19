import React from "react";
import clsx from "clsx";

interface ButtonProps {
  title: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "table" | "custom";
  size?: "sm" | "md" | "lg" | "custom";
  rounded?: "xs" | "sm" | "md" | "lg" | "full";
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const sizeClasses = {
  sm: "text-sm md:text-base px-2 py-1.5",
  md: "text-base md:text-lg px-8 py-2",
  lg: "text-lg md:text-xl px-6 py-3",
  custom: "",
};

const variantClasses = {
  primary: "cursor-pointer bg-green-custom !text-white border border-transparent",
  secondary: "cursor-pointer bg-gray-200 text-gray-700 hover:bg-gray-300",
  danger: "cursor-pointer bg-red-600 text-white hover:bg-red-700",
  table: "cursor-pointer bg-green-custom !text-white border border-transparent ",
  custom: "", // handled via className
};

const roundedClasses = {
  xs: "rounded-xs",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

const CustomButton: React.FC<ButtonProps> = ({
  title,
  onClick,
  variant = "primary",
  size = "md",
  rounded = "md",
  fullWidth = false,
  disabled = false,
  className = "",
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
        sizeClasses[size],
        variantClasses[variant],
        roundedClasses[rounded],
        {
          "w-full": fullWidth,
          "opacity-50 cursor-not-allowed": disabled,
        },
        className
      )}
    >
      {title}
    </button>
  );
};

export default CustomButton;
