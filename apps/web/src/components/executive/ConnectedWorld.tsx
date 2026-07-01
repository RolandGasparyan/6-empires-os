'use client';
/**
 * 6 EMPIRES CORPORATION — the CONNECTED world.
 * Multiple departments laid out as adjacent rooms around a central atrium,
 * physically connected by corridors. All 12 named agents placed in their home
 * rooms; several agents WALK between departments along the corridors. Click an
 * agent → profile; click a room → camera flies in. Premium stylized R3F.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Environment, ContactShadows, Text, RoundedBox, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { HumanCharacter } from './HumanCharacter';
import { Hologram, Inspect, BASE } from './roomKit';
import { Workstation, WallScreen, Pot, Art, Chair, TrophyShelf, Lounge } from './RoomDetail';
import { TEAM, byRoom, byId, TeamMember } from './team';

// chunky rounded "cartoon/Simpsons" display font for all 3D wall text
const TOON_FONT = 'https://cdn.jsdelivr.net/fontsource/fonts/luckiest-guy@latest/latin-400-normal.woff';

/** Room slots on the campus grid. */
interface Slot { id: string; label: string; accent: string; pos: [number, number]; }
const GAP = 14;
const ROOMS: Slot[] = [
  { id: 'command',   label: 'COMMAND',   accent: '#c79be0', pos: [0, 0] },
  { id: 'workspace', label: 'WORKSPACE', accent: '#34f5a0', pos: [GAP, 0] },
  { id: 'datalab',   label: 'DATA LAB',  accent: '#a855f7', pos: [-GAP, 0] },
  { id: 'trading',   label: 'TRADING',   accent: '#22c55e', pos: [0, GAP] },
  { id: 'meeting',   label: 'MEETING',   accent: '#3b82f6', pos: [0, -GAP] },
  { id: 'media',     label: 'MEDIA STUDIO', accent: '#06b6d4', pos: [GAP, GAP] },
];

/* ---- one department room with its furniture + home agents ---- */
function RoomCell({ slot, onAgent, onRoom, focused }: { slot: Slot; onAgent: (m: TeamMember) => void; onRoom: (s: Slot) => void; focused: boolean }) {
  const [hover, setHover] = useState(false);
  const home = byRoom(slot.id);
  const W = 10, D = 10, H = 4.5;
  return (
    <group position={[slot.pos[0], 0, slot.pos[1]]}>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={(e) => { e.stopPropagation(); onRoom(slot); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#2aa39a" roughness={0.85} metalness={0.05} />
      </mesh>
      {(hover || focused) && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[W - 0.2, D - 0.2]} /><meshBasicMaterial color={slot.accent} transparent opacity={hover ? 0.08 : 0.04} /></mesh>}

      {/* two back walls — soft pastel pink (Arturitu mockup) */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow><boxGeometry args={[W, H, 0.16]} /><meshStandardMaterial color="#f4b8cf" roughness={0.95} metalness={0} /></mesh>
      <mesh position={[-W / 2, H / 2, 0]} receiveShadow><boxGeometry args={[0.16, H, D]} /><meshStandardMaterial color="#f0a8c4" roughness={0.95} metalness={0} /></mesh>
      {/* soft pastel cove lighting along wall tops (gentle warm-white glow) */}
      <mesh position={[0, H - 0.15, -D / 2 + 0.12]}><boxGeometry args={[W * 0.9, 0.04, 0.04]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.45} /></mesh>
      <mesh position={[-W / 2 + 0.12, H - 0.15, 0]}><boxGeometry args={[0.04, 0.04, D * 0.9]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.45} /></mesh>
      {/* soft pastel baseboard */}
      <mesh position={[0, 0.07, -D / 2 + 0.1]}><boxGeometry args={[W, 0.07, 0.04]} /><meshStandardMaterial color="#f7d6e4" metalness={0.05} roughness={0.6} /></mesh>
      {/* soft pastel EMPIRE emblem + wordmark on back wall (Arturitu) */}
      <group position={[0, H * 0.62, -D / 2 + 0.14]}>
        {[0, 1, 2, 3].map((i) => <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}><torusGeometry args={[0.42, 0.07, 8, 24, Math.PI * 1.3]} /><meshStandardMaterial color="#c79be0" metalness={0.1} roughness={0.5} emissive="#c79be0" emissiveIntensity={0.18} /></mesh>)}
        <mesh><sphereGeometry args={[0.08, 14, 14]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.5} /></mesh>
      </group>
      <Text font={TOON_FONT} position={[0, H * 0.32, -D / 2 + 0.14]} fontSize={0.4} color="#ffd21e" anchorX="center" letterSpacing={0.1} outlineWidth={0.012} outlineColor="#000">6 EMPIRES</Text>
      <Text font={TOON_FONT} position={[0, H * 0.86, -D / 2 + 0.12]} fontSize={0.34} color="#ffd21e" anchorX="center" letterSpacing={0.05} outlineWidth={0.012} outlineColor="#000">{slot.label}</Text>
      {/* soft pastel feature windows */}
      <mesh position={[W * 0.3, H * 0.55, -D / 2 + 0.1]}><planeGeometry args={[W * 0.3, H * 0.42]} /><meshStandardMaterial color="#bfeaf0" emissive="#9fdce6" emissiveIntensity={0.3} /></mesh>

      {/* fully-furnished workstations — agents seated, working (command room
          uses the dedicated Boss Office below instead of generic stations) */}
      {slot.id !== 'command' && home.slice(0, 3).map((m, i) => {
        const x = (i - 1) * 2.9, z = -1.6;
        const screenKind = m.gesture === 'scan' ? 'grid' : m.gesture === 'type' ? 'code' : m.gesture === 'point' ? 'ui' : 'chart';
        return (
          <group key={m.id} position={[x, 0, z]}>
            <Workstation position={[0, 0, 0]} color={m.color} kind={screenKind as any} />
            {/* seated stylized-human agent — sits IN the chair (z=0.78) facing the
                desk/monitors (-Z) and typing; rotation π so they face the screens */}
            <Inspect id={m.id} onPick={() => onAgent(m)}>
              <HumanCharacter seated position={[0, 0.06, 0.62]} rotation={[0, Math.PI, 0]} suit={m.color} hair={m.hair} beard={m.beard} glasses={m.glasses} bowtie={m.bowtie} gesture="type" name={m.name.split(' ')[0].toUpperCase()} status={m.status} seed={m.id.charCodeAt(0)} scale={0.7} />
            </Inspect>
          </group>
        );
      })}

      {/* wall screens (big animated displays) on the back wall */}
      <WallScreen position={[-2.6, 3, -D / 2 + 0.12]} w={2.0} h={1.1} accent={slot.accent} kind="chart" />
      <WallScreen position={[2.6, 3, -D / 2 + 0.12]} w={2.0} h={1.1} accent={slot.accent} kind={slot.id === 'datalab' ? 'code' : slot.id === 'trading' ? 'chart' : 'grid'} />

      {/* === BOSS OFFICE — Roland Gasparyan's executive command (reference) === */}
      {slot.id === 'command' && (() => {
        const boss = byRoom('command')[0] ?? TEAM[0];
        return (
          <group>
            {/* soft pastel executive desk */}
            <RoundedBox args={[4.4, 0.18, 1.7]} radius={0.06} position={[0, 0.82, -1.6]} castShadow receiveShadow><meshStandardMaterial color="#e9d8f0" metalness={0.1} roughness={0.5} /></RoundedBox>
            <mesh position={[0, 0.72, -1.6]}><boxGeometry args={[4.44, 0.05, 1.74]} /><meshStandardMaterial color="#f7d6e4" metalness={0.05} roughness={0.5} emissive="#ffe1ee" emissiveIntensity={0.1} /></mesh>
            <mesh position={[-2.0, 0.36, -1.6]}><boxGeometry args={[0.18, 0.72, 1.5]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
            <mesh position={[2.0, 0.36, -1.6]}><boxGeometry args={[0.18, 0.72, 1.5]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
            {/* curved triple command screens */}
            <WallScreen position={[-1.5, 1.55, -2.0]} rotation={[0, 0.45, 0]} w={1.2} h={0.7} accent={BASE.green} kind="chart" />
            <WallScreen position={[0, 1.65, -2.1]} w={1.5} h={0.85} accent="#c79be0" kind="ui" />
            <WallScreen position={[1.5, 1.55, -2.0]} rotation={[0, -0.45, 0]} w={1.2} h={0.7} accent={BASE.blue} kind="chart" />
            {/* the boss in his chair — chair faces the desk (-Z) */}
            <Chair position={[0, 0, -0.7]} rotation={[0, Math.PI, 0]} color="#b48fd0" />
            {/* soft pastel rim / halo light behind the chair */}
            <mesh position={[0, 1.5, -1.15]} rotation={[0, 0, 0]}><torusGeometry args={[0.66, 0.05, 14, 40]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.6} metalness={0.1} roughness={0.4} /></mesh>
            <PulseLight position={[0, 1.6, -1.25]} color="#ffe1ee" base={0.5} amp={0.2} dist={5} />
            <Inspect id={boss.id} onPick={() => onAgent(boss)}>
              <HumanCharacter seated position={[0, 0.08, -0.78]} rotation={[0, Math.PI, 0]} suit="#8a6db0" hair="#141414" beard bowtie gesture="type" name="ROLAND" status="COMMANDING" scale={0.85} seed={9} />
            </Inspect>
            {/* desk accessories: pastel sculpture, globe, flag, books */}
            <mesh position={[1.5, 0.98, -1.4]} castShadow><boxGeometry args={[0.2, 0.18, 0.32]} /><meshStandardMaterial color="#e8a8c8" metalness={0.1} roughness={0.5} emissive="#ffd9e8" emissiveIntensity={0.1} /></mesh>
            <mesh position={[-1.5, 1.05, -1.4]}><sphereGeometry args={[0.16, 18, 14]} /><meshStandardMaterial color="#9fdce6" metalness={0.1} roughness={0.5} wireframe /></mesh>
            <mesh position={[-1.5, 1.05, -1.4]}><sphereGeometry args={[0.155, 14, 10]} /><meshStandardMaterial color="#cfeaf0" /></mesh>
            <group position={[1.1, 0.95, -1.5]}>{[0,1,2].map(i=><mesh key={i} position={[0,i*0.05,0]}><boxGeometry args={[0.3,0.045,0.2]}/><meshStandardMaterial color={['#e8a8c8','#b48fd0','#9fdce6'][i]} roughness={0.6}/></mesh>)}</group>
            {/* pastel floor emblem (interlocking rings) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.6]}><torusGeometry args={[0.9, 0.05, 10, 40]} /><meshStandardMaterial color="#c79be0" metalness={0.1} roughness={0.5} emissive="#c79be0" emissiveIntensity={0.12} /></mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.02, 1.6]}><torusGeometry args={[0.6, 0.045, 10, 40]} /><meshStandardMaterial color="#e8a8c8" metalness={0.1} roughness={0.5} emissive="#ffd9e8" emissiveIntensity={0.15} /></mesh>
            <Lounge position={[-3.4, 0, 2.4]} rotation={[0, 0.5, 0]} />
            {/* boss-office wall tagline */}
            <Text font={TOON_FONT} position={[0, H * 0.2, -D / 2 + 0.14]} fontSize={0.18} color="#ffd21e" anchorX="center" letterSpacing={0.06} outlineWidth={0.008} outlineColor="#000">WE BUILD · WE SCALE · WE OWN</Text>
            {/* team seating — 2 chairs facing the boss desk + 2 empty chairs */}
            {[{ x: -1.8, z: 1.5, r: -0.5 }, { x: 1.8, z: 1.5, r: 0.5 }].map((c) => <Chair key={'e' + c.x} position={[c.x, 0, c.z]} rotation={[0, Math.PI + c.r, 0]} color="#b48fd0" />)}
            {[{ x: -0.6, z: 1.2, r: -0.18 }, { x: 0.6, z: 1.2, r: 0.18 }].map((c, i) => (
              <group key={i}>
                <Chair position={[c.x, 0, c.z]} rotation={[0, Math.PI + c.r, 0]} color="#b48fd0" />
                <HumanCharacter seated position={[c.x, 0.06, c.z - 0.16]} rotation={[0, Math.PI + c.r, 0]} suit={TEAM[i + 1].color} hair={TEAM[i + 1].hair} glasses={TEAM[i + 1].glasses} gesture="type" scale={0.62} seed={20 + i} />
              </group>
            ))}
            {/* gentle even key light on the CEO */}
            <spotLight position={[0, 4, 0.5]} angle={0.4} penumbra={0.7} intensity={1.2} color="#ffffff" target-position={[0, 0.6, -0.7]} />
            <pointLight position={[0, 2.2, -1]} intensity={0.4} color="#ffe1ee" distance={6} />
          </group>
        );
      })()}
      {slot.id === 'meeting' && <>
        <RoundedBox args={[3.6, 0.14, 1.4]} radius={0.06} position={[0, 0.78, 1.4]} castShadow><meshStandardMaterial color="#e9d8f0" metalness={0.1} roughness={0.5} /></RoundedBox>
        {[-1.2, 0, 1.2].map((cx) => <Chair key={cx} position={[cx, 0, 2.4]} rotation={[0, Math.PI, 0]} />)}
        {[-1.2, 0, 1.2].map((cx) => <Chair key={'b' + cx} position={[cx, 0, 0.4]} />)}
      </>}
      {slot.id === 'media' && <>
        {/* === MEDIA STUDIO — content factory === */}
        {/* big hero content wall */}
        <WallScreen position={[-1.4, 2.7, -D / 2 + 0.13]} w={3.0} h={1.7} accent="#e8772e" kind="ui" />
        {/* social feed column */}
        <WallScreen position={[1.4, 3.0, -D / 2 + 0.13]} w={1.3} h={1.0} accent="#ec4899" kind="grid" />
        {/* chart panel */}
        <WallScreen position={[1.4, 1.8, -D / 2 + 0.13]} w={1.3} h={0.9} accent="#06b6d4" kind="chart" />
        {/* video timeline strip (orange editing line) */}
        <mesh position={[-1.4, 1.5, -D / 2 + 0.16]}><boxGeometry args={[3.0, 0.34, 0.02]} /><meshStandardMaterial color="#f5e3d8" emissive="#f6a96a" emissiveIntensity={0.2} /></mesh>
        {[0,1,2,3,4,5].map(i => <mesh key={i} position={[-2.7 + i*0.52, 1.5, -D / 2 + 0.17]}><boxGeometry args={[0.42, 0.26, 0.02]} /><meshStandardMaterial color="#f6a96a" emissive="#f6a96a" emissiveIntensity={0.4} transparent opacity={0.9} /></mesh>)}
        {/* glowing peach UI side panels */}
        {[-0.6, 0.6].map(z => <mesh key={z} position={[-W/2 + 0.16, 2.4, z]} rotation={[0, Math.PI/2, 0]}><planeGeometry args={[1.2, 0.7]} /><meshStandardMaterial color="#fbe6d6" emissive="#f6a96a" emissiveIntensity={0.3} transparent opacity={0.92} /></mesh>)}
        {/* editing agent — typing bursts at the edit desk */}
        <Workstation position={[-1.4, 0, -1.6]} color="#e8772e" kind="ui" />
        <HumanCharacter seated position={[-1.4, 0.06, -0.98]} rotation={[0, Math.PI, 0]} suit="#e8772e" hair="#1a6a7a" gesture="type" name="MEDIA" status="EDITING" scale={0.7} seed={55} />
        {/* camera rig + studio lights */}
        <mesh position={[3, 1.4, 1.5]}><cylinderGeometry args={[0.02, 0.02, 2.4, 6]} /><meshStandardMaterial color="#bfb3cc" /></mesh>
        <mesh position={[3, 2.5, 1.5]}><coneGeometry args={[0.22, 0.3, 16, 1, true]} /><meshStandardMaterial color="#cdc2d8" side={2} /></mesh>
        <SceneFlicker position={[3, 2.4, 1.5]} color="#ffffff" base={0.4} dist={4} />
        {/* second studio light (warm) on a tripod */}
        <mesh position={[-3.2, 1.5, 1.2]}><cylinderGeometry args={[0.02, 0.02, 2.6, 6]} /><meshStandardMaterial color="#bfb3cc" /></mesh>
        <mesh position={[-3.2, 2.7, 1.2]} rotation={[0.4,0,0]}><coneGeometry args={[0.2, 0.28, 16, 1, true]} /><meshStandardMaterial color="#cdc2d8" side={2} /></mesh>
        <SceneFlicker position={[-3.2, 2.6, 1.2]} color="#ffd9a8" base={0.45} dist={4.5} />
        {/* on-air camera body */}
        <mesh position={[3, 1.55, 1.5]} rotation={[0,-0.5,0]}><boxGeometry args={[0.3, 0.22, 0.42]} /><meshStandardMaterial color="#9f8fb8" metalness={0.2} roughness={0.5} /></mesh>
        <mesh position={[2.78, 1.55, 1.32]}><sphereGeometry args={[0.05, 10, 10]} /><meshStandardMaterial color="#f6a96a" emissive="#f6a96a" emissiveIntensity={1.0} /></mesh>
      </>}

      {/* shared luxury interior detail (clean black floor — no rug) */}
      <TrophyShelf position={[W / 2 - 0.3, 1.2, -1.6]} rotation={[0, -Math.PI / 2, 0]} />
      <Lounge position={[W / 2 - 1.6, 0, D / 2 - 1.4]} rotation={[0, -Math.PI / 2 - 0.3, 0]} />
      <Art position={[-W / 2 + 0.2, 2.6, -1.5]} rotation={[0, Math.PI / 2, 0]} accent={slot.accent} />
      <Art position={[-W / 2 + 0.2, 2.6, 1.0]} rotation={[0, Math.PI / 2, 0]} accent="#c79be0" />
      <Pot big position={[-W / 2 + 1.0, 0, -D / 2 + 1.0]} />
      <Pot position={[-W / 2 + 1.0, 0, D / 2 - 1.0]} />
    </group>
  );
}

/* ---- corridors connecting the rooms to the atrium ---- */
function Corridors() {
  return (
    <group>
      {ROOMS.filter((r) => r.id !== 'command').map((r) => {
        const [x, z] = r.pos; const len = Math.hypot(x, z); const ang = Math.atan2(z, x);
        return (
          <mesh key={r.id} position={[x / 2, 0.015, z / 2]} rotation={[-Math.PI / 2, 0, -ang]} receiveShadow>
            <planeGeometry args={[len, 2.4]} />
            <meshStandardMaterial color="#2aa39a" roughness={0.92} metalness={0} />
          </mesh>
        );
      })}
    </group>
  );
}

/* === static light helpers (no per-frame animation) === */
function PulseLight({ position, color, base = 0.5, dist = 6 }: { position: [number, number, number]; color: string; base?: number; amp?: number; dist?: number; speed?: number }) {
  return <pointLight position={position} color={color} intensity={base} distance={dist} />;
}
function SceneFlicker({ position, color, base = 0.4, dist = 4 }: { position: [number, number, number]; color: string; base?: number; dist?: number }) {
  return <pointLight position={position} color={color} intensity={base} distance={dist} />;
}

/* === unified building shell — glass curtain wall + warm base uplights (reference) === */
function BuildingShell() {
  const R = 22;     // half-extent of the building footprint
  const H = 5.5;    // wall height
  // warm exterior uplights spaced around the base
  const uplights = useMemo(() => {
    const pts: [number, number][] = [];
    const N = 7;
    for (let i = 0; i <= N; i++) { const t = (i / N) * 2 - 1; pts.push([t * R, R + 1]); pts.push([t * R, -R - 1]); pts.push([R + 1, t * R]); pts.push([-R - 1, t * R]); }
    return pts;
  }, []);
  return (
    <group>
      {/* soft teal base plinth under the building */}
      <mesh position={[0, -0.6, 0]}><boxGeometry args={[R * 2 + 4, 1.0, R * 2 + 4]} /><meshStandardMaterial color="#1f8f88" roughness={0.8} metalness={0.1} /></mesh>
      <mesh position={[0, -0.08, 0]}><boxGeometry args={[R * 2 + 0.4, 0.16, R * 2 + 0.4]} /><meshStandardMaterial color="#34c0b4" metalness={0.1} roughness={0.5} emissive="#34c0b4" emissiveIntensity={0.06} /></mesh>
      {/* glass curtain walls on all 4 sides */}
      {([[0, -R], [0, R], [-R, 0], [R, 0]] as [number, number][]).map(([x, z], i) => (
        <group key={i} position={[x, H / 2, z]} rotation={[0, i < 2 ? 0 : Math.PI / 2, 0]}>
          <mesh><boxGeometry args={[R * 2, H, 0.06]} /><meshStandardMaterial color="#bfeaf0" transparent opacity={0.1} metalness={0.2} roughness={0.05} /></mesh>
          {/* soft white mullions */}
          {Array.from({ length: 9 }).map((_, m) => <mesh key={m} position={[-R + (m * R) / 4, 0, 0.04]}><boxGeometry args={[0.05, H, 0.05]} /><meshStandardMaterial color="#fff4f8" metalness={0.05} roughness={0.5} emissive="#ffe1ee" emissiveIntensity={0.1} /></mesh>)}
          <mesh position={[0, H / 2 - 0.05, 0.04]}><boxGeometry args={[R * 2, 0.06, 0.06]} /><meshStandardMaterial color="#fff4f8" metalness={0.05} roughness={0.5} /></mesh>
          <mesh position={[0, -H / 2 + 0.05, 0.04]}><boxGeometry args={[R * 2, 0.06, 0.06]} /><meshStandardMaterial color="#fff4f8" metalness={0.05} roughness={0.5} /></mesh>
        </group>
      ))}
      {/* soft pastel exterior uplights around the base */}
      {uplights.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.12, 0.14, 0.1, 10]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.9} /></mesh>
          <pointLight position={[0, 0.4, 0]} intensity={0.4} color="#ffe1ee" distance={6} />
        </group>
      ))}
    </group>
  );
}

function CamRig({ target, zoom, orbit }: { target: [number, number] | null; zoom: number; orbit: number }) {
  const { camera, size } = useThree();
  const tmp = useRef(new THREE.Vector3());
  const aspect = size.width / Math.max(1, size.height);
  // UNIVERSAL FIT: pull back on narrow/portrait screens so the whole floor fits.
  const fit = aspect >= 1.6 ? 1.0 : aspect >= 1.0 ? 1.18 : aspect >= 0.7 ? 1.55 : 2.0;
  useFrame(() => {
    const z = zoom;
    let desired: THREE.Vector3, lx: number, ly: number, lz: number;
    if (target) {
      desired = tmp.current.set(target[0] + 4.2 * z, 5.5 * z, target[1] + 4.2 * z);
      lx = target[0]; ly = 1.1; lz = target[1];
    } else {
      // 360° ORBIT around the room centre — `orbit` (radians) spins the camera
      // fully around; height stays high for the doll-house view.
      const R = 40 * fit * z;              // horizontal orbit radius
      const H = 44 * fit * z;              // camera height
      desired = tmp.current.set(Math.sin(orbit) * R, H, Math.cos(orbit) * R);
      lx = 0; ly = 0; lz = 0;
    }
    const d = camera.position.distanceTo(desired);
    if (d > 0.02) camera.position.lerp(desired, 0.12);
    camera.lookAt(lx, ly, lz);
  });
  return null;
}

/* === mouse-wheel → zoom; horizontal drag → 360° orbit === */
function CamControls({ onZoom, onOrbit }: { onZoom: (d: number) => void; onOrbit: (d: number) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const wheel = (e: WheelEvent) => { e.preventDefault(); onZoom(e.deltaY > 0 ? 0.08 : -0.08); };
    let down = false, lastX = 0;
    const pd = (e: PointerEvent) => { down = true; lastX = e.clientX; };
    const pm = (e: PointerEvent) => { if (down) { onOrbit((e.clientX - lastX) * 0.006); lastX = e.clientX; } };
    const pu = () => { down = false; };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    return () => { el.removeEventListener('wheel', wheel); el.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); };
  }, [gl, onZoom, onOrbit]);
  return null;
}

/* === floating "working…" status / chat bubble above an agent === */
const BUBBLES: Record<string, string[]> = {
  type:  ['writing code…', 'deploying…', 'building…', 'shipping…'],
  scan:  ['scanning markets…', 'reading data…', 'analyzing…'],
  think: ['analyzing…', 'modeling…', 'planning…'],
  point: ['directing…', 'reviewing…', 'deciding…'],
  wave:  ['posting…', 'creating…', 'launching…'],
  idle:  ['coordinating…', 'syncing…', 'on a call…'],
};
function WorkBubble({ position, text, accent, seed = 0 }: { position: [number, number, number]; text: string; accent: string; seed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => { if (ref.current) ref.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * 1.5 + seed) * 0.06; });
  return (
    <group ref={ref} position={position}>
      <Billboard>
        <mesh><planeGeometry args={[Math.max(1.1, text.length * 0.11), 0.42]} /><meshBasicMaterial color="#fffdf5" transparent opacity={0.92} /></mesh>
        <mesh position={[0, -0.27, 0.001]}><coneGeometry args={[0.08, 0.16, 3]} /><meshBasicMaterial color="#fffdf5" transparent opacity={0.92} /></mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.15} color="#222" anchorX="center" anchorY="middle" maxWidth={3}>{text}</Text>
        <mesh position={[0, 0.27, 0.002]}><planeGeometry args={[Math.max(1.1, text.length * 0.11), 0.05]} /><meshBasicMaterial color={accent} /></mesh>
      </Billboard>
    </group>
  );
}

/* === full SPECIALTY STUDIO kit per agent — each office gets a side rig that
       matches the agent's profession (Media → studio mixer + video rig, AI →
       server racks, CFO → finance terminal, Analyst → market wall, etc.) ===
   Placed on the LEFT side of the bay (x≈-1.3) so it doesn't hit the desk. */
function RoleProps({ id, c }: { id: string; c: string }) {
  const RX = -1.35;  // left side rig anchor
  switch (id) {
    case 'cto': case 'ai': { // ENGINEERING LAB — twin server racks w/ blinking LEDs
      return <group position={[RX, 0, -0.3]}>
        {[-0.25, 0.25].map((dx, r) => (
          <group key={r} position={[dx, 0, 0]}>
            <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.4, 1.4, 0.4]} /><meshStandardMaterial color="#241f38" roughness={0.5} /></mesh>
            {[0,1,2,3,4,5].map(k=><mesh key={k} position={[0, 0.25 + k*0.18, 0.21]}><boxGeometry args={[0.34, 0.02, 0.02]} /><meshStandardMaterial color={(k+r)%2?'#34f5a0':'#06b6d4'} emissive={(k+r)%2?'#34f5a0':'#06b6d4'} emissiveIntensity={0.9} /></mesh>)}
          </group>
        ))}
      </group>;
    }
    case 'cfo': { // FINANCE TERMINAL — coin stacks + money board
      return <group position={[RX, 0, -0.2]}>
        <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.9, 0.56, 0.05]} /><meshStandardMaterial color="#0a1018" emissive="#ffd21e" emissiveIntensity={0.3} /></mesh>
        <mesh position={[0, 0.74, 0.2]}><boxGeometry args={[0.7, 0.74, 0.5]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
        {[0,1,2,3].map(k=><mesh key={k} position={[-0.2+k*0.13, 1.18, 0.05]}><cylinderGeometry args={[0.07,0.07,0.06+k*0.05,14]} /><meshStandardMaterial color="#ffd21e" metalness={0.6} roughness={0.3} /></mesh>)}
      </group>;
    }
    case 'analyst': case 'strat': { // MARKET WALL — big candlestick + ticker
      return <group position={[RX, 0, -0.3]}>
        <mesh position={[0, 1.25, 0]}><boxGeometry args={[1.0, 0.66, 0.05]} /><meshStandardMaterial color="#06122a" emissive={c} emissiveIntensity={0.35} /></mesh>
        {[0,1,2,3,4,5,6].map(k=><mesh key={k} position={[-0.4+k*0.13, 1.2+(k%2?0.08:-0.06), 0.04]}><boxGeometry args={[0.05, 0.14+(k%3)*0.07, 0.01]} /><meshStandardMaterial color={k%2?'#34f5a0':'#ff6a8a'} emissive={k%2?'#34f5a0':'#ff6a8a'} emissiveIntensity={0.7} /></mesh>)}
        <mesh position={[0, 0.78, 0]}><boxGeometry args={[0.7, 0.74, 0.4]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
      </group>;
    }
    case 'risk': { // RISK CONTROL — alert console + shield
      return <group position={[RX, 0, -0.3]}>
        <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.9, 0.56, 0.05]} /><meshStandardMaterial color="#1a0a12" emissive="#ff6a8a" emissiveIntensity={0.4} /></mesh>
        {[0,1,2].map(k=><mesh key={k} position={[-0.25+k*0.25, 1.2, 0.04]}><circleGeometry args={[0.08, 16]} /><meshStandardMaterial color={['#34f5a0','#ffd21e','#ff6a8a'][k]} emissive={['#34f5a0','#ffd21e','#ff6a8a'][k]} emissiveIntensity={0.9} /></mesh>)}
        <mesh position={[0, 0.78, 0.18]} rotation={[0,0,0]}><cylinderGeometry args={[0.16,0.16,0.04,6]} /><meshStandardMaterial color={c} metalness={0.4} roughness={0.4} /></mesh>
      </group>;
    }
    case 'mkt': { // VIDEO PRODUCTION STUDIO — camera on tripod + softbox + clapperboard
      return <group position={[RX, 0, 0.1]}>
        {/* studio camera on tripod */}
        <mesh position={[0, 1.0, 0]} rotation={[0,-0.4,0]}><boxGeometry args={[0.3, 0.24, 0.42]} /><meshStandardMaterial color="#3a3048" metalness={0.3} roughness={0.5} /></mesh>
        <mesh position={[0.2, 1.0, 0.2]}><cylinderGeometry args={[0.07,0.07,0.12,16]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.025,0.025,1.0,6]} /><meshStandardMaterial color="#888" /></mesh>
        {/* softbox light */}
        <group position={[-0.5, 1.3, -0.2]} rotation={[0.2,0.5,0]}>
          <mesh><boxGeometry args={[0.5,0.5,0.08]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.8} /></mesh>
        </group>
        <mesh position={[-0.5, 0.65, -0.2]}><cylinderGeometry args={[0.02,0.02,1.3,6]} /><meshStandardMaterial color="#888" /></mesh>
        {/* clapperboard on the floor */}
        <mesh position={[0.4, 0.05, 0.4]} rotation={[0,0.3,0]}><boxGeometry args={[0.36,0.04,0.28]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0.4, 0.09, 0.4]} rotation={[0,0.3,0]}><boxGeometry args={[0.36,0.04,0.06]} /><meshStandardMaterial color="#fff" /></mesh>
      </group>;
    }
    case 'coo': { // OPS COMMAND — kanban board + gears
      return <group position={[RX, 0, -0.3]}>
        <mesh position={[0, 1.2, 0]}><boxGeometry args={[1.0, 0.66, 0.05]} /><meshStandardMaterial color="#f4f0fa" /></mesh>
        {[0,1,2].map(col=>[0,1].map(row=><mesh key={col*2+row} position={[-0.32+col*0.32, 1.32-row*0.22, 0.04]}><boxGeometry args={[0.26,0.16,0.01]} /><meshStandardMaterial color={['#ffd21e','#34f5a0','#6fb3ff'][col]} /></mesh>))}
        <mesh position={[0, 0.78, 0.18]}><torusGeometry args={[0.14,0.045,6,14]} /><meshStandardMaterial color={c} metalness={0.4} roughness={0.4} /></mesh>
      </group>;
    }
    case 'ops': case 'auto': { // AUTOMATION RIG — pipeline nodes + cables
      return <group position={[RX, 0, -0.3]}>
        <mesh position={[0, 1.2, 0]}><boxGeometry args={[1.0, 0.62, 0.05]} /><meshStandardMaterial color="#0a1422" emissive={c} emissiveIntensity={0.3} /></mesh>
        {[0,1,2,3].map(k=><mesh key={k} position={[-0.33+k*0.22, 1.2, 0.04]}><circleGeometry args={[0.07,16]} /><meshStandardMaterial color="#34f5a0" emissive="#34f5a0" emissiveIntensity={0.9} /></mesh>)}
        {[0,1,2].map(k=><mesh key={k} position={[-0.22+k*0.22, 1.2, 0.045]}><boxGeometry args={[0.16,0.015,0.01]} /><meshStandardMaterial color="#6fb3ff" emissive="#6fb3ff" emissiveIntensity={0.7} /></mesh>)}
        <mesh position={[0, 0.78, 0.18]}><boxGeometry args={[0.4,0.3,0.3]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
      </group>;
    }
    case 'data': { // DATA SCIENCE — 3D scatter cube + DB cylinders
      return <group position={[RX, 0, -0.3]}>
        <mesh position={[0, 1.2, 0]} rotation={[0.3,0.4,0]}><boxGeometry args={[0.5,0.5,0.5]} /><meshStandardMaterial color={c} transparent opacity={0.25} /></mesh>
        {[0,1,2,3,4,5].map(k=><mesh key={k} position={[0+Math.cos(k)*0.18, 1.2+Math.sin(k*1.5)*0.18, Math.sin(k)*0.18]}><sphereGeometry args={[0.04,8,8]} /><meshStandardMaterial color="#ffd21e" emissive="#ffd21e" emissiveIntensity={0.7} /></mesh>)}
        {[0,1].map(k=><mesh key={k} position={[-0.2+k*0.4, 0.7, 0.15]}><cylinderGeometry args={[0.12,0.12,0.4,16]} /><meshStandardMaterial color="#6fb3ff" metalness={0.3} roughness={0.4} /></mesh>)}
      </group>;
    }
    default: { // COO/CEO fallback — strategy marker + globe
      return <group position={[RX, 0.78, -0.1]}>
        <mesh position={[0,0.18,0]}><sphereGeometry args={[0.16,18,14]} /><meshStandardMaterial color={c} wireframe /></mesh>
        <mesh position={[0,0.18,0]}><sphereGeometry args={[0.155,14,10]} /><meshStandardMaterial color="#cfeaf0" /></mesh>
      </group>;
    }
  }
}

/* === one agent's OFFICE BAY: partitioned cubicle + props + live screen + agent === */
function OfficeBay({ m, position, onAgent }: { m: TeamMember; position: [number, number, number]; onAgent: (a: TeamMember, pos: [number, number]) => void }) {
  const c = m.color === '#1a1a1a' ? '#444' : m.color;
  const kind = (m.gesture === 'scan' ? 'grid' : m.gesture === 'type' ? 'code' : m.gesture === 'point' ? 'ui' : 'chart') as any;
  const phrases = BUBBLES[m.gesture] || BUBBLES.idle;
  const phrase = phrases[m.id.charCodeAt(0) % phrases.length];
  const seedN = m.id.charCodeAt(0);
  const [hover, setHover] = useState(false);
  // booth footprint
  const BW = 4.2, BD = 4.4;   // booth width / depth
  return (
    <group position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}>
      {/* booth floor — tinted, glossy (gamified) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><planeGeometry args={[BW, BD]} /><meshStandardMaterial color={c} transparent opacity={hover ? 0.22 : 0.12} roughness={0.6} metalness={0.1} /></mesh>
      {/* NEON zone outline at the floor edge (glows on hover) */}
      {[[0, -BD/2, BW, 0], [0, BD/2, BW, 0], [-BW/2, 0, BD, Math.PI/2], [BW/2, 0, BD, Math.PI/2]].map((s, i) => (
        <mesh key={i} position={[s[0], 0.04, s[1]]} rotation={[-Math.PI/2, 0, s[3]]}><planeGeometry args={[s[2], 0.07]} /><meshBasicMaterial color={c} transparent opacity={hover ? 1 : 0.55} /></mesh>
      ))}
      {/* THREE enclosing walls (back + both sides) — front stays open as a doorway */}
      <mesh position={[0, 1.2, -BD/2 + 0.04]} castShadow receiveShadow><boxGeometry args={[BW, 2.4, 0.1]} /><meshStandardMaterial color="#f6dcea" roughness={0.92} /></mesh>
      <mesh position={[-BW/2 + 0.04, 1.2, 0]} receiveShadow><boxGeometry args={[0.1, 2.4, BD]} /><meshStandardMaterial color="#f0c4dc" roughness={0.92} /></mesh>
      <mesh position={[BW/2 - 0.04, 1.2, 0.6]} receiveShadow><boxGeometry args={[0.1, 2.4, BD - 1.2]} /><meshStandardMaterial color="#f0c4dc" roughness={0.92} /></mesh>
      {/* neon top trim on the walls (agent color) */}
      <mesh position={[0, 2.42, -BD/2 + 0.04]}><boxGeometry args={[BW, 0.07, 0.12]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} /></mesh>
      <mesh position={[-BW/2 + 0.04, 2.42, 0]}><boxGeometry args={[0.12, 0.07, BD]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} /></mesh>
      {/* live wall screen on the back wall */}
      <WallScreen position={[0.05, 1.35, -BD/2 + 0.12]} w={1.6} h={0.92} accent={c} kind={kind} />
      {/* office title sign on the back wall */}
      <Text font={TOON_FONT} position={[0, 2.05, -BD/2 + 0.12]} fontSize={0.2} color="#ffd21e" anchorX="center" outlineWidth={0.008} outlineColor="#000" maxWidth={3.8}>{m.title}</Text>
      {/* a hanging picture inside each booth (interior detail) */}
      <HangingFrame position={[-BW/2 + 0.14, 1.5, 0.6]} accent={c} w={0.5} h={0.6} face="x" tilt={0.04} />

      {/* role-specific equipment for this office */}
      <RoleProps id={m.id} c={c} />

      {/* desk + seated, live-working agent */}
      <Workstation position={[0, 0, 0]} color={c} kind={kind} />
      <Inspect id={m.id} onPick={() => onAgent(m, [position[0], position[2] + 0.4])}>
        <HumanCharacter live seated position={[0, 0.06, 0.62]} rotation={[0, Math.PI, 0]} suit={c} hair={m.hair} beard={m.beard} glasses={m.glasses} bowtie={m.bowtie} gesture={m.gesture === 'idle' ? 'type' : m.gesture} name={m.name.split(' ')[0].toUpperCase()} status={m.status} seed={seedN} scale={0.66} />
      </Inspect>

      {/* desk props: coffee mug, paper stack, small plant */}
      <mesh position={[-0.62, 0.83, 0.26]}><cylinderGeometry args={[0.05, 0.045, 0.1, 12]} /><meshStandardMaterial color={c} roughness={0.5} /></mesh>
      <group position={[0.6, 0.82, 0.28]}>{[0,1,2].map(k=><mesh key={k} position={[0,k*0.012,0]} rotation={[0,k*0.1,0]}><boxGeometry args={[0.22,0.01,0.16]} /><meshStandardMaterial color="#fff" roughness={0.9} /></mesh>)}</group>
      <group position={[0.78, 0.78, -0.3]}>
        <mesh position={[0,0.06,0]}><cylinderGeometry args={[0.07,0.09,0.12,10]} /><meshStandardMaterial color="#5cc4b4" roughness={0.85} /></mesh>
        {[0,1,2,3].map(k=><mesh key={k} position={[Math.cos(k)*0.04,0.18,Math.sin(k)*0.04]} rotation={[Math.cos(k)*0.4,k,0]}><coneGeometry args={[0.05,0.22,5]} /><meshStandardMaterial color={k%2?'#7dd87d':'#5cc46a'} /></mesh>)}
      </group>

      {/* floating status / chat bubble */}
      <WorkBubble position={[0, 1.95, 0.4]} text={phrase} accent={c} seed={seedN} />
    </group>
  );
}

/* === HANGING FRAME — a picture on the wall with cord + hook + slight tilt
       (cheerful Simpsons-cartoon look). `face` = which way it faces. === */
// a cartoon MAGIC MUSHROOM painted inside the frame (cap color varies)
function MushroomArt({ w, h, cap }: { w: number; h: number; cap: string }) {
  const s = Math.min(w, h);
  return (
    <group position={[0, 0, 0.034]}>
      {/* dreamy sky background */}
      <mesh position={[0, h * 0.1, -0.001]}><planeGeometry args={[w * 0.82, h * 0.82]} /><meshStandardMaterial color="#2a1840" emissive="#3a2456" emissiveIntensity={0.25} /></mesh>
      {/* glowing dots (spores) */}
      {[[-0.25,0.28],[0.22,0.3],[0.3,-0.05],[-0.3,0.05]].map((p,i)=><mesh key={i} position={[p[0]*w, p[1]*h, 0]}><circleGeometry args={[s*0.02,10]} /><meshBasicMaterial color="#ffe1ee" /></mesh>)}
      {/* stem */}
      <mesh position={[0, -h * 0.16, 0]}><planeGeometry args={[s * 0.16, h * 0.34]} /><meshStandardMaterial color="#f3e9d8" /></mesh>
      {/* cap (half-ellipse via scaled circle) */}
      <mesh position={[0, h * 0.06, 0.001]} scale={[1.5, 0.95, 1]}><circleGeometry args={[s * 0.26, 24, 0, Math.PI]} /><meshStandardMaterial color={cap} emissive={cap} emissiveIntensity={0.35} /></mesh>
      {/* white spots on the cap */}
      {[[-0.18,0.12],[0.16,0.14],[0,0.22],[-0.05,0.05]].map((p,i)=><mesh key={i} position={[p[0]*w*0.7, h*0.06 + p[1]*h*0.4, 0.002]}><circleGeometry args={[s*0.035,12]} /><meshBasicMaterial color="#fff" /></mesh>)}
      {/* grass base */}
      <mesh position={[0, -h * 0.34, 0]}><planeGeometry args={[w * 0.82, h * 0.14]} /><meshStandardMaterial color="#5cc46a" /></mesh>
    </group>
  );
}
function HangingFrame({ position, accent, w = 0.8, h = 1.0, tilt = 0, face = 'z', onClick }: { position: [number, number, number]; accent: string; w?: number; h?: number; tilt?: number; face?: 'z' | 'x'; onClick?: () => void }) {
  const rotY = face === 'x' ? Math.PI / 2 : 0;
  const [hover, setHover] = useState(false);
  // cap colour cycles through magic-mushroom palette by accent
  const cap = accent;
  return (
    <group position={position} rotation={[0, rotY, tilt]} scale={hover ? 1.08 : 1}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onClick ? (e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'zoom-in'; } : undefined}
      onPointerOut={onClick ? () => { setHover(false); document.body.style.cursor = 'auto'; } : undefined}>
      {/* cord up to a hook */}
      <mesh position={[-0.18, h / 2 + 0.18, 0.01]} rotation={[0, 0, 0.5]}><cylinderGeometry args={[0.006, 0.006, 0.42, 4]} /><meshStandardMaterial color="#5a4a3a" /></mesh>
      <mesh position={[0.18, h / 2 + 0.18, 0.01]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.006, 0.006, 0.42, 4]} /><meshStandardMaterial color="#5a4a3a" /></mesh>
      <mesh position={[0, h / 2 + 0.36, 0.01]}><sphereGeometry args={[0.025, 8, 8]} /><meshStandardMaterial color="#8a8270" metalness={0.5} /></mesh>
      {/* gold frame (glows on hover) + mat */}
      <mesh><boxGeometry args={[w + 0.1, h + 0.1, 0.05]} /><meshStandardMaterial color="#caa44a" metalness={0.5} roughness={0.4} emissive="#caa44a" emissiveIntensity={hover ? 0.5 : 0.05} /></mesh>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[w, h]} /><meshStandardMaterial color="#1a1030" /></mesh>
      {/* the magic-mushroom painting */}
      <MushroomArt w={w} h={h} cap={cap} />
    </group>
  );
}

/* === WALKER — an agent that strolls a looping path between zones (Arturitu) === */
function Walker({ m, path, speed = 1.1, onAgent }: { m: TeamMember; path: [number, number][]; speed?: number; onAgent: (a: TeamMember, pos: [number, number]) => void }) {
  const g = useRef<THREE.Group>(null);
  const c = m.color === '#1a1a1a' ? '#444' : m.color;
  const seg = useRef(0);          // current path segment
  const tt = useRef(0);           // 0..1 along the segment
  const here = useRef<[number, number]>([path[0][0], path[0][1]]);
  useFrame((_, delta) => {
    if (!g.current) return;
    const a = path[seg.current];
    const b = path[(seg.current + 1) % path.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    tt.current += (delta * speed) / len;
    if (tt.current >= 1) { tt.current = 0; seg.current = (seg.current + 1) % path.length; }
    const x = a[0] + dx * tt.current, z = a[1] + dz * tt.current;
    g.current.position.set(x, 0, z);
    g.current.rotation.y = Math.atan2(dx, dz);   // face travel direction
    here.current = [x, z];
  });
  return (
    <group ref={g}>
      <Inspect id={m.id} onPick={() => onAgent(m, here.current)}>
        <HumanCharacter walk suit={c} hair={m.hair} beard={m.beard} glasses={m.glasses} name={m.name.split(' ')[0].toUpperCase()} status="WALKING" seed={m.id.charCodeAt(0)} scale={0.66} />
      </Inspect>
    </group>
  );
}

/* === a labelled sub-room zone (low partition walls + tinted floor + sign) === */
function ZoneShell({ x, z, w, d, color, label }: { x: number; z: number; w: number; d: number; color: string; label: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><planeGeometry args={[w, d]} /><meshStandardMaterial color={color} transparent opacity={0.12} roughness={1} /></mesh>
      {/* low glass-ish partitions on the two inner sides */}
      <mesh position={[0, 0.55, -d / 2]}><boxGeometry args={[w, 1.1, 0.1]} /><meshStandardMaterial color="#f6dcea" transparent opacity={0.7} roughness={0.6} /></mesh>
      <mesh position={[-w / 2, 0.55, 0]}><boxGeometry args={[0.1, 1.1, d]} /><meshStandardMaterial color="#f2cfe0" transparent opacity={0.7} roughness={0.6} /></mesh>
      <mesh position={[0, 1.12, -d / 2]}><boxGeometry args={[w, 0.05, 0.12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} /></mesh>
      <Text font={TOON_FONT} position={[0, 1.5, -d / 2 + 0.1]} fontSize={0.3} color="#ffd21e" anchorX="center" outlineWidth={0.01} outlineColor="#000">{label}</Text>
    </group>
  );
}

/* === MEETING ROOM — rounded boardroom table, chairs facing center, big
       presentation wall, whiteboard, plants — detailed & fun === */
function MeetingRoom({ x, z }: { x: number; z: number }) {
  const chairColors = ['#ff6a8a', '#6fb3ff', '#34f5a0', '#ffd21e', '#c79be0', '#ff7a3d', '#9fdce6', '#b48fd0'];
  return (
    <group position={[x, 0, z]}>
      <ZoneShell x={0} z={0} w={9} d={8} color="#3b82f6" label="MEETING ROOM" />
      {/* glossy rounded conference table + chrome pedestal */}
      <RoundedBox args={[3.4, 0.18, 2.0]} radius={0.4} position={[0, 0.78, 0]} castShadow receiveShadow><meshStandardMaterial color="#eadcf4" roughness={0.35} metalness={0.1} /></RoundedBox>
      <mesh position={[0, 0.74, 0]}><boxGeometry args={[3.0, 0.04, 1.7]} /><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.12} /></mesh>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.3, 0.45, 0.7, 20]} /><meshStandardMaterial color="#c8c2d2" metalness={0.5} roughness={0.3} /></mesh>
      {/* centerpiece: little plant + papers + laptops */}
      <mesh position={[0, 0.92, 0]}><cylinderGeometry args={[0.12, 0.15, 0.16, 12]} /><meshStandardMaterial color="#5cc4b4" /></mesh>
      {[-1.0, 0, 1.0].map((lx) => <mesh key={lx} position={[lx, 0.9, 0.5]} rotation={[-0.3, 0, 0]}><boxGeometry args={[0.34, 0.02, 0.24]} /><meshStandardMaterial color="#2a2440" emissive="#6fb3ff" emissiveIntensity={0.3} /></mesh>)}
      {/* 8 chairs around the table — each correctly FACING the center */}
      {Array.from({ length: 8 }).map((_, k) => {
        const a = (k / 8) * Math.PI * 2;
        const cx = Math.cos(a) * 2.5, cz = Math.sin(a) * 1.9;
        return <Chair key={k} position={[cx, 0, cz]} rotation={[0, Math.atan2(-cx, -cz), 0]} color={chairColors[k]} />;
      })}
      {/* big presentation screen + frame */}
      <mesh position={[0, 1.6, -3.74]}><boxGeometry args={[3.6, 2.1, 0.12]} /><meshStandardMaterial color="#1a1424" /></mesh>
      <WallScreen position={[0, 1.6, -3.66]} w={3.2} h={1.7} accent="#3b82f6" kind="chart" />
      {/* whiteboard on the side wall */}
      <group position={[-4.0, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[2.4, 1.4, 0.08]} /><meshStandardMaterial color="#fff" /></mesh>
        {[0,1,2].map(k=><mesh key={k} position={[-0.6+k*0.6, 0.2-k*0.18, 0.05]} rotation={[0,0,k*0.1]}><boxGeometry args={[0.7,0.04,0.01]} /><meshStandardMaterial color={['#ff6a8a','#3b82f6','#34f5a0'][k]} /></mesh>)}
      </group>
      {/* pendant lights over the table */}
      {[-1, 1].map((px) => <group key={px} position={[px, 2.6, 0]}>
        <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.01, 0.01, 0.8, 6]} /><meshStandardMaterial color="#888" /></mesh>
        <mesh><coneGeometry args={[0.26, 0.3, 18, 1, true]} /><meshStandardMaterial color="#ffd21e" emissive="#ffd21e" emissiveIntensity={0.5} side={THREE.DoubleSide} /></mesh>
      </group>)}
      <pointLight position={[0, 2.4, 0]} intensity={0.5} color="#fff4ea" distance={7} />
      <Pot big position={[3.6, 0, -3.2]} />
      <Pot position={[-3.6, 0, 3.2]} />
    </group>
  );
}

/* === KITCHEN / EATING ROOM — counter, fridge, dining table === */
function KitchenRoom({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <ZoneShell x={0} z={0} w={9} d={7} color="#f6a96a" label="KITCHEN · EATING" />
      {/* counter + cabinets along the back */}
      <mesh position={[0, 0.5, -2.8]}><boxGeometry args={[6, 1.0, 0.7]} /><meshStandardMaterial color="#f0c9a0" roughness={0.7} /></mesh>
      <mesh position={[0, 1.02, -2.8]}><boxGeometry args={[6, 0.06, 0.74]} /><meshStandardMaterial color="#fff4ea" roughness={0.4} /></mesh>
      {/* fridge */}
      <mesh position={[2.6, 0.9, -2.8]}><boxGeometry args={[0.9, 1.8, 0.7]} /><meshStandardMaterial color="#e8f4f8" roughness={0.4} metalness={0.1} /></mesh>
      <mesh position={[2.2, 0.9, -2.43]}><boxGeometry args={[0.04, 0.5, 0.04]} /><meshStandardMaterial color="#b8c4cc" metalness={0.5} /></mesh>
      {/* coffee machine + mugs on counter */}
      <mesh position={[-2.2, 1.2, -2.8]}><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color="#5a4a6a" roughness={0.5} /></mesh>
      {[0,1,2].map(k=><mesh key={k} position={[-1.4+k*0.22,1.1,-2.7]}><cylinderGeometry args={[0.06,0.05,0.1,12]} /><meshStandardMaterial color={['#ff6a8a','#34f5a0','#06b6d4'][k]} /></mesh>)}
      {/* microwave + toaster + fruit bowl on the counter (fun details) */}
      <mesh position={[0.4, 1.25, -2.8]}><boxGeometry args={[0.5, 0.32, 0.4]} /><meshStandardMaterial color="#2a2440" emissive="#ff6a8a" emissiveIntensity={0.15} /></mesh>
      <mesh position={[-0.8, 1.2, -2.8]}><boxGeometry args={[0.34, 0.24, 0.26]} /><meshStandardMaterial color="#ff6a8a" metalness={0.2} roughness={0.5} /></mesh>
      <group position={[1.5, 1.12, -2.7]}>
        <mesh><cylinderGeometry args={[0.16, 0.12, 0.1, 16]} /><meshStandardMaterial color="#f0a060" /></mesh>
        {[['#ff4d6d',0.08,0.05],['#ffd21e',-0.06,0.07],['#34f5a0',0.02,-0.06]].map((f,i)=><mesh key={i} position={[f[1] as number,0.1,f[2] as number]}><sphereGeometry args={[0.06,10,10]} /><meshStandardMaterial color={f[0] as string} /></mesh>)}
      </group>
      {/* hanging "CAFE" sign */}
      <Text font={TOON_FONT} position={[0, 2.0, -2.5]} fontSize={0.32} color="#ffd21e" anchorX="center" outlineWidth={0.01} outlineColor="#000">☕ CAFE</Text>
      {/* round dining table + 4 colourful stools + a pizza box */}
      <mesh position={[0, 0.7, 1.2]}><cylinderGeometry args={[1.1, 1.1, 0.12, 24]} /><meshStandardMaterial color="#f7d6e4" roughness={0.45} metalness={0.05} /></mesh>
      <mesh position={[0, 0.35, 1.2]}><cylinderGeometry args={[0.12, 0.16, 0.7, 12]} /><meshStandardMaterial color="#ee8866" /></mesh>
      <mesh position={[0, 0.77, 1.2]} rotation={[0, 0.4, 0]}><boxGeometry args={[0.5, 0.06, 0.5]} /><meshStandardMaterial color="#e8b06a" /></mesh>
      {Array.from({ length: 4 }).map((_, k) => { const a = (k / 4) * Math.PI * 2; return <mesh key={k} position={[Math.cos(a) * 1.7, 0.45, 1.2 + Math.sin(a) * 1.7]}><cylinderGeometry args={[0.26, 0.26, 0.12, 16]} /><meshStandardMaterial color={['#ff6a8a','#6fb3ff','#34f5a0','#ffd21e'][k]} /></mesh>; })}
      <Pot position={[-3.4, 0, 2.4]} />
      <pointLight position={[0, 2.4, 0]} intensity={0.4} color="#ffe1c4" distance={7} />
    </group>
  );
}

/* === LOUNGE / RELAX ROOM — sofas, rug, plant, tv === */
function LoungeRoom({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <ZoneShell x={0} z={0} w={9} d={7} color="#34c0b4" label="RELAX LOUNGE" />
      {/* round patterned rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.6]}><circleGeometry args={[2.6, 36]} /><meshStandardMaterial color="#bfeef0" roughness={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.6]}><ringGeometry args={[1.7, 1.85, 36]} /><meshBasicMaterial color="#34c0b4" /></mesh>
      <Sofa position={[-1.4, 0, 1.9]} rotation={[0, 0.3, 0]} color="#ff7a3d" />
      <Sofa position={[2.0, 0, 0.6]} rotation={[0, -Math.PI / 2 - 0.2, 0]} color="#5cc46a" />
      {/* beanbags (fun) */}
      <mesh position={[-1.8, 0.3, -0.4]}><sphereGeometry args={[0.45, 16, 12]} /><meshStandardMaterial color="#ff6a8a" roughness={0.8} /></mesh>
      <mesh position={[0.3, 0.28, 2.2]}><sphereGeometry args={[0.42, 16, 12]} /><meshStandardMaterial color="#ffd21e" roughness={0.8} /></mesh>
      {/* coffee table + mugs + books */}
      <mesh position={[0, 0.34, 0.6]}><boxGeometry args={[1.2, 0.12, 0.7]} /><meshStandardMaterial color="#a8806a" roughness={0.55} /></mesh>
      {[0,1].map(k=><mesh key={k} position={[-0.3+k*0.3, 0.44, 0.6]}><cylinderGeometry args={[0.05,0.045,0.1,12]} /><meshStandardMaterial color={['#ff6a8a','#6fb3ff'][k]} /></mesh>)}
      <mesh position={[0.35, 0.42, 0.5]} rotation={[0,0.3,0]}><boxGeometry args={[0.3,0.05,0.22]} /><meshStandardMaterial color="#34f5a0" /></mesh>
      {/* big wall TV in a frame */}
      <mesh position={[0, 1.6, -3.24]}><boxGeometry args={[3.0, 1.8, 0.12]} /><meshStandardMaterial color="#1a1424" /></mesh>
      <WallScreen position={[0, 1.6, -3.16]} w={2.6} h={1.5} accent="#34c0b4" kind="ui" />
      {/* arcade machine (gamified fun) */}
      <group position={[3.2, 0, -2.2]}>
        <mesh position={[0, 0.8, 0]}><boxGeometry args={[0.7, 1.6, 0.6]} /><meshStandardMaterial color="#7e3ea8" roughness={0.5} /></mesh>
        <mesh position={[0, 1.25, 0.31]}><planeGeometry args={[0.5, 0.4]} /><meshStandardMaterial color="#06122a" emissive="#06b6d4" emissiveIntensity={0.5} /></mesh>
        <mesh position={[0, 0.85, 0.31]}><boxGeometry args={[0.5, 0.18, 0.04]} /><meshStandardMaterial color="#1a1424" /></mesh>
        <mesh position={[-0.12, 0.92, 0.34]}><sphereGeometry args={[0.04,8,8]} /><meshStandardMaterial color="#ff4d6d" emissive="#ff4d6d" emissiveIntensity={0.6} /></mesh>
      </group>
      <Pot big position={[-3.4, 0, 2.4]} />
      <pointLight position={[0, 2.4, 0]} intensity={0.4} color="#bfeef0" distance={7} />
    </group>
  );
}

/* === MUSIC RECORDING STUDIO — mixing console, monitors, mic booth, keys === */
function MusicStudio({ x, z, onAgent }: { x: number; z: number; onAgent: (m: TeamMember, pos: [number, number]) => void }) {
  const producer = byId('music');
  const artist = byId('mkt');   // Mia as the singing artist in the booth
  return (
    <group position={[x, 0, z]}>
      <ZoneShell x={0} z={0} w={9} d={7} color="#b83fc4" label="MUSIC STUDIO · SUNO AI" />
      {/* big mixing console (angled desk + faders + knobs) */}
      <group position={[0, 0, -1.6]}>
        <mesh position={[0, 0.7, 0]} rotation={[-0.18, 0, 0]}><boxGeometry args={[3.0, 0.12, 1.0]} /><meshStandardMaterial color="#241f38" roughness={0.5} /></mesh>
        <mesh position={[0, 0.4, 0.2]}><boxGeometry args={[3.0, 0.6, 0.5]} /><meshStandardMaterial color="#1a1430" /></mesh>
        {/* fader strips */}
        {Array.from({ length: 16 }).map((_, k) => <mesh key={k} position={[-1.4 + k * 0.19, 0.78, -0.1]}><boxGeometry args={[0.05, 0.02, 0.18]} /><meshStandardMaterial color={k % 3 ? '#34f5a0' : '#ff6a8a'} emissive={k % 3 ? '#34f5a0' : '#ff6a8a'} emissiveIntensity={0.6} /></mesh>)}
        {/* knobs row */}
        {Array.from({ length: 16 }).map((_, k) => <mesh key={k} position={[-1.4 + k * 0.19, 0.74, 0.12]}><cylinderGeometry args={[0.03, 0.03, 0.04, 8]} /><meshStandardMaterial color="#6fb3ff" emissive="#6fb3ff" emissiveIntensity={0.4} /></mesh>)}
      </group>
      {/* studio monitors on stands */}
      {[-2.0, 2.0].map((mx) => <group key={mx} position={[mx, 0, -2.4]}>
        <mesh position={[0, 1.3, 0]}><boxGeometry args={[0.5, 0.7, 0.4]} /><meshStandardMaterial color="#15121f" /></mesh>
        <mesh position={[0, 1.4, 0.21]}><circleGeometry args={[0.16, 20]} /><meshStandardMaterial color="#b83fc4" emissive="#b83fc4" emissiveIntensity={0.4} /></mesh>
        <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.04, 0.06, 1.1, 8]} /><meshStandardMaterial color="#888" /></mesh>
      </group>)}
      {/* MUSIC AI PRODUCER — seated at the console, generating with Suno */}
      {producer && (
        <Inspect id={producer.id} onPick={() => onAgent(producer, [x + 0, z - 1.0])}>
          <HumanCharacter live seated position={[0, 0.06, -0.55]} rotation={[0, 0, 0]} suit="#b83fc4" hair={producer.hair} gesture="type" name="LEO" status="GENERATING" seed={77} scale={0.66} />
        </Inspect>
      )}
      <WorkBubble position={[0, 2.0, -0.4]} text="Suno: generating track…" accent="#b83fc4" seed={77} />
      {/* vocal mic booth + SINGING ARTIST (animated wave gesture) */}
      <group position={[3.0, 0, 1.6]}>
        <mesh position={[0, 1.1, 0]}><boxGeometry args={[1.4, 2.2, 1.4]} /><meshStandardMaterial color="#bfeaf0" transparent opacity={0.16} roughness={0.05} /></mesh>
        <mesh position={[0, 1.5, -0.45]}><cylinderGeometry args={[0.07, 0.07, 0.3, 12]} /><meshStandardMaterial color="#ffd21e" metalness={0.5} /></mesh>
        <mesh position={[0, 1.7, -0.45]}><torusGeometry args={[0.16, 0.02, 8, 20]} /><meshStandardMaterial color="#444" /></mesh>
        {artist && (
          <Inspect id={artist.id} onPick={() => onAgent(artist, [x + 3, z + 2.4])}>
            <HumanCharacter live position={[0, 0.0, 0.1]} rotation={[0, 0, 0]} suit={artist.color} hair={artist.hair} gesture="wave" name="ARTIST" status="SINGING ♪" seed={88} scale={0.66} />
          </Inspect>
        )}
        {/* floating music notes around the singer */}
        {['♪','♫','♬'].map((n,i)=><Billboard key={i} position={[0.4 - i*0.4, 1.9 + i*0.12, 0.3]}><Text fontSize={0.22} color="#ffd21e" outlineWidth={0.01} outlineColor="#000">{n}</Text></Billboard>)}
      </group>
      {/* acoustic foam panels on the back wall */}
      {Array.from({ length: 12 }).map((_, k) => <mesh key={k} position={[-2.6 + (k % 6) * 0.9, 2.4 - Math.floor(k / 6) * 0.9, -3.42]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.5, 0.5, 0.06]} /><meshStandardMaterial color={k % 2 ? '#7e3ea8' : '#9a4fd0'} roughness={0.95} /></mesh>)}
      {/* keyboard / synth on a stand */}
      <group position={[-3.0, 0, 1.4]}>
        <mesh position={[0, 0.7, 0]} rotation={[0, 0.5, 0]}><boxGeometry args={[1.2, 0.08, 0.34]} /><meshStandardMaterial color="#15121f" /></mesh>
        {Array.from({ length: 14 }).map((_, k) => <mesh key={k} position={[-0.5 + k * 0.08, 0.75, 0.1]} rotation={[0, 0.5, 0]}><boxGeometry args={[0.06, 0.02, 0.18]} /><meshStandardMaterial color={k % 2 ? '#111' : '#fff'} /></mesh>)}
      </group>
      <pointLight position={[0, 2.4, -1]} intensity={0.5} color="#d89bff" distance={8} />
      <Pot position={[-3.4, 0, 3.0]} />
    </group>
  );
}

/* === VIDEO PRODUCTION OFFICE — editing suite, cameras, softboxes, green screen === */
function VideoStudio({ x, z, onAgent }: { x: number; z: number; onAgent: (m: TeamMember, pos: [number, number]) => void }) {
  const editor = byId('video');
  return (
    <group position={[x, 0, z]}>
      <ZoneShell x={0} z={0} w={9} d={7} color="#06b6d4" label="VIDEO PRODUCTION · REELS AI" />
      {/* editing desk with triple monitors + RGB */}
      <group position={[-2.0, 0, -1.6]}>
        <mesh position={[0, 0.74, 0]}><boxGeometry args={[2.6, 0.1, 1.0]} /><meshStandardMaterial color="#241f38" /></mesh>
        {[-0.8, 0, 0.8].map((mx, i) => <group key={i} position={[mx, 0, -0.2]} rotation={[0, -mx * 0.3, 0]}>
          <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.72, 0.42, 0.04]} /><meshStandardMaterial color="#05080a" emissive="#06b6d4" emissiveIntensity={0.5} /></mesh>
          <mesh position={[0, 0.92, 0]}><boxGeometry args={[0.06, 0.18, 0.06]} /><meshStandardMaterial color="#888" /></mesh>
        </group>)}
        {/* RGB strip + timeline bars */}
        <mesh position={[0, 0.8, 0.3]}><boxGeometry args={[1.4, 0.04, 0.14]} /><meshStandardMaterial color="#ff6a8a" emissive="#ff6a8a" emissiveIntensity={0.6} /></mesh>
      </group>
      {/* VIDEO & REELS AI — seated at the editing suite, rendering content */}
      {editor && (
        <Inspect id={editor.id} onPick={() => onAgent(editor, [x - 2.0, z - 0.6])}>
          <HumanCharacter live seated position={[-2.0, 0.06, -0.9]} rotation={[0, 0, 0]} suit="#06b6d4" hair={editor.hair} gesture="type" name="ZOE" status="RENDERING" seed={91} scale={0.66} />
        </Inspect>
      )}
      <WorkBubble position={[-2.0, 2.0, -0.6]} text="Rendering reel…" accent="#06b6d4" seed={91} />
      {/* green screen backdrop */}
      <mesh position={[2.4, 1.4, -3.3]}><boxGeometry args={[3.0, 2.6, 0.08]} /><meshStandardMaterial color="#21d07a" emissive="#21d07a" emissiveIntensity={0.25} /></mesh>
      {/* pro camera on tripod aimed at the screen */}
      <group position={[2.4, 0, -0.6]}>
        <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI, 0]}><boxGeometry args={[0.4, 0.3, 0.6]} /><meshStandardMaterial color="#15121f" /></mesh>
        <mesh position={[0, 1.2, -0.34]}><cylinderGeometry args={[0.1, 0.12, 0.2, 16]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.03, 0.03, 1.2, 6]} /><meshStandardMaterial color="#888" /></mesh>
      </group>
      {/* two softbox lights */}
      {[[0.6, 0.6], [4.0, 0.4]].map((p, i) => <group key={i} position={[p[0], 0, 1.6]} rotation={[0.2, i ? -0.5 : 0.5, 0]}>
        <mesh position={[0, 1.6, 0]}><boxGeometry args={[0.7, 0.7, 0.1]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.9} /></mesh>
        <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.025, 0.025, 1.6, 6]} /><meshStandardMaterial color="#888" /></mesh>
      </group>)}
      <pointLight position={[1.5, 2.6, 0]} intensity={0.6} color="#cdeffb" distance={9} />
      <Pot position={[-3.4, 0, 3.0]} />
    </group>
  );
}

/* === BOSS STARTUP STATUS STAND — a big board showing every venture's live
       stage + animated progress (the founder's command overview) === */
// Real 6-EMPIRE ventures — mapped to Roland's GitHub repos (github.com/RolandGasparyan)
const STARTUPS: { name: string; stage: string; prog: number; color: string; repo: string }[] = [
  { name: '6-EMPIRES OS',      stage: 'SCALING',  prog: 0.86, color: '#ffd21e', repo: '6-empires-os' },
  { name: 'TRADING GURU',      stage: 'LIVE',     prog: 0.72, color: '#34f5a0', repo: 'trading-guru-empire' },
  { name: 'STRATEGY LAB',      stage: 'BUILDING', prog: 0.55, color: '#6fb3ff', repo: 'strategy-lab-mac' },
  { name: 'DZAYN APP',         stage: 'BETA',     prog: 0.6,  color: '#06b6d4', repo: 'dzayn-app' },
  { name: 'EMPIRE AI',         stage: 'LIVE',     prog: 0.78, color: '#b83fc4', repo: '6-empires-os' },
  { name: 'VENTURE FABRIC',    stage: 'IDEA',     prog: 0.22, color: '#ff9bbf', repo: '' },
];
function ProgressBar({ y, w, prog, color }: { y: number; w: number; prog: number; color: string }) {
  const fill = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (!fill.current) return;
    // gentle live "breathing" around the target value (reads as real-time)
    const p = Math.min(1, Math.max(0.04, prog + Math.sin(s.clock.elapsedTime * 1.2 + prog * 9) * 0.02));
    fill.current.scale.x = p;
    fill.current.position.x = -w / 2 + (w * p) / 2;
  });
  return (
    <group position={[0, y, 0.04]}>
      <mesh><planeGeometry args={[w, 0.12]} /><meshBasicMaterial color="#1a1424" /></mesh>
      <mesh ref={fill} position={[-w / 2, 0, 0.001]}><planeGeometry args={[w, 0.1]} /><meshBasicMaterial color={color} /></mesh>
    </group>
  );
}
function StartupStand({ position }: { position: [number, number, number] }) {
  const W = 5.6, H = 4.2;   // taller board to fit all real repos
  // LIVE: pull real repo activity from the sync service and override stage/prog
  const [rows, setRows] = useState(STARTUPS);
  const [live, setLive] = useState(false);
  useEffect(() => {
    let alive = true;
    const STAGE_COLOR: Record<string, string> = { LIVE: '#34f5a0', BETA: '#6fb3ff', BUILDING: '#ffd21e', PAUSED: '#ff9bbf', IDEA: '#ff9bbf' };
    const pull = () => fetch('/api/empire/state').then((r) => r.json()).then((d) => {
      if (!alive || !d?.ok || !Array.isArray(d.repos)) return;
      const real = d.repos.filter((r: any) => r && !r.error);
      if (!real.length) return;
      setLive(true);
      // show the REAL repos (name uppercased, real stage + progress + colour)
      setRows(real.slice(0, 8).map((g: any) => ({
        name: (g.name || '').replace(/-/g, ' ').toUpperCase().slice(0, 22),
        stage: g.stage || 'BUILDING',
        prog: typeof g.prog === 'number' ? g.prog : 0.4,
        color: STAGE_COLOR[g.stage] || '#9fdce6',
      })));
    }).catch(() => {});
    pull();
    const id = setInterval(pull, 60000);   // refresh each minute
    return () => { alive = false; clearInterval(id); };
  }, []);
  return (
    <group position={position}>
      {/* stand legs + panel */}
      <mesh position={[-W / 2 + 0.3, 0.9, 0]}><boxGeometry args={[0.12, 1.8, 0.12]} /><meshStandardMaterial color="#8a6db0" /></mesh>
      <mesh position={[W / 2 - 0.3, 0.9, 0]}><boxGeometry args={[0.12, 1.8, 0.12]} /><meshStandardMaterial color="#8a6db0" /></mesh>
      <mesh position={[0, 1.8 + H / 2, 0]}><boxGeometry args={[W, H, 0.12]} /><meshStandardMaterial color="#120e1c" emissive="#1a1430" emissiveIntensity={0.4} /></mesh>
      <mesh position={[0, 1.8 + H / 2, 0.07]}><planeGeometry args={[W - 0.2, H - 0.2]} /><meshBasicMaterial color="#171127" /></mesh>
      {/* header — shows LIVE when synced to GitHub */}
      <Text font={TOON_FONT} position={[0, 1.8 + H - 0.42, 0.1]} fontSize={0.32} color="#ffd21e" anchorX="center" outlineWidth={0.012} outlineColor="#000">{live ? 'STARTUPS · GITHUB LIVE' : 'STARTUPS · LIVE STATUS'}</Text>
      {/* rows */}
      {rows.map((s, i) => {
        const rowY = 1.8 + H - 0.95 - i * 0.42;
        return (
          <group key={s.name} position={[0, rowY, 0.1]}>
            <Text position={[-W / 2 + 0.35, 0.08, 0]} fontSize={0.15} color="#fff" anchorX="left" anchorY="middle">{s.name}</Text>
            <Text position={[W / 2 - 0.35, 0.08, 0]} fontSize={0.12} color={s.color} anchorX="right" anchorY="middle">{s.stage}</Text>
            <group position={[0, -0.08, 0]}><ProgressBar y={0} w={W - 0.7} prog={s.prog} color={s.color} /></group>
          </group>
        );
      })}
    </group>
  );
}

/* === reference-quality DECOR (Simpsons living-room look) ===================== */
// wall sconce (little uplight on the wall)
function Sconce({ position, face = 'z' }: { position: [number, number, number]; face?: 'z' | 'x' }) {
  return (
    <group position={position} rotation={[0, face === 'x' ? Math.PI / 2 : 0, 0]}>
      <mesh><cylinderGeometry args={[0.05, 0.09, 0.22, 12, 1, true]} /><meshStandardMaterial color="#fff4ea" emissive="#ffe1ee" emissiveIntensity={0.7} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.14, 0.04]}><boxGeometry args={[0.05, 0.12, 0.05]} /><meshStandardMaterial color="#caa44a" metalness={0.5} roughness={0.4} /></mesh>
      <pointLight position={[0, 0.2, 0.1]} intensity={0.25} color="#ffe1ee" distance={3} />
    </group>
  );
}
// big window with bright yellow curtains + sky (reference signature)
function CurtainWindow({ position, face = 'z' }: { position: [number, number, number]; face?: 'z' | 'x' }) {
  return (
    <group position={position} rotation={[0, face === 'x' ? Math.PI / 2 : 0, 0]}>
      <mesh><boxGeometry args={[2.6, 2.2, 0.06]} /><meshStandardMaterial color="#7a5a3a" roughness={0.6} /></mesh>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[2.3, 1.9]} /><meshStandardMaterial color="#9fd8ec" emissive="#bfeaf6" emissiveIntensity={0.35} /></mesh>
      {/* muntins */}
      <mesh position={[0, 0, 0.04]}><boxGeometry args={[0.05, 1.9, 0.01]} /><meshStandardMaterial color="#7a5a3a" /></mesh>
      <mesh position={[0, 0, 0.04]}><boxGeometry args={[2.3, 0.05, 0.01]} /><meshStandardMaterial color="#7a5a3a" /></mesh>
      {/* yellow curtains both sides + valance */}
      <mesh position={[-1.25, 0, 0.1]}><boxGeometry args={[0.45, 2.2, 0.08]} /><meshStandardMaterial color="#ffd21e" roughness={0.7} /></mesh>
      <mesh position={[1.25, 0, 0.1]}><boxGeometry args={[0.45, 2.2, 0.08]} /><meshStandardMaterial color="#ffd21e" roughness={0.7} /></mesh>
      <mesh position={[0, 1.15, 0.12]}><boxGeometry args={[2.9, 0.34, 0.1]} /><meshStandardMaterial color="#f4c81e" roughness={0.7} /></mesh>
      {/* window seat cushion */}
      <mesh position={[0, -1.0, 0.5]}><boxGeometry args={[2.3, 0.2, 0.9]} /><meshStandardMaterial color="#5cc46a" roughness={0.7} /></mesh>
    </group>
  );
}
// tall bookshelf (yellow, reference style)
function Bookshelf({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.5, 0]}><boxGeometry args={[1.3, 3.0, 0.5]} /><meshStandardMaterial color="#e8c84a" roughness={0.6} /></mesh>
      {[0.3, 1.0, 1.7, 2.4].map((y) => <mesh key={y} position={[0, y, 0.16]}><boxGeometry args={[1.15, 0.05, 0.16]} /><meshStandardMaterial color="#caa44a" /></mesh>)}
      {Array.from({ length: 16 }).map((_, i) => <mesh key={i} position={[-0.45 + (i % 4) * 0.3, 0.45 + Math.floor(i / 4) * 0.7, 0.2]}><boxGeometry args={[0.07, 0.4, 0.2]} /><meshStandardMaterial color={['#ff6a8a', '#34f5a0', '#6fb3ff', '#c79be0'][i % 4]} roughness={0.7} /></mesh>)}
    </group>
  );
}
// cozy armchair/sofa (wood-frame, reference style)
function Sofa({ position, rotation = [0, 0, 0], color = '#7a5a48' }: { position: [number, number, number]; rotation?: [number, number, number]; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.7, 0.4, 0.9]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[0, 0.75, -0.4]}><boxGeometry args={[1.7, 0.7, 0.18]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[-0.85, 0.62, 0]}><boxGeometry args={[0.2, 0.5, 0.9]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[0.85, 0.62, 0]}><boxGeometry args={[0.2, 0.5, 0.9]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[0, 0.6, 0.12]}><boxGeometry args={[1.4, 0.16, 0.6]} /><meshStandardMaterial color="#a8806a" roughness={0.6} /></mesh>
    </group>
  );
}
// colourful table lamp (reference: red/green shade)
function TableLamp({ position, shade = '#ff6a8a' }: { position: [number, number, number]; shade?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.12, 0.14, 0.04, 16]} /><meshStandardMaterial color="#b48fd0" /></mesh>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.02, 0.02, 0.4, 8]} /><meshStandardMaterial color="#caa44a" metalness={0.4} /></mesh>
      <mesh position={[0, 0.5, 0]}><coneGeometry args={[0.2, 0.26, 20, 1, true]} /><meshStandardMaterial color={shade} emissive={shade} emissiveIntensity={0.4} side={THREE.DoubleSide} /></mesh>
      <pointLight position={[0, 0.5, 0]} intensity={0.3} color={shade} distance={3} />
    </group>
  );
}

/* === ONE SQUARE WORKSPACE — Arturitu doll-house room with ALL agents working === */
function OneRoom({ onAgent, onFocus }: { onAgent: (m: TeamMember, pos: [number, number]) => void; onFocus: (pos: [number, number], tight?: boolean) => void }) {
  // One big open-plan floor: WORK WING on the left, three sub-rooms on the right.
  const W = 46, D = 42, H = 5.0;     // floor footprint (rectangular, deeper)
  const hw = W / 2, hd = D / 2;
  const PINK1 = '#f4b8cf', PINK2 = '#f0a8c4', FLOOR = '#7ecddd', PLINTH = '#4aa6bc';

  const boss = TEAM[0];
  // work-wing booths = everyone except the boss and the two media-studio agents
  // (music + video live in their own studios, placed below)
  const staff = TEAM.slice(1).filter((m) => m.id !== 'music' && m.id !== 'video');

  // work bays: 2 clean columns × 6 rows in the LEFT wing, evenly spaced,
  // starting clear of the boss suite and ending clear of the far wall.
  const BX = [-17.6, -11.0];          // two bay columns (6.6 apart → ~2.4 gap)
  const BZ0 = -12, BZS = 5.6;         // first row z, row spacing (~1.2 gap)

  return (
    <group>
      {/* ---- floor + raised plinth border (reference doll-house base) ---- */}
      <mesh position={[0, -0.25, 0]}><boxGeometry args={[W + 1.4, 0.5, D + 1.4]} /><meshStandardMaterial color={PLINTH} roughness={0.85} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[W, D]} /><meshStandardMaterial color={FLOOR} roughness={0.92} metalness={0} />
      </mesh>

      {/* ---- two visible tall walls (open-top doll-house: back + left) ---- */}
      <mesh position={[0, H / 2, -hd]} receiveShadow><boxGeometry args={[W, H, 0.3]} /><meshStandardMaterial color={PINK1} roughness={0.96} /></mesh>
      <mesh position={[-hw, H / 2, 0]} receiveShadow><boxGeometry args={[0.3, H, D]} /><meshStandardMaterial color={PINK2} roughness={0.96} /></mesh>
      {/* low far walls to enclose the box */}
      <mesh position={[0, 0.5, hd]}><boxGeometry args={[W, 1.0, 0.3]} /><meshStandardMaterial color={PINK1} roughness={0.96} /></mesh>
      <mesh position={[hw, 0.5, 0]}><boxGeometry args={[0.3, 1.0, D]} /><meshStandardMaterial color={PINK2} roughness={0.96} /></mesh>
      {/* cove lighting on the tall walls */}
      <mesh position={[0, H - 0.16, -hd + 0.2]}><boxGeometry args={[W * 0.95, 0.05, 0.05]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.5} /></mesh>
      <mesh position={[-hw + 0.2, H - 0.16, 0]}><boxGeometry args={[0.05, 0.05, D * 0.95]} /><meshStandardMaterial color="#fff4f8" emissive="#ffe1ee" emissiveIntensity={0.5} /></mesh>
      {/* Simpsons-style wainscot stripe + baseboard on the tall walls */}
      <mesh position={[0, 1.3, -hd + 0.16]}><boxGeometry args={[W, 0.12, 0.04]} /><meshStandardMaterial color="#fff4f8" roughness={0.7} /></mesh>
      <mesh position={[0, 0.12, -hd + 0.16]}><boxGeometry args={[W, 0.24, 0.05]} /><meshStandardMaterial color="#e89bb8" roughness={0.8} /></mesh>
      <mesh position={[-hw + 0.16, 1.3, 0]}><boxGeometry args={[0.04, 0.12, D]} /><meshStandardMaterial color="#fff4f8" roughness={0.7} /></mesh>
      <mesh position={[-hw + 0.16, 0.12, 0]}><boxGeometry args={[0.05, 0.24, D]} /><meshStandardMaterial color="#e394b4" roughness={0.8} /></mesh>
      {/* round porthole "windows" with sky-blue glass (cheerful Simpsons look) */}
      {[-3, 8, 18].map((zx) => (
        <group key={zx} position={[zx, 3.4, -hd + 0.2]}>
          <mesh><torusGeometry args={[0.62, 0.09, 10, 28]} /><meshStandardMaterial color="#fff4f8" roughness={0.6} /></mesh>
          <mesh position={[0, 0, -0.02]}><circleGeometry args={[0.58, 28]} /><meshStandardMaterial color="#aee3f5" emissive="#cdeffb" emissiveIntensity={0.25} /></mesh>
          <mesh position={[0.2, 0.18, 0.01]}><circleGeometry args={[0.14, 16]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.7} /></mesh>
        </group>
      ))}

      {/* ---- big wall branding (back wall, over the work wing) ---- */}
      <Text font={TOON_FONT} position={[-11, H * 0.72, -hd + 0.22]} fontSize={1.6} color="#ffd21e" anchorX="center" letterSpacing={0.06} outlineWidth={0.03} outlineColor="#000">6 EMPIRES</Text>
      <Text font={TOON_FONT} position={[-11, H * 0.44, -hd + 0.22]} fontSize={0.42} color="#fff" anchorX="center" letterSpacing={0.1} outlineWidth={0.012} outlineColor="#000">LIVING CORPORATION</Text>
      {/* ---- WALL GALLERY — MAGIC-MUSHROOM hanging pictures (varied sizes,
              click any to zoom in close) ---- */}
      {/* back wall: varied-size mushroom frames */}
      {[-19, -15.5, -7.5, -4, 14, 17.5, 21].map((gx, i) => {
        const sz = [1.0, 0.7, 1.3, 0.8, 1.1, 0.6, 0.9][i % 7];
        return <HangingFrame key={'bw' + gx} position={[gx, 2.2, -hd + 0.22]} accent={['#ff4d6d', '#c79be0', '#34f5a0', '#ff9bbf', '#6fb3ff', '#ffd21e', '#ff7a3d'][i % 7]} w={0.7 * sz} h={0.9 * sz} tilt={(i % 2 ? 1 : -1) * 0.05} onClick={() => onFocus([gx, -hd + 3.2], true)} />;
      })}
      {/* back wall: smaller upper row */}
      {[-21, -17, -6, 12, 16, 20].map((gx, i) => (
        <HangingFrame key={'bu' + gx} position={[gx, 3.6, -hd + 0.22]} accent={['#ff4d6d', '#34f5a0', '#6fb3ff', '#ffd21e', '#c79be0', '#ff9bbf'][i % 6]} w={0.55} h={0.66} tilt={(i % 2 ? -1 : 1) * 0.06} onClick={() => onFocus([gx, -hd + 3.2], true)} />
      ))}
      {/* left wall: varied-size mushroom frames, facing +X */}
      {[-11, -6, -1, 4, 9].map((gz, i) => {
        const sz = [1.2, 0.8, 1.0, 0.7, 1.1][i % 5];
        return <HangingFrame key={'lw' + gz} position={[-hw + 0.22, 2.7, gz]} accent={['#ff4d6d', '#34f5a0', '#ffd21e', '#ff9bbf', '#6fb3ff'][i % 5]} w={0.7 * sz} h={0.9 * sz} tilt={(i % 2 ? 1 : -1) * 0.05} face="x" onClick={() => onFocus([-hw + 3.2, gz], true)} />;
      })}
      {[-8.5, -3.5, 1.5, 6.5].map((gz, i) => (
        <HangingFrame key={'lu' + gz} position={[-hw + 0.22, 1.4, gz]} accent={['#6fb3ff', '#ffd21e', '#ff4d6d', '#34f5a0'][i % 4]} w={0.55} h={0.66} tilt={(i % 2 ? -1 : 1) * 0.05} face="x" onClick={() => onFocus([-hw + 3.2, gz], true)} />
      ))}

      {/* ---- BOSS executive suite (top-center) with the LIVE STARTUP STAND ---- */}
      <group position={[-2, 0, -hd + 3.0]}>
        <ZoneShell x={0} z={0} w={14} d={6} color="#8a6db0" label="EXECUTIVE COMMAND — CEO" />
        {/* the big live startup-status stand, set to the right, facing the room */}
        <StartupStand position={[4.0, 0, -1.0]} />
        {/* CEO desk + chair (left of the stand) */}
        <group position={[-3.4, 0, 0]}>
          <RoundedBox args={[4.6, 0.18, 1.7]} radius={0.06} position={[0, 0.82, -0.4]} castShadow receiveShadow><meshStandardMaterial color="#e9d8f0" roughness={0.5} /></RoundedBox>
          <mesh position={[-2.1, 0.36, -0.4]}><boxGeometry args={[0.18, 0.72, 1.5]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
          <mesh position={[2.1, 0.36, -0.4]}><boxGeometry args={[0.18, 0.72, 1.5]} /><meshStandardMaterial color="#d8c2e6" /></mesh>
          <Workstation position={[0, 0, -0.4]} color="#8a6db0" kind="ui" />
          <Chair position={[0, 0, 0.5]} rotation={[0, Math.PI, 0]} color="#b48fd0" />
          <Inspect id={boss.id} onPick={() => onAgent(boss, [-5.4, -12])}>
            <HumanCharacter live seated position={[0, 0.08, 0.42]} rotation={[0, Math.PI, 0]} suit="#8a6db0" hair="#141414" beard bowtie gesture="type" name="ROLAND" status="COMMANDING" scale={0.85} seed={9} />
          </Inspect>
          <WorkBubble position={[0.9, 2.0, 0.3]} text="Reviewing all ventures" accent="#ffd21e" seed={9} />
          <Pot big position={[-3.0, 0, 0.4]} />
        </group>
        <TrophyShelf position={[-6.6, 1.2, 0]} rotation={[0, Math.PI / 2, 0]} />
      </group>

      {/* ---- 11 staff OFFICE BAYS in the work wing (each its own cubicle) ---- */}
      {staff.map((m, i) => {
        const col = i < 6 ? 0 : 1;
        const rowi = i < 6 ? i : i - 6;
        const x = BX[col];
        const z = BZ0 + rowi * BZS;
        return <OfficeBay key={m.id} m={m} position={[x, 0, z]} onAgent={onAgent} />;
      })}

      {/* ---- THREE SUB-ROOMS on the right wing (spread down the deep floor) ---- */}
      <MeetingRoom x={14} z={-12} />
      <KitchenRoom x={14} z={0} />
      <LoungeRoom  x={14} z={12} />

      {/* ---- MEDIA WING — Music Studio + Video Production (fill the lower-centre) ---- */}
      <MusicStudio x={-1} z={16} onAgent={onAgent} />
      <VideoStudio x={8} z={16} onAgent={onAgent} />

      {/* ---- ROAMING AGENTS — stroll the central aisle / between rooms ---- */}
      <Walker m={staff[1]} speed={1.3} onAgent={onAgent} path={[[-2, -8], [3, -8], [4, 6], [-3, 7], [-3, -2]]} />
      <Walker m={staff[5]} speed={1.0} onAgent={onAgent} path={[[5, 8], [5, -6], [-4, -7], [-4, 8]]} />
      <Walker m={staff[9]} speed={1.5} onAgent={onAgent} path={[[0, 12], [6, 2], [0, -5], [-5, 2]]} />

      {/* ---- CENTRAL PLAZA (fills the open middle; gamified hub) ---- */}
      <group position={[3.5, 0, 2]}>
        {/* glowing logo medallion on the floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><circleGeometry args={[3.2, 48]} /><meshStandardMaterial color="#0e2230" emissive="#0e2230" emissiveIntensity={0.2} roughness={0.5} metalness={0.2} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[3.0, 3.2, 48]} /><meshBasicMaterial color="#ffd21e" /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[2.0, 2.12, 48]} /><meshBasicMaterial color="#06b6d4" /></mesh>
        <Text font={TOON_FONT} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} fontSize={0.95} color="#ffd21e" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">6</Text>
        {/* reception desk on the plaza */}
        <group position={[0, 0, 2.4]}>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[2.6, 1.1, 0.8]} /><meshStandardMaterial color="#e9d8f0" roughness={0.5} /></mesh>
          <mesh position={[0, 1.12, 0]}><boxGeometry args={[2.8, 0.06, 0.9]} /><meshStandardMaterial color="#caa44a" metalness={0.4} emissive="#caa44a" emissiveIntensity={0.15} /></mesh>
          <Text font={TOON_FONT} position={[0, 0.6, 0.42]} fontSize={0.2} color="#ffd21e" anchorX="center" outlineWidth={0.008} outlineColor="#000">RECEPTION</Text>
        </group>
        <Pot big position={[-2.7, 0, 0]} />
        <Pot big position={[2.7, 0, 0]} />
      </group>

      {/* central walkway plants + signage */}
      <Pot big position={[0, 0, -hd + 2]} />
      <Pot position={[-hw + 1.2, 0, hd - 1.4]} />

      {/* ---- REFERENCE-QUALITY DECOR (Simpsons living-room signature) ---- */}
      {/* wall sconces along the two tall walls */}
      {[-20, -12, -3, 5, 13, 21].map((sx) => <Sconce key={'sc' + sx} position={[sx, 3.7, -hd + 0.2]} />)}
      {[-12, -4, 4, 12].map((sz) => <Sconce key={'scl' + sz} position={[-hw + 0.2, 3.7, sz]} face="x" />)}
      {/* big curtained windows on the back wall (between galleries) */}
      <CurtainWindow position={[-11, 2.4, -hd + 0.25]} />
      <CurtainWindow position={[18, 2.4, -hd + 0.25]} />
      {/* a curtained window on the left wall too */}
      <CurtainWindow position={[-hw + 0.25, 2.4, 12]} face="x" />
      {/* tall yellow bookshelves in the corners */}
      <Bookshelf position={[hw - 0.9, 0, -hd + 1.2]} rotation={[0, -Math.PI / 2, 0]} />
      <Bookshelf position={[-hw + 0.9, 0, hd - 1.2]} rotation={[0, Math.PI / 2, 0]} />
      {/* a cozy living-room cluster in the open central-south area */}
      <group position={[0, 0, 11]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[6, 5]} /><meshStandardMaterial color="#bfeef0" roughness={0.95} /></mesh>
        <Sofa position={[0, 0, -1.6]} color="#7a5a48" />
        <Sofa position={[2.4, 0, 0]} rotation={[0, -Math.PI / 2, 0]} color="#5cc46a" />
        <mesh position={[0, 0.34, 0]}><boxGeometry args={[1.3, 0.16, 0.7]} /><meshStandardMaterial color="#a8806a" roughness={0.6} /></mesh>
        <TableLamp position={[-2.1, 0.6, -1.4]} shade="#ff6a8a" />
        <mesh position={[-2.1, 0.3, -1.4]}><boxGeometry args={[0.5, 0.6, 0.5]} /><meshStandardMaterial color="#b48fd0" /></mesh>
        <TableLamp position={[-1.4, 0.74, 1.4]} shade="#5cc46a" />
        <mesh position={[-1.4, 0.36, 1.4]}><boxGeometry args={[0.9, 0.12, 0.5]} /><meshStandardMaterial color="#7e63a0" /></mesh>
        <Pot big position={[3.0, 0, -2.2]} />
      </group>

      {/* soft fills */}
      <pointLight position={[-11, 7, 0]} color="#fff4f8" intensity={0.6} distance={44} />
      <pointLight position={[13, 7, 0]} color="#ffe1ee" intensity={0.5} distance={40} />
      <pointLight position={[0, 5, 11]} color="#ffe1ee" intensity={0.4} distance={26} />
    </group>
  );
}

export default function ConnectedWorld({ onAgent }: { onAgent?: (m: TeamMember) => void }) {
  const pick = onAgent ?? (() => {});
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(1);
  const [orbit, setOrbit] = useState(0);   // 360° rotation angle (radians)
  const adjustZoom = (d: number) => setZoom((z) => Math.min(1.6, Math.max(0.35, z + d)));
  const adjustOrbit = (d: number) => setOrbit((o) => o + d);   // full 360°, no clamp
  // click an agent → open profile AND fly the camera in on that agent (zoom in)
  const handleAgent = (m: TeamMember, pos: [number, number]) => { pick(m); setFocus(pos); setZoom(1); };
  // click a wall picture → fly the camera in close on it (tight zoom, no profile)
  const handleFocus = (pos: [number, number], tight?: boolean) => { setFocus(pos); setZoom(tight ? 0.45 : 1); };
  return (
    <Canvas dpr={[1, 1.25]} camera={{ position: [-1, 44, 40], fov: 36, near: 0.1, far: 320 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => { setFocus(null); setZoom(1); }}>
      {/* Arturitu pastel theme — bright teal backdrop, soft cheerful lighting */}
      <color attach="background" args={['#1fb8d8']} />
      <fog attach="fog" args={['#1fb8d8', 90, 200]} />
      <ambientLight intensity={1.15} color="#ffffff" />
      <directionalLight position={[18, 30, 14]} intensity={1.05} color="#fff4ea" />
      <hemisphereLight args={['#ffe0ec', '#1fb8d8', 0.7]} />
      {/* soft pastel ambient fills — static (no per-frame animation) */}
      <pointLight position={[0, 10, 0]} color="#fff4f8" intensity={0.7} distance={55} />
      <pointLight position={[14, 6, 14]} color="#ffe1ee" intensity={0.45} distance={30} />
      <pointLight position={[-14, 6, -14]} color="#bfeaf0" intensity={0.45} distance={30} />

      <Suspense fallback={null}>
        {/* === ONE SQUARE WORKSPACE (Arturitu doll-house): all 12 agent
              workstations visible at once inside a single open-top room === */}
        <OneRoom onAgent={handleAgent} onFocus={handleFocus} />
      </Suspense>
      <CamRig target={focus} zoom={zoom} orbit={orbit} />
      <CamControls onZoom={adjustZoom} onOrbit={adjustOrbit} />
    </Canvas>
  );
}
