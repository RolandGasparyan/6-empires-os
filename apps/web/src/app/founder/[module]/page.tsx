import ModuleClient from './ModuleClient';

// Server component. Next.js 15 types `params` as a Promise; await it here
// (works on React 18) and pass the resolved slug to the client component.
export default async function FounderModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  return <ModuleClient module={module} />;
}
