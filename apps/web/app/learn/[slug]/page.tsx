import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LESSONS, lessonBySlug } from "@/lib/lessons";
import LessonPlayer from "./LessonPlayer";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export default function LessonPage(props: PageProps<"/learn/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-64 max-w-md" aria-busy="true" />}>
      <Lesson params={props.params} />
    </Suspense>
  );
}

async function Lesson({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!lessonBySlug(slug)) notFound();
  return <LessonPlayer slug={slug} />;
}
