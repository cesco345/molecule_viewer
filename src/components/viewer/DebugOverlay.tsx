// src/components/viewer/DebugOverlay.tsx

export function DebugOverlay({
  isVisible,
  stats,
}: {
  isVisible: boolean;
  stats: {
    instanceCount: number;
    bufferSizes: {
      vertices: number;
      indices: number;
    };
    camera: {
      rotation: [number, number];
      distance: number;
      position: [number, number, number];
    };
  };
}) {
  if (!isVisible) return null;

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-4 font-mono text-sm rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(stats, null, 2)}
      </pre>
      <div className="mt-2 text-xs text-gray-400">
        Press Ctrl+D to toggle debug view
      </div>
    </div>
  );
}
