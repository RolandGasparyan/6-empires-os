'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stage } from '@/components/three/Stage';
import { GoldParticles } from '@/components/three/GoldParticles';
import { PALETTE } from '@/lib/tokens';
import { GLOBE_NODES } from '@/data/mock';

const R = 2.6;
function llToVec(lat: number, lng: number, r = R) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function Arc({ a, b }: { a: THREE.Vector3; b: THREE.Vector3 }) {
  const curve = useMemo(() => {
    const mid = a.clone().add(b).multiplyScalar(0.5).setLength(R * 1.5);
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [a, b]);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.012, 6, false), [curve]);
  return <mesh geometry={geo}><meshBasicMaterial color={PALETTE.gold} transparent opacity={0.5} blending={THREE.AdditiveBlending} /></mesh>;
}

export function GlobeScene() {
  const grp = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.08; });
  const nodes = GLOBE_NODES.map((n) => ({ ...n, v: llToVec(n.lat, n.lng) }));
  return (
    <Stage camera={{ position: [0, 1, 8] }} bloom={1.1}>
      <GoldParticles count={700} radius={13} />
      <group ref={grp}>
        {/* wire globe */}
        <mesh>
          <sphereGeometry args={[R, 48, 48]} />
          <meshBasicMaterial color={PALETTE.goldDeep} wireframe transparent opacity={0.12} />
        </mesh>
        <mesh>
          <sphereGeometry args={[R * 0.985, 32, 32]} />
          <meshPhysicalMaterial color={PALETTE.obsidian2} transparent opacity={0.55} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* nodes */}
        {nodes.map((n, i) => (
          <group key={i} position={n.v.toArray()}>
            <mesh><sphereGeometry args={[0.04 + n.w * 0.05, 12, 12]} /><meshBasicMaterial color={PALETTE.goldBright} /></mesh>
            <mesh><ringGeometry args={[0.08, 0.1, 24]} /><meshBasicMaterial color={PALETTE.gold} transparent opacity={0.6} side={THREE.DoubleSide} /></mesh>
          </group>
        ))}
        {/* arcs between hubs */}
        {nodes.slice(1).map((n, i) => <Arc key={i} a={nodes[0].v} b={n.v} />)}
        {nodes.slice(2, 6).map((n, i) => <Arc key={`x${i}`} a={nodes[1].v} b={n.v} />)}
      </group>
    </Stage>
  );
}

export default GlobeScene;
