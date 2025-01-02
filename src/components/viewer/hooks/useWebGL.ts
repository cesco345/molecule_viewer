// src/components/viewer/hooks/useWebGL.ts

import { useEffect, useState } from "react";
import { WebGLSetup, WebGLLocations } from "../types";
import { vertexShaderSource, fragmentShaderSource } from "../utils/shaders";

export const useWebGL = (canvas: HTMLCanvasElement | null): WebGLSetup => {
  const [setup, setSetup] = useState<WebGLSetup>({
    gl: null,
    program: null,
    locations: null,
    extensions: {
      instancedArrays: null,
    },
  });

  useEffect(() => {
    if (!canvas) {
      console.log("Canvas not available yet");
      return;
    }

    let isActive = true;
    console.log("Initializing WebGL context");

    // Initialize WebGL context
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
      depth: true,
    });

    if (!gl) {
      console.error("WebGL not available");
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

    gl.useProgram(program);

    // Get attribute and uniform locations
    const locations: WebGLLocations = {
      attributes: {
        position: gl.getAttribLocation(program, "position"),
        normal: gl.getAttribLocation(program, "normal"),
        instancePosition: gl.getAttribLocation(program, "instancePosition"),
        instanceColor: gl.getAttribLocation(program, "instanceColor"),
        instanceRadius: gl.getAttribLocation(program, "instanceRadius"),
        color: gl.getAttribLocation(program, "color"),
      },
      uniforms: {
        modelViewMatrix: gl.getUniformLocation(program, "modelViewMatrix"),
        projectionMatrix: gl.getUniformLocation(program, "projectionMatrix"),
        viewMode: gl.getUniformLocation(program, "viewMode"),
      },
    };

    // Verify locations
    console.log("Shader locations:", {
      attributes: Object.entries(locations.attributes).map(
        ([name, loc]) => `${name}: ${loc}`
      ),
      uniforms: Object.entries(locations.uniforms).map(
        ([name, loc]) => `${name}: ${loc !== null}`
      ),
    });

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    if (isActive) {
      setSetup({
        gl,
        program,
        locations,
        extensions: {
          instancedArrays,
        },
      });
    }

    console.log("WebGL initialization complete");

    return () => {
      isActive = false;

      if (gl) {
        // Cleanup WebGL resources
        if (program) {
          gl.deleteProgram(program);
        }
        if (vertexShader) {
          gl.deleteShader(vertexShader);
        }
        if (fragmentShader) {
          gl.deleteShader(fragmentShader);
        }

        // Disable vertex attribute arrays
        for (const key in locations.attributes) {
          gl.disableVertexAttribArray(locations.attributes[key]);
        }

        // Reset context
        const loseContext = gl.getExtension("WEBGL_lose_context");
        if (loseContext) {
          loseContext.loseContext();
        }

        setSetup({
          gl: null,
          program: null,
          locations: null,
          extensions: { instancedArrays: null },
        });
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

  console.log(
    `${
      type === gl.VERTEX_SHADER ? "Vertex" : "Fragment"
    } shader compiled successfully`
  );
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

  console.log("Program linked successfully");
  return program;
}
