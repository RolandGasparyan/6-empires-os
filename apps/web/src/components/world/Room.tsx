'use client';
/**
 * Isometric cutaway room shell — two back walls + marble floor, optional gold
 * trim, window mullions, and a department label on the back wall.
 * Matches the reference dollhouse architecture, recolored warm-luxury.
 */
import { ReactNode } from 'react';
import { Text } from '@react-three/drei';
import { PALETTE } from './Furniture';

interface RoomProps {
  position?: [number, number, number];
  size?: [number, number]; // width (x), depth (z)
  height?: number;
  label?: string;
  accent?: string;
  windows?: boolean;
  children?: ReactNode;
}

export function Room({ position = [0, 0, 0], size = [8, 8], height = 4, label, accent = PALETTE.gold, windows, children }: RoomProps) {
  const [w, d] = size;
  return (
    <group position={position}>
      {/* marble floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={PALETTE.marble} roughness={0.35} metalness={0.2} />
      </mesh>
      {/* faint gold floor inlay (empire ring) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(w, d) * 0.18, Math.min(w, d) * 0.2, 48]} />
        <meshStandardMaterial color={accent} metalness={0.8} roughness={0.3} transparent opacity={0.5} />
      </mesh>

      {/* back wall (−z) */}
      <mesh position={[0, height / 2, -d / 2]} receiveShadow>
        <boxGeometry args={[w, height, 0.18]} />
        <meshStandardMaterial color={PALETTE.marbleLight} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* left wall (−x) */}
      <mesh position={[-w / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[0.18, height, d]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.75} />
      </mesh>
      {/* gold baseboard trim */}
      <mesh position={[0, 0.08, -d / 2 + 0.1]}><boxGeometry args={[w, 0.08, 0.04]} /><meshStandardMaterial color={accent} metalness={0.9} roughness={0.3} /></mesh>
      <mesh position={[-w / 2 + 0.1, 0.08, 0]}><boxGeometry args={[0.04, 0.08, d]} /><meshStandardMaterial color={accent} metalness={0.9} roughness={0.3} /></mesh>

      {/* window mullions on back wall */}
      {windows && (
        <group position={[w * 0.28, height * 0.62, -d / 2 + 0.12]}>
          <mesh><boxGeometry args={[w * 0.36, height * 0.4, 0.06]} /><meshStandardMaterial color="#0c1722" emissive="#23405e" emissiveIntensity={0.4} metalness={0.3} roughness={0.2} /></mesh>
          {[-0.9, -0.3, 0.3, 0.9].map((x, i) => <mesh key={i} position={[x * w * 0.14, 0, 0.04]}><boxGeometry args={[0.04, height * 0.4, 0.04]} /><meshStandardMaterial color={accent} metalness={0.8} roughness={0.3} /></mesh>)}
          {[-0.5, 0.5].map((y, i) => <mesh key={i} position={[0, y * height * 0.18, 0.04]}><boxGeometry args={[w * 0.36, 0.04, 0.04]} /><meshStandardMaterial color={accent} metalness={0.8} roughness={0.3} /></mesh>)}
        </group>
      )}

      {/* department label on back wall */}
      {label && (
        <Text position={[0, height * 0.82, -d / 2 + 0.15]} fontSize={0.42} color={accent} anchorX="center" letterSpacing={0.18} outlineWidth={0.005} outlineColor="#000">
          {label}
        </Text>
      )}

      {children}
    </group>
  );
}

/** Mezzanine platform + staircase + gold railing (from the reference's upper level). */
export function Mezzanine({ position = [0, 0, 0], width = 4, depth = 3, h = 1.8, accent = PALETTE.gold }: { position?: [number, number, number]; width?: number; depth?: number; h?: number; accent?: string }) {
  return (
    <group position={position}>
      {/* platform */}
      <mesh position={[0, h, 0]} castShadow receiveShadow><boxGeometry args={[width, 0.18, depth]} /><meshStandardMaterial color={PALETTE.woodLight} roughness={0.6} /></mesh>
      <mesh position={[0, h + 0.1, 0]}><boxGeometry args={[width + 0.02, 0.02, depth + 0.02]} /><meshStandardMaterial color={accent} metalness={0.8} roughness={0.3} /></mesh>
      {/* supports */}
      {[[-width / 2 + 0.2, -depth / 2 + 0.2], [width / 2 - 0.2, -depth / 2 + 0.2], [-width / 2 + 0.2, depth / 2 - 0.2], [width / 2 - 0.2, depth / 2 - 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, h / 2, z]}><boxGeometry args={[0.12, h, 0.12]} /><meshStandardMaterial color={PALETTE.charcoal} /></mesh>
      ))}
      {/* gold railing along front edge */}
      <mesh position={[0, h + 0.5, depth / 2]}><boxGeometry args={[width, 0.04, 0.04]} /><meshStandardMaterial color={accent} metalness={0.9} roughness={0.25} /></mesh>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[-width / 2 + (i * width) / 6, h + 0.28, depth / 2]}><cylinderGeometry args={[0.015, 0.015, 0.5, 6]} /><meshStandardMaterial color={accent} metalness={0.9} roughness={0.25} /></mesh>
      ))}
      {/* staircase down */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[width / 2 + 0.3 + i * 0.3, h - 0.18 - i * (h / 6), depth / 2 - 0.5]} castShadow>
          <boxGeometry args={[0.3, 0.12, 1.0]} /><meshStandardMaterial color={PALETTE.woodLight} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
