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
    };
  };
}) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-0 bg-black/70 text-white p-4 font-mono text-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(stats, null, 2)}
      </pre>
    </div>
  );
}
