import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PROJECTS, projectById } from "@/lib/demo";
import InvestFlow from "./InvestFlow";

export function generateStaticParams() {
  // Every project: raises open and close as the demo clock moves.
  return PROJECTS.map((p) => ({ id: p.id }));
}

export default function InvestPage(props: PageProps<"/project/[id]/invest">) {
  return (
    <Suspense fallback={<div className="mx-auto h-64 max-w-md" aria-busy="true" />}>
      <Invest params={props.params} />
    </Suspense>
  );
}

async function Invest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!projectById(id)) notFound();
  return <InvestFlow id={id} />;
}
