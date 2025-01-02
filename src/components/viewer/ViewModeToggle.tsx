// src/components/viewer/ViewModeToggle.tsx
import React from "react";
import { CircleDot, LayoutGrid } from "lucide-react"; // Changed icons
import { ViewMode } from "./types";

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({
  currentMode,
  onModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="absolute top-4 left-4 flex gap-2">
      <button
        onClick={() => onModeChange(ViewMode.SPHERES)}
        className={`p-2 rounded-l ${
          currentMode === ViewMode.SPHERES
            ? "bg-blue-500 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
        }`}
        title="Sphere View"
      >
        <CircleDot size={20} /> {/* Changed from Sphere */}
      </button>
      <button
        onClick={() => onModeChange(ViewMode.RIBBON)}
        className={`p-2 rounded-r ${
          currentMode === ViewMode.RIBBON
            ? "bg-blue-500 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
        }`}
        title="Ribbon View"
      >
        <LayoutGrid size={20} /> {/* Changed from Menu */}
      </button>
    </div>
  );
}
