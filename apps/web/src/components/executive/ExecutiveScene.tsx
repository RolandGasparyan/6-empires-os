'use client';
/** Executive Command Center — now driven by the shared room engine. */
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { RoundedBox } from '@react-three/drei';
import { DepartmentRoom, Rig, BASE } from './roomKit';
import { DEPARTMENTS } from './departments';

export default function ExecutiveScene({ onPick }: { onPick?: (id: string) => void }) {
  const pick = onPick ?? (() => {});
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [7, 5, 8], fov: 36, near: 0.1, far: 120 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Suspense fallback={null}>
        <DepartmentRoom cfg={DEPARTMENTS.executive} onPick={pick} signature={
          <>
            {/* books + leather lounge (executive signature) */}
            <group position={[1.7, 0.88, -1.0]}>
              {[0, 1, 2].map((i) => <mesh key={i} position={[0, i * 0.06, 0]} rotation={[0, i * 0.2, 0]}><boxGeometry args={[0.36, 0.05, 0.26]} /><meshStandardMaterial color={[BASE.gold, '#7a2e2e', '#27405e'][i]} roughness={0.6} /></mesh>)}
            </group>
            <RoundedBox args={[2.0, 0.4, 0.9]} radius={0.1} position={[-3.2, 0.3, 3.2]}><meshStandardMaterial color="#1a1410" roughness={0.7} /></RoundedBox>
          </>
        } />
      </Suspense>
      <Rig />
    </Canvas>
  );
}
