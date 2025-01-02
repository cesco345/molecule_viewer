"use client";

import { useCallback } from "react";
import { Upload } from "lucide-react";

interface Props {
  onPDBLoad: (data: Uint8Array) => void; // Changed to match MoleculeViewer
}

export function FileUpload({ onPDBLoad }: Props) {
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdb")) {
        console.error("Please select a PDB file");
        return;
      }

      try {
        console.log("Loading file:", file.name, "Size:", file.size, "bytes");
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        console.log(
          "File loaded, first line:",
          new TextDecoder().decode(data.slice(0, 80))
        );
        console.log("Total bytes loaded:", data.length);
        onPDBLoad(data);
      } catch (error) {
        console.error("Failed to load PDB file:", error);
      }
    },
    [onPDBLoad]
  );

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
