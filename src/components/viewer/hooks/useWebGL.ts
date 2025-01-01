// src/components/viewer/hooks/useWebGL.ts

import { useEffect, useState } from "react";
import { WebGLSetup } from "../types";
import { vertexShaderSource, fragmentShaderSource } from "../utils/shaders";

interface WebGLExtensions {
  instancedArrays: ANGLE_instanced_arrays | null;
}

export const useWebGL = (
  canvas: HTMLCanvasElement | null
): WebGLSetup & { extensions: WebGLExtensions } => {
  const [setup, setSetup] = useState<
    WebGLSetup & { extensions: WebGLExtensions }
  >({
    gl: null,
    program: null,
    locations: null,
    extensions: {
      instancedArrays: null,
    },
  });

  useEffect(() => {
    if (!canvas) return;

    // Initialize WebGL context
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
      depth: true,
    });

    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Get required extensions
    const instancedArrays = gl.getExtension("ANGLE_instanced_arrays");
    if (!instancedArrays) {
      console.error("ANGLE_instanced_arrays extension not supported");
      return;
    }

    // Create and compile shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) {
      console.error("Failed to create shaders");
      return;
    }

    // Create and link program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.error("Failed to create program");
      return;
    }

    // Get attribute and uniform locations
    const locations = {
      attributes: {
        position: gl.getAttribLocation(program, "position"),
        normal: gl.getAttribLocation(program, "normal"),
        instancePosition: gl.getAttribLocation(program, "instancePosition"),
        instanceColor: gl.getAttribLocation(program, "instanceColor"),
        instanceRadius: gl.getAttribLocation(program, "instanceRadius"),
      },
      uniforms: {
        modelViewMatrix: gl.getUniformLocation(program, "modelViewMatrix"),
        projectionMatrix: gl.getUniformLocation(program, "projectionMatrix"),
      },
    };

    // Verify all locations were found
    const missingAttributes = Object.entries(locations.attributes)
      .filter(([_, location]) => location === -1)
      .map(([name]) => name);

    const missingUniforms = Object.entries(locations.uniforms)
      .filter(([_, location]) => location === null)
      .map(([name]) => name);

    if (missingAttributes.length > 0) {
      console.error("Missing attributes:", missingAttributes);
      return;
    }

    if (missingUniforms.length > 0) {
      console.error("Missing uniforms:", missingUniforms);
      return;
    }

    // Enable WebGL features
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    setSetup({
      gl,
      program,
      locations,
      extensions: {
        instancedArrays,
      },
    });

    // Cleanup function
    return () => {
      if (!gl) return;

      if (program) {
        gl.deleteProgram(program);
      }
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
    };
  }, [canvas]);

  return setup;
};

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Failed to create shader object");
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) {
    console.error("Failed to create program object");
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
