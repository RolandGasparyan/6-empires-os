'use client';
/**
 * STEP 2 MVP — Central HQ Command Room with 3 named agents fully working.
 * CEO Aram (throne), COO Lilit + CTO Vahan at workstations. Each has their
 * identity color, working gesture, live status, and a click → profile card.
 * Premium room: marble + gold, reflective floor, animated screens, particles.
 */
import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { Environment, ContactShadows, Float, Text, RoundedBox, MeshReflectorMaterial } from '@react-three/drei';
import { Character } from './Character';
import { Screen, Hologram, Particles, ProjectBoard, Plant, Rig, Inspect, BASE } from './roomKit';
import { byId, TeamMember } from './team';

const CEO = byId('ceo')!, COO = byId('coo')!, CTO = byId('cto')!;

function Workstation({ member, position, rotation, onPick }: { member: TeamMember; position: [number, number, number]; rotation: [number, number, number]; onPick: (m: TeamMember) => void }) {
  return (
    <group position={position} rotation={rotation}>
      {/* desk */}
      <RoundedBox args={[1.8, 0.12, 0.9]} radius={0.04} position={[0, 0.74, -0.5]} castShadow receiveShadow><meshStandardMaterial color={BASE.marbleHi} metalness={0.4} roughness={0.35} /></RoundedBox>
      <mesh position={[0, 0.68, -0.5]}><boxGeometry args={[1.82, 0.03, 0.92]} /><meshStandardMaterial color={member.color} metalness={0.6} roughness={0.35} emissive={member.color} emissiveIntensity={0.25} /></mesh>
      <mesh position={[-0.82, 0.37, -0.5]}><boxGeometry args={[0.08, 0.74, 0.7]} /><meshStandardMaterial color={BASE.charcoal} /></mesh>
      <mesh position={[0.82, 0.37, -0.5]}><boxGeometry args={[0.08, 0.74, 0.7]} /><meshStandardMaterial color={BASE.charcoal} /></mesh>
      {/* monitor */}
      <Screen position={[0, 1.15, -0.78]} w={1.0} h={0.55} accent={member.color} kind="code" />
      {/* the named character */}
      <Inspect id={member.id} onPick={() => onPick(member)}>
        <Character position={[0, 0, 0.2]} color={member.color} accent={BASE.goldHi} gesture={member.gesture} name={member.name.split(' ')[0].toUpperCase()} status={member.status} seed={member.id.charCodeAt(0)} />
      </Inspect>
    </group>
  );
}

export default function CommandRoomScene({ onPick }: { onPick?: (m: TeamMember) => void }) {
  const pick = onPick ?? (() => {});
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [8, 5.5, 8], fov: 36, near: 0.1, far: 120 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#050507']} />
      <fog attach="fog" args={['#050507', 16, 42]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[6, 12, 6]} intensity={1.0} color="#fff3d8" castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-14, 14, 14, -14, 0.1, 44]} />
      </directionalLight>
      <pointLight position={[0, 4.5, 0]} intensity={0.7} color={BASE.gold} distance={20} />
      <pointLight position={[-5, 2, 3]} intensity={0.4} color={CTO.color} distance={12} />
      <pointLight position={[5, 2, 3]} intensity={0.4} color={COO.color} distance={12} />
      <spotLight position={[0, 6.5, -2]} angle={0.5} penumbra={0.8} intensity={1.3} color={BASE.goldHi} target-position={[0, 0, -1.6]} castShadow />

      <Suspense fallback={null}>
        {/* reflective floor + gold ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[26, 26]} />
          <MeshReflectorMaterial mirror={0.42} resolution={1024} mixBlur={8} mixStrength={1.1} blur={[300, 100]} roughness={0.6} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.2} color={BASE.marble} metalness={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[3.2, 3.4, 64]} /><meshStandardMaterial color={BASE.gold} metalness={0.9} roughness={0.25} emissive={BASE.gold} emissiveIntensity={0.2} /></mesh>

        {/* back wall + emblem */}
        <mesh position={[0, 3.2, -6.5]} receiveShadow><boxGeometry args={[18, 6.4, 0.2]} /><meshStandardMaterial color={BASE.marbleHi} roughness={0.6} metalness={0.15} /></mesh>
        <Inspect id="logo" onPick={() => pick({ ...CEO, id: 'logo', name: '6 EMPIRES', title: 'CORPORATION', tagline: 'ONE VISION · ONE SYSTEM · ONE EMPIRE', blurb: 'We build systems. We create value. We scale empires.', status: 'LIVE' })}>
          <Float speed={1.4} floatIntensity={0.3} rotationIntensity={0.1}>
            <group position={[0, 4.0, -6.3]}>
              {[0, 1, 2, 3].map((i) => <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}><torusGeometry args={[0.55, 0.1, 10, 28, Math.PI * 1.3]} /><meshStandardMaterial color={BASE.gold} metalness={0.95} roughness={0.18} emissive={BASE.gold} emissiveIntensity={0.35} /></mesh>)}
              <mesh><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color={BASE.goldHi} emissive={BASE.goldHi} emissiveIntensity={1.2} /></mesh>
            </group>
          </Float>
          <Text position={[0, 2.7, -6.25]} fontSize={0.5} color={BASE.gold} anchorX="center" letterSpacing={0.3}>6 EMPIRES</Text>
          <Text position={[0, 2.25, -6.25]} fontSize={0.14} color={BASE.white} anchorX="center" letterSpacing={0.3}>CENTRAL COMMAND</Text>
        </Inspect>

        {/* city windows */}
        <mesh position={[5.5, 3.6, -6.38]}><planeGeometry args={[5, 3]} /><meshStandardMaterial color="#0c1722" emissive="#26415e" emissiveIntensity={0.5} /></mesh>
        <mesh position={[-5.5, 3.6, -6.38]}><planeGeometry args={[5, 3]} /><meshStandardMaterial color="#0c1722" emissive="#26415e" emissiveIntensity={0.5} /></mesh>

        {/* CEO throne desk (center back) */}
        <Inspect id="ceo" onPick={() => pick(CEO)}>
          <RoundedBox args={[3.0, 0.16, 1.2]} radius={0.06} position={[0, 0.8, -2.0]} castShadow receiveShadow><meshStandardMaterial color={BASE.marble} metalness={0.4} roughness={0.3} /></RoundedBox>
          <mesh position={[0, 0.71, -2.0]}><boxGeometry args={[3.04, 0.04, 1.24]} /><meshStandardMaterial color={CEO.color} metalness={0.7} roughness={0.3} emissive={CEO.color} emissiveIntensity={0.2} /></mesh>
          <Character position={[0, 0, -1.3]} color={CEO.color} accent={BASE.goldHi} gesture={CEO.gesture} name={CEO.name.split(' ')[0].toUpperCase()} status={CEO.status} scale={1.1} seed={9} />
          <Screen position={[-0.9, 1.45, -2.3]} rotation={[0, 0.4, 0]} w={0.9} h={0.55} accent={BASE.green} kind="chart" />
          <Screen position={[0.9, 1.45, -2.3]} rotation={[0, -0.4, 0]} w={0.9} h={0.55} accent={BASE.gold} kind="bars" />
        </Inspect>

        {/* COO + CTO workstations flanking */}
        <Workstation member={COO} position={[-3.6, 0, 1.2]} rotation={[0, 0.6, 0]} onPick={pick} />
        <Workstation member={CTO} position={[3.6, 0, 1.2]} rotation={[0, -0.6, 0]} onPick={pick} />

        {/* world hologram center */}
        <Inspect id="holo" onPick={() => pick({ ...CEO, id: 'holo', name: 'GLOBAL OPS', title: 'LIVE HOLOGRAM', tagline: 'Empire reach across markets', blurb: '14 active regions · Crypto · FX · Equities', status: 'STREAMING' })}>
          <Hologram position={[0, 0.05, 1.6]} primary={BASE.blue} secondary={BASE.green} />
        </Inspect>

        {/* project board */}
        <ProjectBoard position={[-6.0, 2.4, -1.5]} primary={BASE.gold} secondary={BASE.blue} onPick={(id) => pick({ ...CEO, id, name: 'PROJECT BOARD', title: 'ACTIVE INITIATIVES', tagline: 'Scheduled · Active · Done', blurb: 'The empire’s live work pipeline.', status: '9 ITEMS' })} />

        <Plant position={[-4.2, 0, 3.4]} /><Plant position={[4.4, 0, 3.4]} />
        <Particles color={BASE.gold} />
        <ContactShadows position={[0, 0.005, 0]} opacity={0.55} scale={28} blur={2.4} far={9} />
        <Environment preset="night" />
      </Suspense>
      <Rig />
    </Canvas>
  );
}
