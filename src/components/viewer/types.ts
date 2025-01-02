export enum ViewMode {
  SPHERES = "spheres",
  RIBBON = "ribbon",
}
export interface AtomInfo {
  index: number;
  position: [number, number, number];
  residueName: string; // Three letter amino acid code
  atomName: string; // Atom name (e.g., CA, CB, N, O)
  residueNumber: number; // Residue sequence number
  chain: string; // Chain identifier
}
export interface ViewerState {
  isLoading: boolean;
  error: string | null;
  isDragging: boolean;
  lastMousePos: { x: number; y: number };
  mouseButton: number | null;
  isPanning: boolean;
  viewMode: ViewMode;
}

export interface CameraState {
  rotation: [number, number];
  distance: number;
  target: [number, number, number];
  position: [number, number, number];
  velocity: [number, number, number]; // For momentum
}

export interface WebGLLocations {
  attributes: {
    position: number;
    normal: number;
    instancePosition: number;
    instanceColor: number;
    instanceRadius: number;
    color: number; // Added for ribbon mode
  };
  uniforms: {
    modelViewMatrix: WebGLUniformLocation | null;
    projectionMatrix: WebGLUniformLocation | null;
    viewMode: WebGLUniformLocation | null;
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

export interface CameraControls {
  reset: () => void;
  pan: (dx: number, dy: number) => void;
  rotate: (dx: number, dy: number) => void;
  zoom: (delta: number) => void;
}
