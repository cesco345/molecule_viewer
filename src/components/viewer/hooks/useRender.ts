// src/components/viewer/hooks/useRender.ts

import { useCallback, useRef, useEffect } from "react";
import { Matrix4 } from "../utils/matrix";
import { WebGLLocations, WebGLExtensions } from "../types";

interface RenderProps {
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
}: RenderProps) => {
  const animationFrame = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const matrices = useRef({
    modelView: new Matrix4(),
    projection: new Matrix4(),
  });

  const updateMatrices = useCallback(() => {
    if (!gl) return;

    const aspect = gl.canvas.width / gl.canvas.height;

    // Update projection matrix
    matrices.current.projection.perspective(Math.PI / 4, aspect, 0.1, 1000.0);

    // Update model-view matrix
    matrices.current.modelView
      .identity()
      .translate(position[0], position[1], position[2])
      .translate(0, 0, -distance)
      .rotateX(rotation[0])
      .rotateY(rotation[1])
      .translate(-target[0], -target[1], -target[2]);
  }, [gl, position, distance, rotation, target]);

  const setupAttributes = useCallback(() => {
    if (!gl || !locations || !extensions.instancedArrays || !buffers.instance)
      return;

    // Vertex attributes
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

    // Instance attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.instance);

    // Position (3 floats)
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

    // Color (3 floats)
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

    // Radius (1 float)
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
  }, [gl, locations, extensions, buffers]);

  const render = useCallback(() => {
    // Validate context and resources
    if (!gl) {
      console.error("Render failed: No WebGL context");
      return;
    }
    if (!program) {
      console.error("Render failed: No shader program");
      return;
    }
    if (!locations) {
      console.error("Render failed: No shader locations");
      return;
    }
    if (!extensions.instancedArrays) {
      console.error("Render failed: No instanced arrays extension");
      return;
    }
    if (
      !buffers.position ||
      !buffers.normal ||
      !buffers.index ||
      !buffers.instance
    ) {
      console.error("Render failed: Missing buffers", {
        position: !!buffers.position,
        normal: !!buffers.normal,
        index: !!buffers.index,
        instance: !!buffers.instance,
      });
      return;
    }

    try {
      // Performance monitoring
      const currentTime = performance.now();
      if (currentTime - lastFrameTime.current >= 1000) {
        console.debug("FPS:", frameCount.current);
        frameCount.current = 0;
        lastFrameTime.current = currentTime;
      }
      frameCount.current++;

      // Clear buffers
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Use shader program
      gl.useProgram(program);

      // Update and set matrices
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

      // Set up attributes
      setupAttributes();

      // Draw instances
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
      extensions.instancedArrays.drawElementsInstancedANGLE(
        gl.TRIANGLES,
        buffers.numIndices,
        gl.UNSIGNED_SHORT,
        0,
        instanceCount
      );

      // Error checking
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error("WebGL error:", error);
      }
    } catch (error) {
      console.error("Render error:", error);
    }
  }, [
    gl,
    program,
    locations,
    extensions,
    buffers,
    instanceCount,
    updateMatrices,
    setupAttributes,
  ]);

  // Animation loop
  useEffect(() => {
    let isActive = true;

    const animate = () => {
      if (!isActive) return;
      render();
      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isActive = false;
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [render]);

  return render;
};
