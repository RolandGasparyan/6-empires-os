'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense, ReactNode } from 'react';
import { AdaptiveDpr, Environment, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import { PALETTE } from '@/lib/tokens';

interface StageProps {
  children: ReactNode;
  camera?: { position: [number, number, number]; fov?: number };
  bloom?: number;
  fog?: [number, number];
}

/**
 * Stage — the shared cinematic Three.js canvas.
 * Volumetric-feeling fog + bloom + vignette + subtle chromatic aberration
 * give every module the Apple-Vision / JARVIS depth-of-field look.
 */
export function Stage({ children, camera = { position: [0, 1.2, 8], fov: 42 }, bloom = 1.1, fog = [9, 26] }: StageProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: camera.position, fov: camera.fov ?? 42, near: 0.1, far: 120 }}
    >
      <color attach="background" args={[PALETTE.obsidian]} />
      <fog attach="fog" args={[PALETTE.obsidian, fog[0], fog[1]]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 6]} intensity={1.1} color={PALETTE.goldBright} />
      <pointLight position={[-8, 4, -6]} intensity={40} color={PALETTE.cyan} distance={30} />
      <pointLight position={[8, -2, 4]} intensity={30} color={PALETTE.gold} distance={28} />

      <Suspense fallback={null}>
        <Environment preset="night" />
        {children}
        <Preload all />
      </Suspense>

      <EffectComposer>
        <Bloom intensity={bloom} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur radius={0.7} />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new Vector2(0.0006, 0.0009)} radialModulation={false} modulationOffset={0} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>

      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
