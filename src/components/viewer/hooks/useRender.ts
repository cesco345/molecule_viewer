// src/components/viewer/hooks/useRender.ts

import { useCallback, useRef, useEffect } from "react";
import { Matrix4 } from "../utils/matrix";
import { WebGLLocations } from "../types";

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
}

export const useRender = (props: RenderProps) => {
  const {
    gl,
    program,
    locations,
    extensions,
    buffers,
    instanceCount,
    rotation,
    distance,
  } = props;

  const animationFrame = useRef<number>();
  const matrices = useRef({
    modelView: new Matrix4(),
    projection: new Matrix4(),
  });

  const render = useCallback(() => {
    // Check all required components with detailed logging
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

    // Log render state
    console.debug("Render state:", {
      canvasSize: {
        width: gl.canvas.width,
        height: gl.canvas.height,
      },
      instanceCount,
      rotation,
      distance,
      numIndices: buffers.numIndices,
    });

    // Clear and set viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update matrices
    const aspect = gl.canvas.width / gl.canvas.height;
    matrices.current.projection.perspective(Math.PI / 4, aspect, 0.1, 1000.0);

    matrices.current.modelView
      .identity()
      .translate(0, 0, -distance)
      .rotateX(rotation[0])
      .rotateY(rotation[1]);

    // Use shader program
    gl.useProgram(program);

    // Set uniforms
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

    // Log attribute bindings
    console.debug("Binding attributes:", {
      positionLoc: locations.attributes.position,
      normalLoc: locations.attributes.normal,
      instancePosLoc: locations.attributes.instancePosition,
      instanceColorLoc: locations.attributes.instanceColor,
      instanceRadiusLoc: locations.attributes.instanceRadius,
    });

    // Set up vertex attributes
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

    // Set up instance attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.instance);

    // Instance position (3 floats)
    gl.enableVertexAttribArray(locations.attributes.instancePosition);
    gl.vertexAttribPointer(
      locations.attributes.instancePosition,
      3, // size (x, y, z)
      gl.FLOAT, // type
      false, // normalize
      28, // stride (7 floats * 4 bytes)
      0 // offset
    );
    extensions.instancedArrays.vertexAttribDivisorANGLE(
      locations.attributes.instancePosition,
      1
    );

    // Instance color (3 floats)
    gl.enableVertexAttribArray(locations.attributes.instanceColor);
    gl.vertexAttribPointer(
      locations.attributes.instanceColor,
      3, // size (r, g, b)
      gl.FLOAT, // type
      false, // normalize
      28, // stride (7 floats * 4 bytes)
      12 // offset (3 floats * 4 bytes)
    );
    extensions.instancedArrays.vertexAttribDivisorANGLE(
      locations.attributes.instanceColor,
      1
    );

    // Instance radius (1 float)
    gl.enableVertexAttribArray(locations.attributes.instanceRadius);
    gl.vertexAttribPointer(
      locations.attributes.instanceRadius,
      1, // size (radius)
      gl.FLOAT, // type
      false, // normalize
      28, // stride (7 floats * 4 bytes)
      24 // offset (6 floats * 4 bytes)
    );
    extensions.instancedArrays.vertexAttribDivisorANGLE(
      locations.attributes.instanceRadius,
      1
    );

    // Bind index buffer and draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

    try {
      extensions.instancedArrays.drawElementsInstancedANGLE(
        gl.TRIANGLES,
        buffers.numIndices,
        gl.UNSIGNED_SHORT,
        0,
        instanceCount
      );
      console.debug("Draw call completed", {
        numIndices: buffers.numIndices,
        instanceCount,
        totalVertices: buffers.numIndices * instanceCount,
      });
    } catch (error) {
      console.error("Draw call failed:", error);
    }

    // Check for GL errors
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error("WebGL error:", error);
    }
  }, [
    gl,
    program,
    locations,
    extensions,
    buffers,
    instanceCount,
    rotation,
    distance,
  ]);

  // Set up animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrame.current = requestAnimationFrame(animate);
    };

    console.log("Starting render loop");
    animate();

    return () => {
      console.log("Stopping render loop");
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [render]);

  return render;
};
