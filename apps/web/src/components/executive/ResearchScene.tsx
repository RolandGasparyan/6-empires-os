'use client';
/** Research Center — purple/indigo. Data walls + knowledge holograms. */
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { DepartmentRoom, Rig, Inspect, Screen, BASE } from './roomKit';
import { DEPARTMENTS } from './departments';

export default function ResearchScene({ onPick }: { onPick?: (id: string) => void }) {
  const pick = onPick ?? (() => {});
  const cfg = DEPARTMENTS.research;
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [7, 5, 8], fov: 36, near: 0.1, far: 120 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Suspense fallback={null}>
        <DepartmentRoom cfg={cfg} onPick={pick} signature={
          <>
            {/* DATA WALL — grid of live intelligence panels on the right wall */}
            <Inspect id="datawall" onPick={pick}>
              <group position={[6.8, 2.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <mesh><planeGeometry args={[6, 3]} /><meshStandardMaterial color={BASE.ink} emissive={cfg.primary} emissiveIntensity={0.12} /></mesh>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Screen key={i} position={[(i % 3 - 1) * 1.9, i < 3 ? 0.7 : -0.7, 0.05]} w={1.7} h={1.1}
                    accent={i % 2 ? cfg.primary : cfg.secondary} kind={['grid', 'chart', 'bars', 'chart', 'grid', 'bars'][i]} />
                ))}
              </group>
            </Inspect>

            {/* knowledge-graph hologram cluster on the left (extra) */}
            <group position={[-3.0, 1.4, 2.6]}>
              {Array.from({ length: 18 }).map((_, i) => {
                const a = i * 0.9, r = 0.5 + (i % 3) * 0.18;
                return <mesh key={i} position={[Math.cos(a) * r, Math.sin(i * 0.6) * 0.4, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color={cfg.primary} emissive={cfg.primary} emissiveIntensity={0.9} />
                </mesh>;
              })}
              {/* connecting lines feel via faint torus */}
              <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.006, 6, 40]} /><meshStandardMaterial color={cfg.secondary} emissive={cfg.secondary} emissiveIntensity={0.6} /></mesh>
              <mesh rotation={[0, Math.PI / 3, Math.PI / 2]}><torusGeometry args={[0.55, 0.006, 6, 40]} /><meshStandardMaterial color={cfg.primary} emissive={cfg.primary} emissiveIntensity={0.6} /></mesh>
            </group>
          </>
        } />
      </Suspense>
      <Rig />
    </Canvas>
  );
}
