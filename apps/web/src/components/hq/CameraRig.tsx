'use client';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface CamTarget { tgt: [number, number, number]; R: number; theta: number; phi: number; }

/** Orbit + smooth fly-to camera. Drag to orbit, scroll to zoom, programmatic targets lerp in. */
export function CameraRig({ target, autoSpin }: { target: CamTarget | null; autoSpin: boolean; }) {
  const { camera, gl } = useThree();
  const st = useRef({ theta: 0, phi: 1.05, R: 14, tgt: new THREE.Vector3(-2, 1.4, 0), drag: false, px: 0, py: 0, init: false });

  // pointer handlers attached once
  const s = st.current;
  if (!s.init) {
    s.init = true;
    const el = gl.domElement;
    el.addEventListener('pointerdown', (e) => { s.drag = true; s.px = e.clientX; s.py = e.clientY; });
    window.addEventListener('pointerup', () => { s.drag = false; });
    window.addEventListener('pointermove', (e) => {
      if (!s.drag) return;
      s.theta -= (e.clientX - s.px) * 0.006;
      s.phi = Math.max(0.5, Math.min(1.45, s.phi - (e.clientY - s.py) * 0.005));
      s.px = e.clientX; s.py = e.clientY;
    });
    el.addEventListener('wheel', (e) => { e.preventDefault(); s.R = Math.max(4, Math.min(24, s.R + e.deltaY * 0.012)); }, { passive: false });
  }

  useFrame(() => {
    if (autoSpin && !s.drag) s.theta += 0.0022;
    if (target) {
      s.tgt.lerp(new THREE.Vector3(...target.tgt), 0.06);
      s.R += (target.R - s.R) * 0.06;
      const d = ((target.theta - s.theta + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      s.theta += d * 0.06;
      s.phi += (target.phi - s.phi) * 0.06;
    }
    camera.position.set(
      s.tgt.x + s.R * Math.sin(s.phi) * Math.sin(s.theta),
      s.tgt.y + s.R * Math.cos(s.phi),
      s.tgt.z + s.R * Math.sin(s.phi) * Math.cos(s.theta)
    );
    camera.lookAt(s.tgt.x, s.tgt.y - 0.2, s.tgt.z);
  });
  return null;
}
