// src/components/viewer/utils/raycast.ts

import { Matrix4 } from "./matrix";

export interface Ray {
  origin: [number, number, number];
  direction: [number, number, number];
}

export function createRayFromScreen(
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  projectionMatrix: Matrix4,
  viewMatrix: Matrix4
): Ray {
  // Convert screen coordinates to clip space (-1 to 1)
  const clipX = (x / canvas.width) * 2 - 1;
  const clipY = -(y / canvas.height) * 2 + 1;

  // Create inverse matrices
  const projInverse = projectionMatrix.clone().invert();
  const viewInverse = viewMatrix.clone().invert();

  // Unproject the point
  const nearPoint = unproject(clipX, clipY, -1, projInverse, viewInverse);
  const farPoint = unproject(clipX, clipY, 1, projInverse, viewInverse);

  // Calculate ray direction
  const direction: [number, number, number] = [
    farPoint[0] - nearPoint[0],
    farPoint[1] - nearPoint[1],
    farPoint[2] - nearPoint[2],
  ];

  // Normalize direction
  const length = Math.sqrt(
    direction[0] * direction[0] +
      direction[1] * direction[1] +
      direction[2] * direction[2]
  );

  direction[0] /= length;
  direction[1] /= length;
  direction[2] /= length;

  return {
    origin: nearPoint,
    direction,
  };
}

function unproject(
  clipX: number,
  clipY: number,
  clipZ: number,
  projInverse: Matrix4,
  viewInverse: Matrix4
): [number, number, number] {
  const vec = [clipX, clipY, clipZ, 1.0];

  // Transform by inverse projection
  vec4Transform(vec, projInverse.array);

  // Transform by inverse view matrix
  vec4Transform(vec, viewInverse.array);

  // Perspective divide
  if (vec[3] !== 0) {
    vec[0] /= vec[3];
    vec[1] /= vec[3];
    vec[2] /= vec[3];
  }

  return [vec[0], vec[1], vec[2]];
}

function vec4Transform(vec: number[], matrix: Float32Array): void {
  const x = vec[0],
    y = vec[1],
    z = vec[2],
    w = vec[3];
  vec[0] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w;
  vec[1] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w;
  vec[2] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w;
  vec[3] = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w;
}

export function intersectSphere(
  ray: Ray,
  center: [number, number, number],
  radius: number
): boolean {
  const dx = ray.origin[0] - center[0];
  const dy = ray.origin[1] - center[1];
  const dz = ray.origin[2] - center[2];

  const a =
    ray.direction[0] * ray.direction[0] +
    ray.direction[1] * ray.direction[1] +
    ray.direction[2] * ray.direction[2];
  const b =
    2.0 *
    (dx * ray.direction[0] + dy * ray.direction[1] + dz * ray.direction[2]);
  const c = dx * dx + dy * dy + dz * dz - radius * radius;

  const discriminant = b * b - 4 * a * c;
  return discriminant >= 0;
}
