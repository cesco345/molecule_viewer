import { AtomInfo } from "../types";

export function parsePdbLine(line: string): {
  position: [number, number, number];
  element: string;
  residueName: string;
  atomName: string;
  residueNumber: number;
  chain: string;
} | null {
  if (!line.trim().startsWith("ATOM")) {
    return null;
  }

  try {
    const element = line.slice(76, 78).trim() || line.slice(12, 14).trim();
    const atomName = line.slice(12, 16).trim();
    const residueName = line.slice(17, 20).trim();
    const chain = line.slice(21, 22).trim();
    const residueNumber = parseInt(line.slice(22, 26).trim());
    const x = parseFloat(line.slice(30, 38).trim());
    const y = parseFloat(line.slice(38, 46).trim());
    const z = parseFloat(line.slice(46, 54).trim());
    const position: [number, number, number] = [x, y, z];

    return {
      position,
      element,
      residueName,
      atomName,
      residueNumber,
      chain,
    };
  } catch (error) {
    console.error("Error parsing PDB line:", error, "Line:", line);
    return null;
  }
}

function determineSecondaryStructure(
  residueName: string,
  residueIndex: number,
  backbone: Map<number, AtomInfo>
): "helix" | "sheet" | "coil" {
  // For now, using a simple heuristic based on residue type
  // In a real implementation, you'd want to use HELIX/SHEET records from the PDB file
  const commonHelixResidues = new Set(["ALA", "LEU", "GLU", "LYS"]);
  const commonSheetResidues = new Set(["VAL", "ILE", "THR"]);

  // Check surrounding residues
  const prevResidue = backbone.get(residueIndex - 1);
  const nextResidue = backbone.get(residueIndex + 1);

  if (commonHelixResidues.has(residueName)) {
    return "helix";
  } else if (commonSheetResidues.has(residueName)) {
    return "sheet";
  }

  return "coil";
}

export function parseAtomsWithMetadata(pdbContent: string): {
  renderData: Float32Array;
  atomsMetadata: AtomInfo[];
  backboneAtoms?: {
    position: [number, number, number];
    residueIndex: number;
    secondaryStructure: "helix" | "sheet" | "coil";
  }[];
} {
  const atoms: number[] = [];
  const atomsMetadata: AtomInfo[] = [];
  const backboneMap = new Map<number, AtomInfo>();
  const backboneAtoms: {
    position: [number, number, number];
    residueIndex: number;
    secondaryStructure: "helix" | "sheet" | "coil";
  }[] = [];

  let index = 0;
  const lines = pdbContent.split(/\r?\n/);

  // First pass: collect all atoms and identify backbone atoms
  lines.forEach((line) => {
    const atomData = parsePdbLine(line.trim());
    if (atomData) {
      const { position, element, residueName, atomName, residueNumber, chain } =
        atomData;
      const [radius, color] = getAtomProperties(element);

      // Store rendering data for spheres
      atoms.push(
        position[0],
        position[1],
        position[2], // position (3 floats)
        color[0],
        color[1],
        color[2], // color (3 floats)
        radius // radius (1 float)
      );

      const atomInfo = {
        index,
        position,
        residueName,
        atomName,
        residueNumber,
        chain,
      };

      atomsMetadata.push(atomInfo);

      // Store backbone atoms (CA - alpha carbon) for ribbon generation
      if (atomName === "CA") {
        backboneMap.set(residueNumber, atomInfo);
      }

      index++;
    }
  });

  // Second pass: determine secondary structure and create backbone array
  for (const [residueNumber, atom] of backboneMap) {
    const secondaryStructure = determineSecondaryStructure(
      atom.residueName,
      residueNumber,
      backboneMap
    );

    backboneAtoms.push({
      position: atom.position,
      residueIndex: residueNumber,
      secondaryStructure,
    });
  }

  // Sort backbone atoms by residue index to ensure correct order
  backboneAtoms.sort((a, b) => a.residueIndex - b.residueIndex);

  return {
    renderData: new Float32Array(atoms),
    atomsMetadata,
    backboneAtoms: backboneAtoms.length > 0 ? backboneAtoms : undefined,
  };
}

function getAtomProperties(
  element: string
): [number, [number, number, number]] {
  switch (element.toUpperCase()) {
    case "H":
      return [0.31, [1.0, 1.0, 1.0]]; // White
    case "C":
      return [0.77, [0.5, 0.5, 0.5]]; // Gray
    case "N":
      return [0.75, [0.0, 0.0, 1.0]]; // Blue
    case "O":
      return [0.73, [1.0, 0.0, 0.0]]; // Red
    case "P":
      return [1.06, [1.0, 0.5, 0.0]]; // Orange
    case "S":
      return [1.02, [1.0, 1.0, 0.0]]; // Yellow
    default:
      return [0.75, [0.8, 0.8, 0.8]]; // Light gray
  }
}
