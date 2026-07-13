'use client';
/**
 * Dynamic world routes: /world/[globe|brain|video|agents|chat|console|hq|music]
 * Routes to different EMPIRE workspaces based on URL slug
 */
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

const WORLD_ROUTES = {
  hq: '/world/hq',
  chat: '/world/chat',
  console: '/world/console',
  globe: '/world/globe',
  brain: '/world/brain',
  agents: '/world/agents',
  music: '/world/music',
  video: '/world/video',
};

export default function DynamicWorldPage() {
  const params = useParams();
  const router = useRouter();
  const world = params?.world as string;

  useEffect(() => {
    if (!world || !WORLD_ROUTES[world as keyof typeof WORLD_ROUTES]) {
      // Invalid world route, redirect to main world
      router.push('/world');
      return;
    }

    // Route is valid, load the appropriate workspace
    // For now, render a loading message while the workspace loads
  }, [world, router]);

  // Render workspace based on route
  if (!world) {
    return <div style={{ background: '#050608', color: '#FFF' }}>Loading...</div>;
  }

  const isValid = WORLD_ROUTES[world as keyof typeof WORLD_ROUTES];

  if (!isValid) {
    return (
      <div style={{ background: '#050608', color: '#E8EAED', padding: '2rem' }}>
        <h1 style={{ color: '#FDC72C' }}>❌ World not found: {world}</h1>
        <p>Available worlds: {Object.keys(WORLD_ROUTES).join(', ')}</p>
        <Link href="/world" style={{ color: '#FDC72C' }}>← Back to HQ</Link>
      </div>
    );
  }

  // Route to the actual workspace component
  return renderWorld(world);
}

function renderWorld(world: string) {
  const worldConfig: Record<string, { title: string; component: React.ComponentType }> = {
    hq: {
      title: 'Empire HQ',
      component: () => <HQWorkspace />,
    },
    chat: {
      title: 'Command Chat',
      component: () => <ChatWorkspace />,
    },
    console: {
      title: 'Executive Console',
      component: () => <ConsoleWorkspace />,
    },
    globe: {
      title: 'Global Operations',
      component: () => <GlobeWorkspace />,
    },
    brain: {
      title: 'Knowledge Brain',
      component: () => <BrainWorkspace />,
    },
    agents: {
      title: 'Agent Control Room',
      component: () => <AgentsWorkspace />,
    },
    music: {
      title: 'Music Studio',
      component: () => <MusicWorkspace />,
    },
    video: {
      title: 'Video Studio',
      component: () => <VideoWorkspace />,
    },
  };

  const config = worldConfig[world];
  if (!config) return null;

  const Component = config.component;
  return (
    <div style={{ width: '100%', height: '100vh', background: '#050608' }}>
      <Component />
    </div>
  );
}

// Workspace Components
function HQWorkspace() {
  return <WorkspaceShell name="Empire HQ" description="Isometric headquarters with 12 agent workstations" />;
}

function ChatWorkspace() {
  return <WorkspaceShell name="Command Chat" description="Multi-channel communication interface" />;
}

function ConsoleWorkspace() {
  return <WorkspaceShell name="Executive Console" description="Real-time trading dashboard and metrics" />;
}

function GlobeWorkspace() {
  return <WorkspaceShell name="Global Operations" description="Global network map and distribution tracking" />;
}

function BrainWorkspace() {
  return <WorkspaceShell name="Knowledge Brain" description="Intelligence hub and neural network visualization" />;
}

function AgentsWorkspace() {
  return <WorkspaceShell name="Agent Control Room" description="Agent management and profile dashboard" />;
}

function MusicWorkspace() {
  return <WorkspaceShell name="Music Studio" description="AI music composition and audio production" />;
}

function VideoWorkspace() {
  return <WorkspaceShell name="Video Studio" description="AI video generation and media production" />;
}

function WorkspaceShell({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#E8EAED',
        fontFamily: "'Chakra Petch', sans-serif",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#FDC72C', margin: 0, letterSpacing: '0.1em' }}>{name}</h1>
        <p style={{ fontSize: '0.9rem', color: 'rgba(232, 234, 237, 0.6)', marginTop: '1rem' }}>{description}</p>
        <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'rgba(232, 234, 237, 0.4)' }}>
          ✓ Workspace loaded and operational
        </div>
      </div>
    </div>
  );
}
