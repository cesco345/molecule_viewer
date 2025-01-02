// src/components/viewer/hooks/useGeometry.ts

import { useEffect, useRef } from "react";
import { createSphereGeometry } from "../utils/geometry";
import { createRibbonGeometry } from "../utils/ribbonGeometry";
import { ViewMode, WebGLExtensions } from "../types";

interface GeometryBuffers {
  // Sphere mode buffers
  position: WebGLBuffer | null;
  normal: WebGLBuffer | null;
  index: WebGLBuffer | null;
  instance: WebGLBuffer | null;
  numIndices: number;
  numVertices: number;

  // Ribbon mode buffers
  ribbonPosition: WebGLBuffer | null;
  ribbonNormal: WebGLBuffer | null;
  ribbonIndex: WebGLBuffer | null;
  ribbonColor: WebGLBuffer | null;
  ribbonNumIndices: number;
}

export const useGeometry = (
  gl: WebGLRenderingContext | null,
  program: WebGLProgram | null,
  extensions: WebGLExtensions,
  viewMode: ViewMode
) => {
  const buffers = useRef<GeometryBuffers>({
    // Sphere buffers
    position: null,
    normal: null,
    index: null,
    instance: null,
    numIndices: 0,
    numVertices: 0,

    // Ribbon buffers
    ribbonPosition: null,
    ribbonNormal: null,
    ribbonIndex: null,
    ribbonColor: null,
    ribbonNumIndices: 0,
  });

  // Initialize sphere geometry
  useEffect(() => {
    if (!gl || !program) {
      console.log("WebGL context or program not ready");
      return;
    }

    console.log("Initializing sphere geometry buffers");

    try {
      // Create sphere geometry
      const sphere = createSphereGeometry(1.0, 32);

      // Create buffers
      const position = gl.createBuffer();
      const normal = gl.createBuffer();
      const index = gl.createBuffer();
      const instance = gl.createBuffer();

      if (!position || !normal || !index || !instance) {
        throw new Error("Failed to create sphere buffers");
      }

      // Upload sphere geometry data
      gl.bindBuffer(gl.ARRAY_BUFFER, position);
      gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, normal);
      gl.bufferData(gl.ARRAY_BUFFER, sphere.normals, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

      // Initialize instance buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, instance);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(0), gl.DYNAMIC_DRAW);

      // Update sphere buffers
      buffers.current = {
        ...buffers.current,
        position,
        normal,
        index,
        instance,
        numIndices: sphere.indices.length,
        numVertices: sphere.positions.length / 3,
      };

      console.log("Sphere buffers initialized successfully");
    } catch (error) {
      console.error("Error initializing sphere buffers:", error);
    }

    return () => {
      if (!gl) return;

      // Only cleanup sphere buffers
      const sphereBuffers = [
        buffers.current.position,
        buffers.current.normal,
        buffers.current.index,
        buffers.current.instance,
      ];

      sphereBuffers.forEach((buffer) => {
        if (buffer) gl.deleteBuffer(buffer);
      });
    };
  }, [gl, program]);

  // Initialize ribbon geometry (only when in ribbon mode)
  useEffect(() => {
    if (!gl || !program || viewMode !== ViewMode.RIBBON) return;

    console.log("Initializing ribbon geometry buffers");

    try {
      // Create buffers for ribbon mode
      const ribbonPosition = gl.createBuffer();
      const ribbonNormal = gl.createBuffer();
      const ribbonIndex = gl.createBuffer();
      const ribbonColor = gl.createBuffer();

      if (!ribbonPosition || !ribbonNormal || !ribbonIndex || !ribbonColor) {
        throw new Error("Failed to create ribbon buffers");
      }

      buffers.current = {
        ...buffers.current,
        ribbonPosition,
        ribbonNormal,
        ribbonIndex,
        ribbonColor,
        ribbonNumIndices: 0, // Will be updated when data is loaded
      };

      console.log("Ribbon buffers initialized successfully");
    } catch (error) {
      console.error("Error initializing ribbon buffers:", error);
    }

    return () => {
      if (!gl) return;

      // Only cleanup ribbon buffers
      const ribbonBuffers = [
        buffers.current.ribbonPosition,
        buffers.current.ribbonNormal,
        buffers.current.ribbonIndex,
        buffers.current.ribbonColor,
      ];

      ribbonBuffers.forEach((buffer) => {
        if (buffer) gl.deleteBuffer(buffer);
      });
    };
  }, [gl, program, viewMode]);

  // Update instance data (for sphere mode)
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

  // Update ribbon data (for ribbon mode)
  const updateRibbonData = (backboneAtoms: any[]) => {
    if (
      !gl ||
      !buffers.current.ribbonPosition ||
      viewMode !== ViewMode.RIBBON
    ) {
      return;
    }

    try {
      const ribbonGeometry = createRibbonGeometry(backboneAtoms);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.current.ribbonPosition);
      gl.bufferData(gl.ARRAY_BUFFER, ribbonGeometry.positions, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.current.ribbonNormal);
      gl.bufferData(gl.ARRAY_BUFFER, ribbonGeometry.normals, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.current.ribbonColor);
      gl.bufferData(gl.ARRAY_BUFFER, ribbonGeometry.colors, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.current.ribbonIndex);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        ribbonGeometry.indices,
        gl.STATIC_DRAW
      );

      buffers.current.ribbonNumIndices = ribbonGeometry.indices.length;

      console.log("Ribbon geometry updated successfully");
    } catch (error) {
      console.error("Error updating ribbon geometry:", error);
    }
  };

  return {
    buffers: buffers.current,
    updateInstanceData,
    updateRibbonData,
  };
};
