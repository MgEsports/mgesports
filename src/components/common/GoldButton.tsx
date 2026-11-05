import React from "react";
import { ArrowRight } from "lucide-react";

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  showArrow?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const GoldButton = ({
  children,
  showArrow = true,
  size = "md",
  className = "",
  ...props
}: GoldButtonProps) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={`group relative inline-flex items-center justify-center font-heading font-bold uppercase tracking-wider text-black bg-[#FFBE32] hover:bg-[#FFCD59] active:scale-[0.98] transition-all duration-200 clip-chamfer shadow-[0_4px_20px_rgba(255,190,50,0.25)] hover:shadow-[0_6px_28px_rgba(255,190,50,0.4)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClasses[size]} ${className}`}
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
