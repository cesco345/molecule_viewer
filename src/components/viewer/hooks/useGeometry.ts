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

  // Initialize buffers
  useEffect(() => {
    if (!gl || !program) {
      console.log("WebGL context or program not ready");
      return;
    }

    console.log("Initializing geometry buffers");

    try {
      // Create sphere geometry
      const sphere = createSphereGeometry(1.0, 32);
      console.log("Sphere geometry created:", {
        vertices: sphere.positions.length / 3,
        indices: sphere.indices.length,
      });

      // Create buffers
      const position = gl.createBuffer();
      const normal = gl.createBuffer();
      const index = gl.createBuffer();
      const instance = gl.createBuffer();

      if (!position || !normal || !index || !instance) {
        throw new Error("Failed to create buffers");
      }

      // Upload sphere geometry data
      gl.bindBuffer(gl.ARRAY_BUFFER, position);
      gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, normal);
      gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

      // Initialize instance buffer with empty data
      gl.bindBuffer(gl.ARRAY_BUFFER, instance);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(0), gl.DYNAMIC_DRAW);

      buffers.current = {
        position,
        normal,
        index,
        instance,
        numIndices: sphere.indices.length,
        numVertices: sphere.positions.length / 3,
      };

      console.log("Buffers initialized successfully", {
        numIndices: buffers.current.numIndices,
        numVertices: buffers.current.numVertices,
      });
    } catch (error) {
      console.error("Error initializing buffers:", error);
    }

    // Cleanup
    return () => {
      if (!gl) return;
      try {
        Object.values(buffers.current).forEach((buffer) => {
          if (buffer && typeof buffer !== "number") {
            gl.deleteBuffer(buffer);
          }
        });
        buffers.current = {
          position: null,
          normal: null,
          index: null,
          instance: null,
          numIndices: 0,
          numVertices: 0,
        };
      } catch (error) {
        console.error("Error cleaning up buffers:", error);
      }
    };
  }, [gl, program]);

  // Update instance data
  const updateInstanceData = (data: Float32Array) => {
    if (!gl || !buffers.current.instance) {
      console.error(
        "Cannot update instance data: WebGL or buffer not initialized"
      );
      return;
    }

    try {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.current.instance);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      console.log("Instance data updated", {
        dataLength: data.length,
        numInstances: data.length / 7,
      });
    } catch (error) {
      console.error("Error updating instance data:", error);
    }
  };

  return {
    buffers: buffers.current,
    updateInstanceData,
  };
};
