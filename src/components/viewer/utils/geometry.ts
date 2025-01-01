// src/components/viewer/utils/geometry.ts

export interface GeometryData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
}

export function createSphereGeometry(
  radius: number = 1,
  segments: number = 32
): GeometryData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Generate vertices
  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      // Vertex position
      positions.push(radius * x);
      positions.push(radius * y);
      positions.push(radius * z);

      // Normal vector (normalized)
      normals.push(x);
      normals.push(y);
      normals.push(z);
    }
  }

  // Generate indices
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;

      // First triangle
      indices.push(first);
      indices.push(second);
      indices.push(first + 1);

      // Second triangle
      indices.push(second);
      indices.push(second + 1);
      indices.push(first + 1);
    }
  }

  // Log buffer sizes for debugging
  console.log("Sphere geometry created:", {
    vertexCount: positions.length / 3,
    indexCount: indices.length,
    triangleCount: indices.length / 3,
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}
