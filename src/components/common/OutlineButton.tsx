import React from "react";
import { ArrowRight } from "lucide-react";

interface OutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  showArrow?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const OutlineButton = ({
  children,
  showArrow = false,
  size = "md",
  className = "",
  ...props
}: OutlineButtonProps) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={`group relative inline-flex items-center justify-center font-heading font-bold uppercase tracking-wider text-[#FFBE32] hover:text-black bg-transparent hover:bg-[#FFBE32] border border-[#FFBE32]/60 hover:border-[#FFBE32] active:scale-[0.98] transition-all duration-200 clip-chamfer cursor-pointer ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {showArrow && (
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        )}
      </span>
    </button>
  );
};
