import { useCallback, useRef, useEffect, useState } from "react";
import { Matrix4 } from "../utils/matrix";
import { WebGLLocations, WebGLExtensions, ViewMode } from "../types";

interface RenderProps {
  viewMode: ViewMode;
  gl: WebGLRenderingContext | null;
  program: WebGLProgram | null;
  locations: WebGLLocations | null;
  extensions: WebGLExtensions;
  buffers: {
    position: WebGLBuffer | null;
    normal: WebGLBuffer | null;
    index: WebGLBuffer | null;
    instance: WebGLBuffer | null;
    numIndices: number;
    ribbonPosition: WebGLBuffer | null;
    ribbonNormal: WebGLBuffer | null;
    ribbonColor: WebGLBuffer | null;
    ribbonIndex: WebGLBuffer | null;
    ribbonNumIndices: number;
  };
  instanceCount: number;
  rotation: [number, number];
  distance: number;
  position: [number, number, number];
  target: [number, number, number];
}

export const useRender = ({
  gl,
  program,
  locations,
  extensions,
  buffers,
  instanceCount,
  rotation,
  distance,
  position,
  target,
  viewMode,
}: RenderProps) => {
  const animationFrame = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const isFirstRender = useRef(true);
  const matrices = useRef({
    modelView: new Matrix4(),
    projection: new Matrix4(),
  });

  // Track if we've initialized WebGL components
  const [isInitialized, setIsInitialized] = useState(false);

  // Verify WebGL setup
  useEffect(() => {
    if (gl && program && locations) {
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
    }
  }, [gl, program, locations]);

  const updateMatrices = useCallback(() => {
    if (!gl) return;

    const aspect = gl.canvas.width / gl.canvas.height;
    matrices.current.projection.perspective(Math.PI / 4, aspect, 0.1, 1000.0);
    matrices.current.modelView
      .identity()
      .translate(position[0], position[1], position[2])
      .translate(0, 0, -distance)
      .rotateX(rotation[0])
      .rotateY(rotation[1])
      .translate(-target[0], -target[1], -target[2]);
  }, [gl, position, distance, rotation, target]);

  const setupSphereAttributes = useCallback(() => {
    if (!gl || !locations || !extensions.instancedArrays || !buffers.instance)
      return;

    try {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.enableVertexAttribArray(locations.attributes.position);
      gl.vertexAttribPointer(
        locations.attributes.position,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.enableVertexAttribArray(locations.attributes.normal);
      gl.vertexAttribPointer(
        locations.attributes.normal,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.instance);

      gl.enableVertexAttribArray(locations.attributes.instancePosition);
      gl.vertexAttribPointer(
        locations.attributes.instancePosition,
        3,
        gl.FLOAT,
        false,
        28,
        0
      );
      extensions.instancedArrays.vertexAttribDivisorANGLE(
        locations.attributes.instancePosition,
        1
      );

      gl.enableVertexAttribArray(locations.attributes.instanceColor);
      gl.vertexAttribPointer(
        locations.attributes.instanceColor,
        3,
        gl.FLOAT,
        false,
        28,
        12
      );
      extensions.instancedArrays.vertexAttribDivisorANGLE(
        locations.attributes.instanceColor,
        1
      );

      gl.enableVertexAttribArray(locations.attributes.instanceRadius);
      gl.vertexAttribPointer(
        locations.attributes.instanceRadius,
        1,
        gl.FLOAT,
        false,
        28,
        24
      );
      extensions.instancedArrays.vertexAttribDivisorANGLE(
        locations.attributes.instanceRadius,
        1
      );
    } catch (error) {
      console.error("Error setting up sphere attributes:", error);
    }
  }, [gl, locations, extensions, buffers]);

  const setupRibbonAttributes = useCallback(() => {
    if (!gl || !locations || !buffers.ribbonPosition) return;

    try {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.ribbonPosition);
      gl.enableVertexAttribArray(locations.attributes.position);
      gl.vertexAttribPointer(
        locations.attributes.position,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.ribbonNormal);
      gl.enableVertexAttribArray(locations.attributes.normal);
      gl.vertexAttribPointer(
        locations.attributes.normal,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.ribbonColor);
      gl.enableVertexAttribArray(locations.attributes.color);
      gl.vertexAttribPointer(
        locations.attributes.color,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );
    } catch (error) {
      console.error("Error setting up ribbon attributes:", error);
    }
  }, [gl, locations, buffers]);

  const render = useCallback(() => {
    if (!isInitialized) {
      return;
    }

    if (!gl || !program || !locations) {
      return;
    }

    try {
      const currentTime = performance.now();
      if (currentTime - lastFrameTime.current >= 1000) {
        console.debug("FPS:", frameCount.current);
        frameCount.current = 0;
        lastFrameTime.current = currentTime;
      }
      frameCount.current++;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);

      updateMatrices();
      gl.uniformMatrix4fv(
        locations.uniforms.modelViewMatrix,
        false,
        matrices.current.modelView.array
      );
      gl.uniformMatrix4fv(
        locations.uniforms.projectionMatrix,
        false,
        matrices.current.projection.array
      );

      gl.uniform1i(
        locations.uniforms.viewMode,
        viewMode === ViewMode.RIBBON ? 1 : 0
      );

      if (viewMode === ViewMode.SPHERES) {
        if (!extensions.instancedArrays || !buffers.instance) {
          console.debug("Missing sphere mode requirements");
          return;
        }
        setupSphereAttributes();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
        extensions.instancedArrays.drawElementsInstancedANGLE(
          gl.TRIANGLES,
          buffers.numIndices,
          gl.UNSIGNED_SHORT,
          0,
          instanceCount
        );
      } else {
        if (!buffers.ribbonPosition) {
          console.debug("Missing ribbon mode requirements");
          return;
        }
        setupRibbonAttributes();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.ribbonIndex);
        gl.drawElements(
          gl.TRIANGLES,
          buffers.ribbonNumIndices,
          gl.UNSIGNED_SHORT,
          0
        );
      }

      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.debug("WebGL error:", error);
      }
    } catch (error) {
      console.error("Render error:", error);
    }
  }, [
    isInitialized,
    gl,
    program,
    locations,
    extensions,
    buffers,
    instanceCount,
    viewMode,
    updateMatrices,
    setupSphereAttributes,
    setupRibbonAttributes,
  ]);

  useEffect(() => {
    let isActive = true;

    const animate = () => {
      if (!isActive) return;
      render();
      animationFrame.current = requestAnimationFrame(animate);
    };

    if (isInitialized) {
      animate();
    }

    return () => {
      isActive = false;
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      // Clean up vertex attributes if we have GL context
      if (gl && locations) {
        Object.values(locations.attributes).forEach((location) => {
          gl.disableVertexAttribArray(location);
        });
      }
    };
  }, [isInitialized, render, gl, locations]);

  return render;
};
