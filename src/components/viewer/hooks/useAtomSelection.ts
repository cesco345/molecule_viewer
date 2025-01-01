// src/components/viewer/hooks/useAtomSelection.ts

import { useState, useCallback, useRef } from "react";
import { createRayFromScreen, intersectSphere } from "../utils/raycast";
import { Matrix4 } from "../utils/matrix";
import { CameraState } from "../types";

interface AtomSelection {
  index: number;
  position: [number, number, number];
}

const ANIMATION_DURATION = 500; // ms

export function useAtomSelection(
  camera: CameraState,
  setCamera: React.Dispatch<React.SetStateAction<CameraState>>
) {
  const [selectedAtom, setSelectedAtom] = useState<AtomSelection | null>(null);
  const animationRef = useRef<number>();

  const selectAtomAtPosition = useCallback(
    (
      x: number,
      y: number,
      canvas: HTMLCanvasElement,
      instanceData: Float32Array,
      projectionMatrix: Matrix4,
      viewMatrix: Matrix4
    ) => {
      console.log("Starting atom selection");
      const ray = createRayFromScreen(
        x,
        y,
        canvas,
        projectionMatrix,
        viewMatrix
      );
      console.log("Created ray:", ray);

      let closestAtom: AtomSelection | null = null;
      let closestDistance = Infinity;
      let intersectionCount = 0;

      // Check intersection with each atom
      for (let i = 0; i < instanceData.length; i += 7) {
        const position: [number, number, number] = [
          instanceData[i],
          instanceData[i + 1],
          instanceData[i + 2],
        ];
        const radius = instanceData[i + 6];

        if (intersectSphere(ray, position, radius)) {
          intersectionCount++;
          // Calculate distance to atom center
          const dx = position[0] - ray.origin[0];
          const dy = position[1] - ray.origin[1];
          const dz = position[2] - ray.origin[2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestAtom = {
              index: i / 7,
              position,
            };
          }
        }
      }

      console.log("Intersection results:", {
        totalAtoms: instanceData.length / 7,
        intersectionCount,
        closestAtom,
      });

      if (closestAtom) {
        console.log("Selected atom:", closestAtom);
        setSelectedAtom(closestAtom);
        animateCameraToAtom(closestAtom.position);
      } else {
        console.log("No atom found at click position");
      }
    },
    []
  );

  const animateCameraToAtom = useCallback(
    (targetPosition: [number, number, number]) => {
      console.log("Starting camera animation to position:", targetPosition);
      const startTime = performance.now();
      const startPosition = [...camera.position] as [number, number, number];
      const startTarget = [...camera.target] as [number, number, number];

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        // Ease-in-out function
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const newPosition: [number, number, number] = [
          startPosition[0] + (targetPosition[0] - startPosition[0]) * eased,
          startPosition[1] + (targetPosition[1] - startPosition[1]) * eased,
          startPosition[2] + (targetPosition[2] - startPosition[2]) * eased,
        ];

        const newTarget: [number, number, number] = [
          startTarget[0] + (targetPosition[0] - startTarget[0]) * eased,
          startTarget[1] + (targetPosition[1] - startTarget[1]) * eased,
          startTarget[2] + (targetPosition[2] - startTarget[2]) * eased,
        ];

        setCamera((prev) => ({
          ...prev,
          position: newPosition,
          target: newTarget,
          velocity: [0, 0, 0], // Stop any existing momentum
        }));

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [camera.position, camera.target, setCamera]
  );

  return {
    selectedAtom,
    selectAtomAtPosition,
  };
}
