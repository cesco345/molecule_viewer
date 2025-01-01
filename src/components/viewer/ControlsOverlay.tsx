export function ControlsOverlay({
  isPanning,
  showControls = true,
}: {
  isPanning: boolean;
  showControls?: boolean;
}) {
  if (!showControls) return null;

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      {/* Mode indicator */}
      <div
        className={`
          px-3 py-1 rounded text-sm font-medium
          transition-colors duration-200
          ${isPanning ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-200"}
        `}
      >
        {isPanning ? "Pan Mode" : "Rotate Mode"}
      </div>

      {/* Controls legend */}
      <div className="bg-black/70 text-white p-3 rounded text-sm space-y-1">
        <p>🖱️ Left Click + Drag: Rotate</p>
        <p>🖱️ Middle Click/Shift + Drag: Pan</p>
        <p>⚡ Arrow Keys: Pan</p>
        <p>🔄 Scroll: Zoom</p>
        <p>↺ R: Reset View</p>
      </div>
    </div>
  );
}
