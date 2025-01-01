// src/components/viewer/types.ts

export interface ViewerState {
  isLoading: boolean;
  error: string | null;
  isDragging: boolean;
  lastMousePos: { x: number; y: number };
  mouseButton: number | null;
}

export interface CameraState {
  rotation: [number, number];
  distance: number;
  target: [number, number, number];
}

export interface WebGLLocations {
  attributes: {
    position: number;
    normal: number;
    instancePosition: number;
    instanceColor: number;
    instanceRadius: number;
  };
  uniforms: {
    modelViewMatrix: WebGLUniformLocation | null;
    projectionMatrix: WebGLUniformLocation | null;
  };
}

export interface WebGLExtensions {
  instancedArrays: ANGLE_instanced_arrays | null;
}

export interface WebGLSetup {
  gl: WebGLRenderingContext | null;
  program: WebGLProgram | null;
  locations: WebGLLocations | null;
  extensions: WebGLExtensions;
}
