"use client";
import { useAtomSelection } from "./hooks/useAtomSelection";
import { Matrix4 } from "./utils/matrix";
import { useRef, useState, useEffect } from "react";
import { useWebGL } from "./hooks/useWebGL";
import { useGeometry } from "./hooks/useGeometry";
import { useRender } from "./hooks/useRender";
import { useCameraControls } from "./hooks/useCameraControls";
import { FileUpload } from "../ui/FileUpload";
import { DebugOverlay } from "./DebugOverlay";
import { ControlsOverlay } from "./ControlsOverlay";
import { ViewerState, CameraState } from "./types";

export function MoleculeViewer() {
  // Refs and state

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [instanceData, setInstanceData] = useState<Float32Array | null>(null);
  const [debugMode, setDebugMode] = useState(
    process.env.NODE_ENV === "development"
  );
  const [viewerState, setViewerState] = useState<ViewerState>({
    isLoading: false,
    error: null,
    isDragging: false,
    lastMousePos: { x: 0, y: 0 },
    mouseButton: null,
    isPanning: false,
  });
  const [camera, setCamera] = useState<CameraState>({
    rotation: [0, 0],
    distance: 50,
    target: [0, 0, 0],
    position: [0, 0, 0],
    velocity: [0, 0, 0],
  });
  const { selectedAtom, selectAtomAtPosition } = useAtomSelection(
    camera,
    setCamera
  );
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log("Double click detected");

    if (!instanceData || !gl || !canvasRef.current) {
      console.log("Missing required data:", {
        hasInstanceData: !!instanceData,
        hasGL: !!gl,
        hasCanvas: !!canvasRef.current,
      });
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log("Click coordinates:", { x, y });

    // Create view and projection matrices
    const projection = new Matrix4();
    projection.perspective(
      Math.PI / 4,
      canvasRef.current.width / canvasRef.current.height,
      0.1,
      1000.0
    );

    const view = new Matrix4();
    view
      .identity()
      .translate(camera.position[0], camera.position[1], camera.position[2])
      .translate(0, 0, -camera.distance)
      .rotateX(camera.rotation[0])
      .rotateY(camera.rotation[1])
      .translate(-camera.target[0], -camera.target[1], -camera.target[2]);

    console.log("Camera state:", {
      position: camera.position,
      rotation: camera.rotation,
      distance: camera.distance,
      target: camera.target,
    });

    selectAtomAtPosition(
      x,
      y,
      canvasRef.current,
      instanceData,
      projection,
      view
    );
  };
  // Initialize WebGL context and setup
  const { gl, program, locations, extensions } = useWebGL(canvasRef.current);

  // Initialize geometry with extensions
  const { buffers, updateInstanceData } = useGeometry(gl, program, extensions);

  // Initialize camera controls
  const { pan, rotate, zoom, reset } = useCameraControls(camera, setCamera);

  // Initialize render loop
  useRender({
    gl,
    program,
    locations,
    extensions,
    buffers,
    instanceCount: instanceData ? instanceData.length / 7 : 0,
    rotation: camera.rotation,
    distance: camera.distance,
    position: camera.position,
    target: camera.target,
  });

  // Debug mode keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "d" && e.ctrlKey) {
        setDebugMode((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        reset();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [reset]);

  // Keyboard controls for panning
  useEffect(() => {
    let keysPressed = new Set<string>();
    const keySpeed = 1;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.add(e.key);

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();

        let dx = 0,
          dy = 0;
        if (keysPressed.has("ArrowLeft")) dx += keySpeed;
        if (keysPressed.has("ArrowRight")) dx -= keySpeed;
        if (keysPressed.has("ArrowUp")) dy += keySpeed;
        if (keysPressed.has("ArrowDown")) dy -= keySpeed;

        pan(dx, dy);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pan]);

  // Window resize handler
  useEffect(() => {
    if (!canvasRef.current || !gl) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gl]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const isPanning = e.button === 1 || (e.button === 0 && e.shiftKey);
    setViewerState((prev) => ({
      ...prev,
      isDragging: true,
      lastMousePos: { x: e.clientX, y: e.clientY },
      mouseButton: e.button,
      isPanning,
    }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!viewerState.isDragging) return;

    const dx = e.clientX - viewerState.lastMousePos.x;
    const dy = e.clientY - viewerState.lastMousePos.y;

    if (viewerState.isPanning) {
      pan(dx, dy);
    } else {
      rotate(dx, dy);
    }

    setViewerState((prev) => ({
      ...prev,
      lastMousePos: { x: e.clientX, y: e.clientY },
    }));
  };

  const handleMouseUp = () => {
    setViewerState((prev) => ({
      ...prev,
      isDragging: false,
      mouseButton: null,
      isPanning: false,
    }));
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    zoom(e.deltaY);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // PDB data handler
  const handlePDBData = (data: Float32Array) => {
    try {
      setViewerState((prev) => ({ ...prev, isLoading: true, error: null }));
      setInstanceData(data);
      updateInstanceData(data);
      reset(); // Reset camera when loading new molecule
    } catch (error) {
      console.error("Error loading PDB data:", error);
      setViewerState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load molecule data",
      }));
    } finally {
      setViewerState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
      />

      <DebugOverlay
        isVisible={debugMode}
        stats={{
          instanceCount: instanceData ? instanceData.length / 7 : 0,
          bufferSizes: {
            vertices: buffers.numVertices || 0,
            indices: buffers.numIndices || 0,
          },
          camera: {
            rotation: camera.rotation,
            distance: camera.distance,
            position: camera.position,
          },
        }}
      />

      <ControlsOverlay isPanning={viewerState.isPanning} showControls={true} />
      {selectedAtom && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded">
          Selected Atom {selectedAtom.index + 1}
        </div>
      )}

      <FileUpload onPDBLoad={handlePDBData} />

      {viewerState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading molecule...</span>
            </div>
          </div>
        </div>
      )}

      {viewerState.error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md">
          <p className="font-semibold">Error</p>
          <p>{viewerState.error}</p>
        </div>
      )}

      {debugMode && (
        <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
          Debug Mode (Ctrl+D to toggle)
        </div>
      )}
    </div>
  );
}
