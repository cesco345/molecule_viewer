// src/components/viewer/hooks/useGeometry.ts

import { useEffect, useRef } from "react";
import { createSphereGeometry } from "../utils/geometry";
import { WebGLExtensions } from "../types";

interface GeometryBuffers {
  position: WebGLBuffer | null;
  normal: WebGLBuffer | null;
  index: WebGLBuffer | null;
  instance: WebGLBuffer | null;
  numIndices: number;
  numVertices: number;
}

export const useGeometry = (
  gl: WebGLRenderingContext | null,
  program: WebGLProgram | null,
  extensions: WebGLExtensions
) => {
  const buffers = useRef<GeometryBuffers>({
    position: null,
    normal: null,
    index: null,
    instance: null,
    numIndices: 0,
    numVertices: 0,
  });

  useEffect(() => {
    if (!gl || !program || !extensions.instancedArrays) return;

    // Create sphere with more segments for better quality
    const sphere = createSphereGeometry(1.0, 32);

    // Create buffers
    const position = gl.createBuffer();
    const normal = gl.createBuffer();
    const index = gl.createBuffer();
    const instance = gl.createBuffer();

    if (!position || !normal || !index || !instance) {
      console.error("Failed to create buffers");
      return;
    }

    // Upload position data
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);

    // Upload normal data
    gl.bindBuffer(gl.ARRAY_BUFFER, normal);
    gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);

    // Upload index data
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

    // Store buffer information
    buffers.current = {
      position,
      normal,
      index,
      instance,
      numIndices: sphere.indices.length,
      numVertices: sphere.positions.length / 3,
    };

    console.log("Buffer sizes:", {
      numIndices: buffers.current.numIndices,
      numVertices: buffers.current.numVertices,
    });

    return () => {
      if (!gl) return;
      [position, normal, index, instance].forEach((buffer) => {
        if (buffer) gl.deleteBuffer(buffer);
      });
    };
  }, [gl, program, extensions.instancedArrays]);

  const updateInstanceData = (data: Float32Array) => {
    if (!gl || !buffers.current.instance) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.current.instance);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    console.log("Instance data updated:", {
      instanceCount: data.length / 7,
      dataSize: data.byteLength,
    });
  };

  return {
    buffers: buffers.current,
    updateInstanceData,
  };
};
