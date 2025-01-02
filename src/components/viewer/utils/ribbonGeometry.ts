interface BackboneAtom {
  position: [number, number, number];
  residueIndex: number;
  secondaryStructure: "helix" | "sheet" | "coil";
}

function normalize(v: number[]): number[] {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return length === 0
    ? [0, 0, 0]
    : [v[0] / length, v[1] / length, v[2] / length];
}

function subtract(a: number[], b: number[]): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function add(a: number[], b: number[]): number[] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(v: number[], s: number): number[] {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function cross(a: number[], b: number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// Calculate Catmull-Rom spline point
function catmullRomSpline(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  t: number
): number[] {
  const t2 = t * t;
  const t3 = t2 * t;

  const v0 = scale(p0, -0.5 * t3 + t2 - 0.5 * t);
  const v1 = scale(p1, 1.5 * t3 - 2.5 * t2 + 1.0);
  const v2 = scale(p2, -1.5 * t3 + 2.0 * t2 + 0.5 * t);
  const v3 = scale(p3, 0.5 * t3 - 0.5 * t2);

  return add(add(v0, v1), add(v2, v3));
}

export function createRibbonGeometry(backboneAtoms: BackboneAtom[]) {
  if (backboneAtoms.length < 4) {
    return {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      indices: new Uint16Array(0),
      colors: new Float32Array(0),
    };
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  // Parameters for different secondary structures
  const params = {
    helix: {
      width: 1.8, // Helix diameter
      thickness: 0.3, // Ribbon thickness
      segments: 12, // Segments per residue
      twist: Math.PI * 2, // Full twist per residue
      rise: 1.5, // Vertical rise per turn
    },
    sheet: {
      width: 2.5, // Sheet width
      thickness: 0.2, // Sheet thickness
      segments: 4, // Segments per residue
      arrowWidth: 3.5, // Width at arrow tip
    },
    coil: {
      width: 0.6, // Coil width
      thickness: 0.2, // Coil thickness
      segments: 6, // Segments per residue
    },
  };

  // Add padding control points for spline calculation
  const padded = [
    backboneAtoms[0],
    ...backboneAtoms,
    backboneAtoms[backboneAtoms.length - 1],
  ];

  // Generate ribbon geometry
  for (let i = 1; i < padded.length - 2; i++) {
    const curr = padded[i];
    const structure = curr.secondaryStructure;
    const p0 = padded[i - 1].position;
    const p1 = curr.position;
    const p2 = padded[i + 1].position;
    const p3 = padded[i + 2].position;

    const segments = params[structure].segments;

    for (let j = 0; j < segments; j++) {
      const t = j / segments;
      const nextT = (j + 1) / segments;

      // Calculate spline points
      const pos = catmullRomSpline(p0, p1, p2, p3, t);
      const nextPos = catmullRomSpline(p0, p1, p2, p3, nextT);

      // Calculate tangent and normal vectors
      const tangent = normalize(subtract(nextPos, pos));
      const up = [0, 1, 0];
      let right = normalize(cross(tangent, up));
      let normal = normalize(cross(right, tangent));

      // Adjust vectors based on secondary structure
      if (structure === "helix") {
        // Create helical twist
        const twist = (t + i - 1) * params.helix.twist;
        const rotatedRight = [
          right[0] * Math.cos(twist) - normal[0] * Math.sin(twist),
          right[1] * Math.cos(twist) - normal[1] * Math.sin(twist),
          right[2] * Math.cos(twist) - normal[2] * Math.sin(twist),
        ];
        const rotatedNormal = [
          right[0] * Math.sin(twist) + normal[0] * Math.cos(twist),
          right[1] * Math.sin(twist) + normal[1] * Math.cos(twist),
          right[2] * Math.sin(twist) + normal[2] * Math.cos(twist),
        ];
        right = rotatedRight;
        normal = rotatedNormal;

        // Add helical rise
        pos[1] += (t + i - 1) * params.helix.rise;
      }

      const width =
        structure === "sheet"
          ? params.sheet.width * (1 + (i / padded.length) * 0.5) // Gradually widen for arrow
          : params[structure].width;

      const thickness = params[structure].thickness;

      // Generate vertices for cross-section
      const baseIndex = positions.length / 3;
      if (structure === "sheet") {
        // Flat ribbon for sheets with slight arrow shape
        positions.push(
          ...add(pos, scale(right, width / 2)),
          ...add(pos, scale(normal, thickness)),
          ...subtract(pos, scale(right, width / 2)),
          ...subtract(pos, scale(normal, thickness))
        );
      } else {
        // Curved cross-section for helices and coils
        const vertexCount = 8;
        for (let k = 0; k < vertexCount; k++) {
          const angle = (k / vertexCount) * Math.PI * 2;
          const r =
            structure === "helix"
              ? params.helix.width / 2
              : params.coil.width / 2;
          const vertexPos = add(pos, [
            right[0] * r * Math.cos(angle) + normal[0] * r * Math.sin(angle),
            right[1] * r * Math.cos(angle) + normal[1] * r * Math.sin(angle),
            right[2] * r * Math.cos(angle) + normal[2] * r * Math.sin(angle),
          ]);
          positions.push(...vertexPos);
        }
      }

      // Add normals
      const vertexCount = structure === "sheet" ? 4 : 8;
      for (let k = 0; k < vertexCount; k++) {
        normals.push(...normal);
      }

      // Add indices for triangle strip
      if (j > 0) {
        if (structure === "sheet") {
          // Indices for flat ribbon
          indices.push(
            baseIndex - 4,
            baseIndex - 3,
            baseIndex,
            baseIndex - 3,
            baseIndex + 1,
            baseIndex,
            baseIndex - 2,
            baseIndex - 1,
            baseIndex + 2,
            baseIndex - 1,
            baseIndex + 3,
            baseIndex + 2
          );
        } else {
          // Indices for curved cross-section
          for (let k = 0; k < vertexCount; k++) {
            const next = (k + 1) % vertexCount;
            indices.push(
              baseIndex - vertexCount + k,
              baseIndex - vertexCount + next,
              baseIndex + k,
              baseIndex - vertexCount + next,
              baseIndex + next,
              baseIndex + k
            );
          }
        }
      }

      // Add colors
      const color =
        structure === "helix"
          ? [0.8, 0.3, 0.3] // Red for helix
          : structure === "sheet"
          ? [0.3, 0.5, 0.8] // Blue for sheet
          : [0.8, 0.8, 0.8]; // Light gray for coil

      for (let k = 0; k < vertexCount; k++) {
        colors.push(...color);
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    colors: new Float32Array(colors),
  };
}
