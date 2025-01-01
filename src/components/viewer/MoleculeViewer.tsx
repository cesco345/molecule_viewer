"use client";
// src/components/viewer/MoleculeViewer.tsx

import { useRef, useState, useEffect } from "react";
import { useWebGL } from "./hooks/useWebGL";
import { useGeometry } from "./hooks/useGeometry";
import { useRender } from "./hooks/useRender";
import { FileUpload } from "../ui/FileUpload";
import { ViewerState, CameraState } from "./types";
import { DebugOverlay } from "./DebugOverlay";

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
  });
  const [camera, setCamera] = useState<CameraState>({
    rotation: [0, 0],
    distance: 50,
    target: [0, 0, 0],
  });

  // Initialize WebGL context and setup
  const { gl, program, locations, extensions } = useWebGL(canvasRef.current);

  // Initialize geometry with extensions
  const { buffers, updateInstanceData } = useGeometry(gl, program, extensions);

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
  });

  // Debug mode keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "d" && e.ctrlKey) {
        setDebugMode((prev) => !prev);
        console.log("Debug mode:", !debugMode);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [debugMode]);

  // Handle window resize
  useEffect(() => {
    if (!canvasRef.current || !gl) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get the actual size from the container
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      // Check if the canvas size has actually changed
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        // Update canvas size to match display size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
        console.log("Canvas resized:", {
          width: displayWidth,
          height: displayHeight,
        });
      }
    };

    // Set initial size
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [gl]);

  // Handler for PDB data
  const handlePDBData = (data: Float32Array) => {
    try {
      console.log("Loading PDB data...", {
        dataSize: data.byteLength,
        atomCount: data.length / 7,
      });

      setViewerState((prev) => ({ ...prev, isLoading: true, error: null }));
      setInstanceData(data);
      updateInstanceData(data);

      console.log("PDB data loaded successfully", {
        atoms: data.length / 7,
        dataSize: data.byteLength,
      });
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

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setViewerState((prev) => ({
      ...prev,
      isDragging: true,
      lastMousePos: { x: e.clientX, y: e.clientY },
      mouseButton: e.button,
    }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!viewerState.isDragging) return;

    const dx = e.clientX - viewerState.lastMousePos.x;
    const dy = e.clientY - viewerState.lastMousePos.y;

    // Update camera rotation
    setCamera((prev) => ({
      ...prev,
      rotation: [prev.rotation[0] + dy * 0.005, prev.rotation[1] + dx * 0.005],
    }));

    // Update last mouse position
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
    }));
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = 0.95;
    const delta = e.deltaY > 0 ? zoomFactor : 1 / zoomFactor;

    setCamera((prev) => ({
      ...prev,
      distance: Math.max(1, Math.min(100, prev.distance * delta)),
    }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
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
          },
        }}
      />

      <FileUpload onPDBLoad={handlePDBData} />

      {/* Loading overlay */}
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

      {/* Error message */}
      {viewerState.error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md">
          <p className="font-semibold">Error</p>
          <p>{viewerState.error}</p>
        </div>
      )}

      {/* Debug mode indicator */}
      {debugMode && (
        <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
          Debug Mode (Ctrl+D to toggle)
        </div>
      )}
    </div>
  );
}
