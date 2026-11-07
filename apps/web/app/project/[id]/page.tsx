import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PROJECTS, projectById } from "@/lib/demo";
import ProjectView from "./ProjectView";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata(props: PageProps<"/project/[id]">) {
  const { id } = await props.params;
  return { title: `${projectById(id)?.name ?? "Project"} · OwnTheBlock` };
}

// Reading the URL inside Suspense lets the page shell show instantly while params resolve.
export default function ProjectPage(props: PageProps<"/project/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-64 max-w-md animate-pulse bg-line" aria-busy="true" />}>
      <Project params={props.params} />
    </Suspense>
  );
}

async function Project({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!projectById(id)) notFound();
  return <ProjectView id={id} />;
}
