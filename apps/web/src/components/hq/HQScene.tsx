'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { AdaptiveDpr } from '@react-three/drei';
import { HQEnvironment } from './HQEnvironment';
import { BossThrone } from './BossThrone';
import { AgentPod } from './AgentPod';
import { CameraRig, CamTarget } from './CameraRig';
import { HQAgent } from '@/data/hqAgents';

export default function HQScene({
  agents, selected, onSelect, camTarget, autoSpin,
}: {
  agents: HQAgent[];
  selected: number;
  onSelect: (i: number) => void;
  camTarget: CamTarget | null;
  autoSpin: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 4, 14], fov: 48, near: 0.1, far: 300 }}
    >
      <color attach="background" args={['#070504']} />
      <fogExp2 attach="fog" args={['#070504', 0.02]} />
      <Suspense fallback={null}>
        <HQEnvironment />
        <BossThrone />
        {agents.map((a, i) => (
          <AgentPod key={a.key} agent={a} selected={i === selected} onSelect={() => onSelect(i)} />
        ))}
      </Suspense>
      <CameraRig target={camTarget} autoSpin={autoSpin} />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
