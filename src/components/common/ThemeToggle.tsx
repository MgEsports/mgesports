import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "Light Mode" : "Dark Mode"}`}
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl transition-all duration-300 focus:outline-none cursor-pointer group ${
        isDark
          ? "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#fc8100] border border-white/10 hover:border-[#fc8100]/40"
          : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#fc8100] border border-gray-300 hover:border-[#fc8100]/50 shadow-sm"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        {isDark ? (
          <Sun className="h-4 w-4 text-[#fc8100] transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-[#fc8100] transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>

      {showLabel && (
        <span className="font-heading text-xs font-bold tracking-wider uppercase">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};
