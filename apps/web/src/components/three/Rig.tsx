'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

/** Subtle parallax: camera drifts toward the pointer for living depth. */
export function PointerRig({ strength = 0.4 }: { strength?: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  useFrame((s) => {
    const x = s.pointer.x * strength;
    const y = s.pointer.y * strength * 0.6;
    target.current.set(camera.position.x + x, camera.position.y + y, camera.position.z);
    camera.lookAt(0, 0.4, 0);
    camera.position.x += (x - camera.position.x * 0.0) * 0.02;
    camera.position.y += (1.2 + y - camera.position.y) * 0.02;
  });
  return null;
}
