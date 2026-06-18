'use client';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { Stage } from '@/components/three/Stage';
import { GoldParticles } from '@/components/three/GoldParticles';
import { HoloPanel } from '@/components/three/HoloPanel';
import { HoloRing } from '@/components/three/HoloRing';
import { PointerRig } from '@/components/three/Rig';
import { PALETTE } from '@/lib/tokens';
import { useEmpireData } from '@/data/useEmpireData';

export function CommandScene() {
  const { stats, knowledge } = useEmpireData();
  return (
    <Stage camera={{ position: [0, 1.4, 9], fov: 44 }} bloom={1.2}>
      <PointerRig strength={0.5} />
      <GoldParticles count={1600} radius={16} />

      {/* Core obsidian sphere — the Empire's heart */}
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh position={[0, 0.4, 0]}>
          <icosahedronGeometry args={[1.5, 12]} />
          <MeshDistortMaterial color={PALETTE.obsidian2} emissive={PALETTE.gold} emissiveIntensity={0.18}
            metalness={0.9} roughness={0.15} distort={0.28} speed={1.6} />
        </mesh>
      </Float>
      <HoloRing radius={2.6} opacity={0.45} speed={0.18} />
      <HoloRing radius={3.2} opacity={0.28} speed={-0.12} color={PALETTE.cyan} rotation={[Math.PI/2.4, 0.3, 0]} />
      <HoloRing radius={4.0} opacity={0.18} speed={0.08} rotation={[Math.PI/1.8, -0.2, 0]} />

      {/* Floating data panels in 3D space */}
      <HoloPanel position={[-4.4, 1.6, -1]} rotation={[0, 0.5, 0]} label="Active Agents" value={String(stats.agents_active)} floatSeed={0} />
      <HoloPanel position={[4.4, 1.9, -1]} rotation={[0, -0.5, 0]} label="System Health" value={`${stats.health}%`} accent={PALETTE.success} floatSeed={2} />
      <HoloPanel position={[-4.6, -1.4, -0.5]} rotation={[0, 0.5, 0]} label="Trades Today" value={String(stats.trades_today)} accent={PALETTE.cyan} floatSeed={4} />
      <HoloPanel position={[4.6, -1.2, -0.5]} rotation={[0, -0.5, 0]} label="Knowledge Nodes" value={String(knowledge.entities)} floatSeed={6} />
    </Stage>
  );
}

export default CommandScene;
