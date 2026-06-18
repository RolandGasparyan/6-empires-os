'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stage } from '@/components/three/Stage';
import { PALETTE } from '@/lib/tokens';

function neuralCloud(count: number, radius: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const r = radius * Math.cbrt(Math.random());
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pts.push(new THREE.Vector3(r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)));
  }
  return pts;
}

export function BrainScene() {
  const grp = useRef<THREE.Group>(null);
  const nodes = useMemo(() => neuralCloud(120, 3), []);
  const edges = useMemo(() => {
    const segs: number[] = [];
    nodes.forEach((a, i) => {
      nodes.forEach((b, j) => {
        if (j > i && a.distanceTo(b) < 1.15 && Math.random() > 0.5) segs.push(a.x, a.y, a.z, b.x, b.y, b.z);
      });
    });
    return new Float32Array(segs);
  }, [nodes]);
  const posArr = useMemo(() => { const a = new Float32Array(nodes.length * 3); nodes.forEach((n, i) => n.toArray(a, i * 3)); return a; }, [nodes]);
  useFrame((s, dt) => { if (grp.current) { grp.current.rotation.y += dt * 0.05; grp.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.2) * 0.15; } });
  return (
    <Stage camera={{ position: [0, 0, 8] }} bloom={1.3}>
      <group ref={grp}>
        <lineSegments>
          <bufferGeometry><bufferAttribute attach="attributes-position" count={edges.length / 3} array={edges} itemSize={3} /></bufferGeometry>
          <lineBasicMaterial color={PALETTE.gold} transparent opacity={0.18} blending={THREE.AdditiveBlending} />
        </lineSegments>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" count={nodes.length} array={posArr} itemSize={3} /></bufferGeometry>
          <pointsMaterial size={0.09} color={PALETTE.goldBright} sizeAttenuation transparent blending={THREE.AdditiveBlending} />
        </points>
        {/* central knowledge core */}
        <mesh><icosahedronGeometry args={[0.7, 1]} /><meshPhysicalMaterial color={PALETTE.obsidian2} emissive={PALETTE.cyan} emissiveIntensity={0.35} wireframe /></mesh>
      </group>
    </Stage>
  );
}

export default BrainScene;
