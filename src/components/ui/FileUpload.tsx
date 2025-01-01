"use client";
// src/components/ui/FileUpload.tsx

import { useCallback } from "react";
import { Upload } from "lucide-react";

interface Props {
  onPDBLoad: (data: Float32Array) => void;
}

interface AtomColors {
  [key: string]: {
    color: [number, number, number];
    radius: number;
  };
}

const atomProperties: AtomColors = {
  H: { color: [1.0, 1.0, 1.0], radius: 0.31 },
  C: { color: [0.5, 0.5, 0.5], radius: 0.77 },
  N: { color: [0.0, 0.0, 1.0], radius: 0.75 },
  O: { color: [1.0, 0.0, 0.0], radius: 0.73 },
  P: { color: [1.0, 0.5, 0.0], radius: 1.06 },
  S: { color: [1.0, 1.0, 0.0], radius: 1.02 },
  default: { color: [0.8, 0.8, 0.8], radius: 0.75 },
};

export function FileUpload({ onPDBLoad }: Props) {
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdb")) {
        console.error("Please select a PDB file");
        return;
      }

      try {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        const renderData = parsePDB(data);
        onPDBLoad(renderData);
      } catch (error) {
        console.error("Failed to load PDB file:", error);
      }
    },
    [onPDBLoad]
  );

  function parsePDB(data: Uint8Array): Float32Array {
    const text = new TextDecoder().decode(data);
    const atoms: number[] = [];
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    // First pass: find bounds
    text.split("\n").forEach((line) => {
      if (line.startsWith("ATOM") || line.startsWith("HETATM")) {
        const x = parseFloat(line.slice(30, 38));
        const y = parseFloat(line.slice(38, 46));
        const z = parseFloat(line.slice(46, 54));

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      }
    });

    // Calculate center and scale
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const maxDist = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    const scale = 20 / maxDist; // Scale to fit in a 20 unit box

    // Second pass: process atoms with normalization
    text.split("\n").forEach((line) => {
      if (line.startsWith("ATOM") || line.startsWith("HETATM")) {
        // Parse coordinates and normalize
        const x = (parseFloat(line.slice(30, 38)) - centerX) * scale;
        const y = (parseFloat(line.slice(38, 46)) - centerY) * scale;
        const z = (parseFloat(line.slice(46, 54)) - centerZ) * scale;

        // Get element and properties
        const element = line.slice(76, 78).trim();
        const properties = atomProperties[element] || atomProperties["default"];

        // Add position, color, and radius
        atoms.push(
          x,
          y,
          z, // position
          ...properties.color, // color
          properties.radius * scale // radius
        );
      }
    });

    return new Float32Array(atoms);
  }

  return (
    <div className="absolute top-4 right-4">
      <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer transition-colors">
        <Upload size={20} />
        Load PDB
        <input
          type="file"
          accept=".pdb"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
      </label>
    </div>
  );
}
