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
import { ViewerState, CameraState, ViewMode, AtomInfo } from "./types";
import { ViewModeToggle } from "./ViewModeToggle";
import { AtomInfoDisplay } from "./AtomInfoDisplay";
import { parseAtomsWithMetadata } from "./utils/pdbParser";

export function MoleculeViewer() {
  // Refs and state
  const [atomsMetadata, setAtomsMetadata] = useState<AtomInfo[]>([]);
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
    viewMode: ViewMode.SPHERES,
  });
  const [camera, setCamera] = useState<CameraState>({
    rotation: [0, 0],
    distance: 80,
    target: [0, 0, 0],
    position: [0, 0, 0],
    velocity: [0, 0, 0],
  });

  const [backboneAtoms, setBackboneAtoms] = useState<
    | {
        position: [number, number, number];
        residueIndex: number;
        secondaryStructure: "helix" | "sheet" | "coil";
      }[]
    | null
  >(null);

  const { selectedAtom, selectAtomAtPosition } = useAtomSelection(
    camera,
    setCamera
  );

  // Initialize WebGL context and setup
  const { gl, program, locations, extensions } = useWebGL(canvasRef.current);

  // Initialize geometry with extensions
  const { buffers, updateInstanceData, updateRibbonData } = useGeometry(
    gl,
    program,
    extensions,
    viewerState.viewMode
  );

  // Initialize camera controls
  const { pan, rotate, zoom, reset } = useCameraControls(camera, setCamera);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewerState((prev) => ({ ...prev, viewMode: mode }));
    // Update ribbon data when switching to ribbon mode
    if (mode === ViewMode.RIBBON && backboneAtoms) {
      updateRibbonData(backboneAtoms);
    }
  };

  // Calculate molecule bounds and center
  const getMoleculeBounds = () => {
    if (!instanceData || instanceData.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;

    for (let i = 0; i < instanceData.length; i += 7) {
      minX = Math.min(minX, instanceData[i]);
      minY = Math.min(minY, instanceData[i + 1]);
      minZ = Math.min(minZ, instanceData[i + 2]);
      maxX = Math.max(maxX, instanceData[i]);
      maxY = Math.max(maxY, instanceData[i + 1]);
      maxZ = Math.max(maxZ, instanceData[i + 2]);
    }

    return {
      center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
      size: Math.max(maxX - minX, maxY - minY, maxZ - minZ),
    };
  };

  // Center molecule while preserving rotation
  const centerMolecule = () => {
    const bounds = getMoleculeBounds();
    if (!bounds) return;

    setCamera((prev) => ({
      ...prev,
      distance: bounds.size * 2,
      target: bounds.center as [number, number, number],
      position: bounds.center as [number, number, number],
      velocity: [0, 0, 0],
    }));
  };

  // Mouse event handlers
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

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

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!instanceData || !gl || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    selectAtomAtPosition(
      x,
      y,
      canvasRef.current,
      instanceData,
      projection,
      view
    );
  };

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
    viewMode: viewerState.viewMode,
  });

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

  // Debug mode keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "d" && e.ctrlKey) {
        setDebugMode((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        centerMolecule();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

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

  // Add effect to handle view mode changes
  useEffect(() => {
    if (viewerState.viewMode === ViewMode.RIBBON && backboneAtoms) {
      console.log("Updating ribbon data due to view mode change");
      updateRibbonData(backboneAtoms);
    }
  }, [viewerState.viewMode, backboneAtoms, updateRibbonData]);

  // PDB data handler
  const handlePDBData = async (data: Uint8Array) => {
    try {
      setViewerState((prev) => ({ ...prev, isLoading: true, error: null }));

      const text = new TextDecoder().decode(data);
      const {
        renderData,
        atomsMetadata,
        backboneAtoms: parsedBackboneAtoms,
      } = parseAtomsWithMetadata(text);

      setInstanceData(renderData);
      setAtomsMetadata(atomsMetadata);
      updateInstanceData(renderData);

      // Store backbone atoms and update ribbon if needed
      if (parsedBackboneAtoms) {
        console.log("Setting backbone atoms:", parsedBackboneAtoms.length);
        setBackboneAtoms(parsedBackboneAtoms);

        if (viewerState.viewMode === ViewMode.RIBBON) {
          updateRibbonData(parsedBackboneAtoms);
        }
      }

      // Center the molecule after a short delay
      setTimeout(centerMolecule, 100);
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
      <ViewModeToggle
        currentMode={viewerState.viewMode}
        onModeChange={handleViewModeChange}
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
      <AtomInfoDisplay
        atom={selectedAtom ? atomsMetadata[selectedAtom.index] : null}
      />

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
