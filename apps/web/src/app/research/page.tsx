'use client';
import { clientScene } from '@/components/three/SceneLoader';
import { DeptPage } from '@/components/executive/DeptPage';
import { DEPARTMENTS } from '@/components/executive/departments';

const Scene = clientScene(() => import('@/components/executive/ResearchScene'));
export default function ResearchPage() {
  return <DeptPage cfg={DEPARTMENTS.research} Scene={Scene} />;
}
