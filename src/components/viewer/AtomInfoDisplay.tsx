// src/components/viewer/AtomInfoDisplay.tsx

import { AtomInfo } from "./types";

interface AtomInfoDisplayProps {
  atom: AtomInfo | null;
}

export function AtomInfoDisplay({ atom }: AtomInfoDisplayProps) {
  if (!atom) return null;

  return (
    <div className="absolute top-20 left-4 bg-black/70 text-white px-4 py-3 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-1">Selected Atom</h3>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-gray-400">Residue:</span> {atom.residueName}-
          {atom.residueNumber}
        </p>
        <p>
          <span className="text-gray-400">Atom:</span> {atom.atomName}
        </p>
        <p>
          <span className="text-gray-400">Chain:</span> {atom.chain}
        </p>
      </div>
    </div>
  );
}
