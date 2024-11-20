import React from "react";
import { useTheme } from "./ThemeToggle";

const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 rounded-md bg-blue-500 text-white dark:bg-gray-700 dark:text-gray-200"
    >
      {theme === 'light' ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeToggleButton;
