// src/components/viewer/utils/matrix.ts

export class Matrix4 {
  private data: Float32Array;

  constructor() {
    this.data = new Float32Array(16);
    this.identity();
  }

  identity(): this {
    const d = this.data;
    d[0] = 1;
    d[4] = 0;
    d[8] = 0;
    d[12] = 0;
    d[1] = 0;
    d[5] = 1;
    d[9] = 0;
    d[13] = 0;
    d[2] = 0;
    d[6] = 0;
    d[10] = 1;
    d[14] = 0;
    d[3] = 0;
    d[7] = 0;
    d[11] = 0;
    d[15] = 1;
    return this;
  }

  perspective(fov: number, aspect: number, near: number, far: number): this {
    const f = 1.0 / Math.tan(fov / 2);
    const d = this.data;

    d[0] = f / aspect;
    d[4] = 0;
    d[8] = 0;
    d[12] = 0;
    d[1] = 0;
    d[5] = f;
    d[9] = 0;
    d[13] = 0;
    d[2] = 0;
    d[6] = 0;
    d[10] = (far + near) / (near - far);
    d[14] = (2 * far * near) / (near - far);
    d[3] = 0;
    d[7] = 0;
    d[11] = -1;
    d[15] = 0;

    return this;
  }

  translate(x: number, y: number, z: number): this {
    const d = this.data;
    d[12] = d[0] * x + d[4] * y + d[8] * z + d[12];
    d[13] = d[1] * x + d[5] * y + d[9] * z + d[13];
    d[14] = d[2] * x + d[6] * y + d[10] * z + d[14];
    d[15] = d[3] * x + d[7] * y + d[11] * z + d[15];
    return this;
  }

  rotateX(angle: number): this {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const d = this.data;

    const m10 = d[4],
      m11 = d[5],
      m12 = d[6],
      m13 = d[7];
    const m20 = d[8],
      m21 = d[9],
      m22 = d[10],
      m23 = d[11];

    d[4] = m10 * c + m20 * s;
    d[5] = m11 * c + m21 * s;
    d[6] = m12 * c + m22 * s;
    d[7] = m13 * c + m23 * s;
    d[8] = m20 * c - m10 * s;
    d[9] = m21 * c - m11 * s;
    d[10] = m22 * c - m12 * s;
    d[11] = m23 * c - m13 * s;

    return this;
  }

  rotateY(angle: number): this {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const d = this.data;

    const m00 = d[0],
      m01 = d[1],
      m02 = d[2],
      m03 = d[3];
    const m20 = d[8],
      m21 = d[9],
      m22 = d[10],
      m23 = d[11];

    d[0] = m00 * c - m20 * s;
    d[1] = m01 * c - m21 * s;
    d[2] = m02 * c - m22 * s;
    d[3] = m03 * c - m23 * s;
    d[8] = m00 * s + m20 * c;
    d[9] = m01 * s + m21 * c;
    d[10] = m02 * s + m22 * c;
    d[11] = m03 * s + m23 * c;

    return this;
  }

  get array(): Float32Array {
    return this.data;
  }
}
