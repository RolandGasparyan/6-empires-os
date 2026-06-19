'use client';
/**
 * 6 EMPIRES — the living isometric corporation.
 * A campus of physical department rooms laid out on a grid. Click a department
 * to fly the camera in; agents are visible 3D entities working at desks.
 * World-first: the corporation IS the product; dashboards open from rooms.
 */
import { Canvas } from '@react-three/fiber';
import { Suspense, useRef, useState } from 'react';
import { Environment, ContactShadows, AdaptiveDpr } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Room, Mezzanine } from './Room';
import { AgentWorker } from './AgentWorker';
import { Sofa, Chair, Beanbag, CoffeeTable, IslandCounter, Planter, Rug, WallArt, PALETTE } from './Furniture';

export interface Dept {
  id: string; label: string; accent: string; pos: [number, number, number];
  agents: { name: string; color: string; status: string }[];
}

// The corporate structure — each is a physical room on the campus grid.
const GAP = 11;
export const DEPARTMENTS: Dept[] = [
  { id: 'throne', label: 'BOSS THRONE', accent: '#d4af37', pos: [0, 0, 0], agents: [{ name: 'EMPIRE BOSS', color: '#cfd3da', status: 'COMMANDING' }] },
  { id: 'agents', label: 'AGENT FLOOR', accent: '#34f5a0', pos: [GAP, 0, 0], agents: [
    { name: 'Chief Strategist', color: '#cfd3da', status: 'ANALYZING' },
    { name: 'Data Hunter', color: '#2ecc71', status: 'RESEARCHING' },
    { name: 'Risk Guardian', color: '#a855f7', status: 'MONITORING' }] },
  { id: 'trading', label: 'TRADING FLOOR', accent: '#e8c33a', pos: [-GAP, 0, 0], agents: [
    { name: 'Market Scout', color: '#f4c430', status: 'TRADING' },
    { name: 'Trend Tracker', color: '#3b82f6', status: 'SCANNING' }] },
  { id: 'research', label: 'RESEARCH', accent: '#3fe0ff', pos: [0, 0, GAP], agents: [
    { name: 'News Analyst', color: '#ff5d8f', status: 'WRITING' }] },
  { id: 'devlab', label: 'DEVELOPER LAB', accent: '#ef4444', pos: [GAP, 0, GAP], agents: [
    { name: 'Developer', color: '#ef4444', status: 'BUILDING' }] },
  { id: 'media', label: 'MEDIA STUDIO', accent: '#e8772e', pos: [-GAP, 0, GAP], agents: [
    { name: 'Designer', color: '#e8772e', status: 'DESIGNING' }] },
  { id: 'board', label: 'BOARD ROOM', accent: '#d4af37', pos: [0, 0, -GAP], agents: [] },
  { id: 'ops', label: 'OPERATIONS', accent: '#7e8a6b', pos: [GAP, 0, -GAP], agents: [
    { name: 'Ops Manager', color: '#7e8a6b', status: 'COORDINATING' }] },
];

function CameraRig({ target }: { target: [number, number, number] | null }) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3(16, 16, 16));
  const look = useRef(new THREE.Vector3(0, 0, 0));
  useFrame(() => {
    if (target) {
      desired.current.set(target[0] + 7, 8.5, target[2] + 7);
      look.current.set(target[0], 1.2, target[2]);
    } else {
      desired.current.set(16, 17, 16);
      look.current.set(0, 0, 0);
    }
    camera.position.lerp(desired.current, 0.045);
    const cur = new THREE.Vector3();
    camera.getWorldDirection(cur);
    const tgt = look.current.clone().sub(camera.position).normalize();
    cur.lerp(tgt, 0.06);
    camera.lookAt(camera.position.clone().add(cur));
  });
  return null;
}

function DeptRoom({ dept, onPick, focused }: { dept: Dept; onPick: (d: Dept) => void; focused: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <group
      position={dept.pos}
      onClick={(e) => { e.stopPropagation(); onPick(dept); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
    >
      <Room size={[8, 8]} height={4} label={dept.label} accent={dept.accent} windows={['throne', 'trading', 'agents', 'board'].includes(dept.id)}>
        {/* hover highlight */}
        {(hover || focused) && (
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[7.9, 7.9]} />
            <meshBasicMaterial color={dept.accent} transparent opacity={hover ? 0.06 : 0.03} />
          </mesh>
        )}

        {/* per-department dressing */}
        {dept.id === 'throne' && <>
          {/* throne desk + boss */}
          <AgentWorker position={[0, 0, -1.2]} color="#cfd3da" name="EMPIRE BOSS" status="COMMANDING" seed={1} />
          <Sofa position={[-2.4, 0, 2]} rotation={[0, 0.4, 0]} color={PALETTE.charcoal} />
          <CoffeeTable position={[-2.2, 0, 1]} />
          <Planter tall position={[3, 0, -3]} />
          <Planter tall position={[-3, 0, -3]} />
          <Rug position={[0, 0, 1.5]} color={PALETTE.goldDeep} />
          <WallArt position={[-2.4, 2.4, -3.9]} />
        </>}

        {dept.id === 'agents' && dept.agents.map((a, i) => (
          <AgentWorker key={a.name} position={[(i - 1) * 2.4, 0, -1]} color={a.color} name={a.name} status={a.status} seed={i} />
        ))}

        {dept.id === 'trading' && <>
          <IslandCounter position={[0, 0, 1.5]} />
          {dept.agents.map((a, i) => <AgentWorker key={a.name} position={[(i ? 2 : -2), 0, -1.5]} color={a.color} name={a.name} status={a.status} seed={i + 3} />)}
          <Planter position={[3, 0, 2.5]} />
        </>}

        {dept.id === 'research' && <>
          {dept.agents.map((a, i) => <AgentWorker key={a.name} position={[0, 0, -1]} color={a.color} name={a.name} status={a.status} seed={i + 5} />)}
          <Beanbag position={[-2.5, 0, 2]} /><Beanbag position={[2.5, 0, 2.2]} color={PALETTE.sage} />
          <Planter tall position={[3, 0, -3]} />
        </>}

        {dept.id === 'devlab' && <>
          {dept.agents.map((a, i) => <AgentWorker key={a.name} position={[0, 0, -1]} color={a.color} name={a.name} status={a.status} seed={i + 7} />)}
          <Chair position={[-2.4, 0, 1.5]} color={PALETTE.yellow} />
          <Mezzanine position={[2, 0, -2]} width={3.5} depth={2.4} />
        </>}

        {dept.id === 'media' && <>
          {dept.agents.map((a, i) => <AgentWorker key={a.name} position={[0, 0, -1]} color={a.color} name={a.name} status={a.status} seed={i + 9} />)}
          <Sofa position={[-2, 0, 2]} color={PALETTE.orange} />
          <WallArt position={[2.5, 2.4, -3.9]} />
        </>}

        {dept.id === 'board' && <>
          {/* long marble board table + chairs */}
          <mesh position={[0, 0.75, 0]} castShadow receiveShadow><boxGeometry args={[4.5, 0.12, 1.6]} /><meshStandardMaterial color={PALETTE.marble} roughness={0.3} metalness={0.25} /></mesh>
          <mesh position={[0, 0.69, 0]}><boxGeometry args={[4.52, 0.03, 1.62]} /><meshStandardMaterial color={dept.accent} metalness={0.9} roughness={0.25} /></mesh>
          {Array.from({ length: 6 }).map((_, i) => <mesh key={i} position={[-1.9 + i * 0.76, 0.5, 1.1]} castShadow><boxGeometry args={[0.5, 0.9, 0.5]} /><meshStandardMaterial color={PALETTE.charcoal} /></mesh>)}
          {Array.from({ length: 6 }).map((_, i) => <mesh key={'b' + i} position={[-1.9 + i * 0.76, 0.5, -1.1]} castShadow><boxGeometry args={[0.5, 0.9, 0.5]} /><meshStandardMaterial color={PALETTE.charcoal} /></mesh>)}
          <Planter tall position={[3.2, 0, -3]} />
        </>}

        {dept.id === 'ops' && dept.agents.map((a, i) => (
          <AgentWorker key={a.name} position={[0, 0, -1]} color={a.color} name={a.name} status={a.status} seed={i + 11} />
        ))}
      </Room>
    </group>
  );
}

export default function EmpireWorld({ onEnter }: { onEnter?: (d: Dept) => void }) {
  const [focus, setFocus] = useState<[number, number, number] | null>(null);
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [16, 17, 16], fov: 34, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }} onPointerMissed={() => setFocus(null)}>
      <color attach="background" args={['#080809']} />
      <fog attach="fog" args={['#080809', 30, 70]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[12, 20, 8]} intensity={1.1} color="#fff2d6" castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 60]} />
      </directionalLight>
      <pointLight position={[0, 8, 0]} intensity={0.5} color={PALETTE.gold} distance={40} />
      <Suspense fallback={null}>
        {DEPARTMENTS.map((d) => (
          <DeptRoom key={d.id} dept={d} focused={focus?.[0] === d.pos[0] && focus?.[2] === d.pos[2]}
            onPick={(dd) => { setFocus(dd.pos); onEnter?.(dd); }} />
        ))}
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={60} blur={2.2} far={10} />
        <Environment preset="night" />
      </Suspense>
      <CameraRig target={focus} />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
