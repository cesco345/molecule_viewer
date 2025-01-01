import { useCallback, useRef, useEffect } from "react";
import { CameraState } from "../types";

const MOMENTUM_DECAY = 0.95;
const MIN_VELOCITY = 0.001;

export function useCameraControls(
  camera: CameraState,
  setCamera: React.Dispatch<React.SetStateAction<CameraState>>
) {
  const momentumFrame = useRef<number>();

  // Apply momentum and decay
  const updateMomentum = useCallback(() => {
    setCamera((prev) => {
      const newVelocity = prev.velocity.map((v) => v * MOMENTUM_DECAY) as [
        number,
        number,
        number
      ];
      const hasMovement = newVelocity.some((v) => Math.abs(v) > MIN_VELOCITY);

      if (!hasMovement) {
        if (momentumFrame.current) {
          cancelAnimationFrame(momentumFrame.current);
          momentumFrame.current = undefined;
        }
        return { ...prev, velocity: [0, 0, 0] };
      }

      return {
        ...prev,
        position: [
          prev.position[0] + newVelocity[0],
          prev.position[1] + newVelocity[1],
          prev.position[2] + newVelocity[2],
        ],
        target: [
          prev.target[0] + newVelocity[0],
          prev.target[1] + newVelocity[1],
          prev.target[2] + newVelocity[2],
        ],
        velocity: newVelocity,
      };
    });

    momentumFrame.current = requestAnimationFrame(updateMomentum);
  }, [setCamera]);

  // Calculate pan movement with momentum
  const pan = useCallback(
    (dx: number, dy: number) => {
      setCamera((prev) => {
        const scale = prev.distance * 0.005;
        const cosX = Math.cos(prev.rotation[0]);
        const sinX = Math.sin(prev.rotation[0]);
        const cosY = Math.cos(prev.rotation[1]);
        const sinY = Math.sin(prev.rotation[1]);

        const deltaX = (-dx * cosY + dy * sinX * sinY) * scale;
        const deltaY = -dy * cosX * scale;
        const deltaZ = (-dx * sinY - dy * sinX * cosY) * scale;

        return {
          ...prev,
          velocity: [deltaX, deltaY, deltaZ],
        };
      });

      if (!momentumFrame.current) {
        momentumFrame.current = requestAnimationFrame(updateMomentum);
      }
    },
    [setCamera, updateMomentum]
  );

  // Rotation with smoothing
  const rotate = useCallback(
    (dx: number, dy: number) => {
      setCamera((prev) => ({
        ...prev,
        rotation: [
          prev.rotation[0] + dy * 0.005,
          prev.rotation[1] + dx * 0.005,
        ],
        velocity: [0, 0, 0], // Stop momentum when rotating
      }));
    },
    [setCamera]
  );

  // Smooth zooming
  const zoom = useCallback(
    (delta: number) => {
      const zoomFactor = 0.95;
      const factor = delta > 0 ? zoomFactor : 1 / zoomFactor;

      setCamera((prev) => ({
        ...prev,
        distance: Math.max(1, Math.min(100, prev.distance * factor)),
        velocity: [0, 0, 0], // Stop momentum when zooming
      }));
    },
    [setCamera]
  );

  // Reset camera to initial position
  const reset = useCallback(() => {
    setCamera({
      rotation: [0, 0],
      distance: 50,
      target: [0, 0, 0],
      position: [0, 0, 0],
      velocity: [0, 0, 0],
    });

    if (momentumFrame.current) {
      cancelAnimationFrame(momentumFrame.current);
      momentumFrame.current = undefined;
    }
  }, [setCamera]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (momentumFrame.current) {
        cancelAnimationFrame(momentumFrame.current);
      }
    };
  }, []);

  return { pan, rotate, zoom, reset };
}