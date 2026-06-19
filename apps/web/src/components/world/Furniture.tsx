'use client';
/**
 * Low-poly furniture set for the isometric 6 EMPIRES corporation world.
 * Style-matched to the reference dollhouse render, recolored warm-luxury:
 * black-marble base + warm wood + gold accents + orange/yellow fabric pops.
 * All pieces are primitive-built (no external assets) for real-time R3F.
 */
import { ReactNode } from 'react';

export const PALETTE = {
  marble: '#15161a',
  marbleLight: '#22242b',
  wood: '#6b4a2b',
  woodLight: '#8a6740',
  gold: '#d4af37',
  goldDeep: '#9a7b2e',
  orange: '#e8772e',
  yellow: '#e8c33a',
  cream: '#d8cfc0',
  sage: '#7e8a6b',
  plant: '#3f6b46',
  plantDark: '#2c5234',
  charcoal: '#2a2c33',
  glass: '#9fb6c9',
};

type V3 = [number, number, number];
interface P { position?: V3; rotation?: V3; scale?: V3 | number; children?: ReactNode }

const Group = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, children }: P) => (
  <group position={position} rotation={rotation} scale={scale}>{children}</group>
);

// soft matte material helper via inline props
function box(args: V3, color: string, pos: V3, opts: { rough?: number; metal?: number } = {}) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={opts.rough ?? 0.85} metalness={opts.metal ?? 0.05} />
    </mesh>
  );
}

/* ---- SOFA (L-shaped sectional, orange/cream) ---- */
export function Sofa({ color = PALETTE.orange, ...p }: P & { color?: string }) {
  return (
    <Group {...p}>
      {box([2.2, 0.35, 0.9], color, [0, 0.32, 0])}
      {box([2.2, 0.45, 0.25], color, [0, 0.6, -0.32])}
      {box([0.25, 0.45, 0.9], color, [-0.98, 0.55, 0])}
      {box([0.25, 0.45, 0.9], color, [0.98, 0.55, 0])}
      {/* seat cushions */}
      {box([1.0, 0.18, 0.8], color, [-0.5, 0.5, 0.02], { rough: 0.95 })}
      {box([1.0, 0.18, 0.8], color, [0.5, 0.5, 0.02], { rough: 0.95 })}
      {/* legs */}
      {([[-1, -0.35], [1, -0.35], [-1, 0.35], [1, 0.35]] as [number, number][]).map(([x, z], i) => (
        <group key={i}>{box([0.08, 0.18, 0.08], PALETTE.wood, [x, 0.09, z], { rough: 0.6 })}</group>
      ))}
    </Group>
  );
}

/* ---- LOUNGE CHAIR ---- */
export function Chair({ color = PALETTE.yellow, ...p }: P & { color?: string }) {
  return (
    <Group {...p}>
      {box([0.8, 0.3, 0.8], color, [0, 0.35, 0])}
      {box([0.8, 0.5, 0.18], color, [0, 0.6, -0.32])}
      {box([0.16, 0.4, 0.8], color, [-0.32, 0.55, 0])}
      {box([0.16, 0.4, 0.8], color, [0.32, 0.55, 0])}
      {[[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]].map(([x, z], i) => <group key={i}>{box([0.06, 0.2, 0.06], PALETTE.charcoal, [x, 0.1, z])}</group>)}
    </Group>
  );
}

/* ---- BEANBAG (rounded, cream) ---- */
export function Beanbag({ color = PALETTE.cream, ...p }: P & { color?: string }) {
  return (
    <Group {...p}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.6, 0.25, 18]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </Group>
  );
}

/* ---- DESK with monitors ---- */
export function Desk({ accent = PALETTE.gold, ...p }: P & { accent?: string }) {
  return (
    <Group {...p}>
      {box([1.6, 0.08, 0.8], PALETTE.marbleLight, [0, 0.74, 0], { rough: 0.5 })}
      {box([0.08, 0.74, 0.7], PALETTE.charcoal, [-0.74, 0.37, 0])}
      {box([0.08, 0.74, 0.7], PALETTE.charcoal, [0.74, 0.37, 0])}
      {/* monitor */}
      <mesh position={[0, 1.05, -0.25]} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.04]} />
        <meshStandardMaterial color="#0a0f0c" emissive={accent} emissiveIntensity={0.25} roughness={0.3} />
      </mesh>
      {box([0.1, 0.18, 0.1], PALETTE.charcoal, [0, 0.86, -0.25])}
      {/* gold edge trim */}
      {box([1.62, 0.02, 0.82], accent, [0, 0.70, 0], { metal: 0.9, rough: 0.3 })}
    </Group>
  );
}

/* ---- ISLAND COUNTER + stools (center bar) ---- */
export function IslandCounter(p: P) {
  return (
    <Group {...p}>
      {box([2.6, 0.12, 1.0], PALETTE.charcoal, [0, 1.0, 0], { rough: 0.4 })}
      {box([2.5, 0.9, 0.9], PALETTE.marble, [0, 0.5, 0])}
      {box([2.62, 0.04, 1.02], PALETTE.gold, [0, 0.94, 0], { metal: 0.9, rough: 0.25 })}
      {[-0.9, 0, 0.9].map((x, i) => (
        <group key={i} position={[x, 0, 0.85]}>
          <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.18, 0.18, 0.08, 16]} /><meshStandardMaterial color={PALETTE.orange} roughness={0.9} /></mesh>
          <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.04, 0.04, 0.6, 10]} /><meshStandardMaterial color={PALETTE.gold} metalness={0.8} roughness={0.3} /></mesh>
        </group>
      ))}
    </Group>
  );
}

/* ---- COFFEE TABLE ---- */
export function CoffeeTable(p: P) {
  return (
    <Group {...p}>
      {box([1.1, 0.06, 0.7], PALETTE.woodLight, [0, 0.32, 0], { rough: 0.6 })}
      {box([1.0, 0.04, 0.6], PALETTE.gold, [0, 0.29, 0], { metal: 0.85, rough: 0.3 })}
      {[[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].map(([x, z], i) => <group key={i}>{box([0.06, 0.3, 0.06], PALETTE.charcoal, [x, 0.15, z])}</group>)}
    </Group>
  );
}

/* ---- PLANTER with foliage ---- */
export function Planter({ tall = false, ...p }: P & { tall?: boolean }) {
  const h = tall ? 1.4 : 0.7;
  return (
    <Group {...p}>
      <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.22, 0.28, 0.4, 12]} /><meshStandardMaterial color={PALETTE.marbleLight} roughness={0.7} /></mesh>
      {box([0.46, 0.05, 0.46], PALETTE.gold, [0, 0.4, 0], { metal: 0.8, rough: 0.3 })}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.5) * 0.12, 0.5 + h * 0.5, Math.sin(i * 1.5) * 0.12]} rotation={[Math.cos(i) * 0.3, i, Math.sin(i) * 0.3]} castShadow>
          <coneGeometry args={[0.16, h, 6]} />
          <meshStandardMaterial color={i % 2 ? PALETTE.plant : PALETTE.plantDark} roughness={1} />
        </mesh>
      ))}
    </Group>
  );
}

/* ---- RUG ---- */
export function Rug({ color = PALETTE.sage, size = [2.4, 1.6] as [number, number], ...p }: P & { color?: string; size?: [number, number] }) {
  return (
    <Group {...p}>
      <mesh position={[0, 0.015, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(...size) * 0.32, Math.min(...size) * 0.36, 32]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={0.6} roughness={0.4} />
      </mesh>
    </Group>
  );
}

/* ---- WALL ART (framed gold) ---- */
export function WallArt({ ...p }: P) {
  return (
    <Group {...p}>
      {box([0.9, 1.2, 0.05], PALETTE.goldDeep, [0, 0, 0], { metal: 0.7, rough: 0.4 })}
      {box([0.78, 1.08, 0.06], PALETTE.marble, [0, 0, 0.01])}
      <mesh position={[0, 0, 0.04]}><planeGeometry args={[0.66, 0.96]} /><meshStandardMaterial color={PALETTE.sage} roughness={1} /></mesh>
    </Group>
  );
}
