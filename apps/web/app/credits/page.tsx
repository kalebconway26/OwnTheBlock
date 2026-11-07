import { Card, PageHeader } from "@/components/ui";
import Photo from "@/components/Photo";
import { PHOTO_CREDITS } from "@/lib/photos";

export const metadata = { title: "Photo credits · OwnTheBlock" };

export default function CreditsPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-12">
      <PageHeader title="Photo credits" subtitle="Openly licensed photos used as stand-ins for fictional demo projects." back="/me" />
      <div className="space-y-2 px-4">
        {Object.entries(PHOTO_CREDITS).map(([key, c]) => (
          <Card key={key} className="flex gap-3 p-3">
            <Photo id={key} alt={c.title} className="size-16 shrink-0 rounded-xl" sizes="64px" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold leading-snug">{c.title}</p>
              <p className="text-muted">
                by {c.creator} · {c.license}
              </p>
              <a href={c.source} className="break-all text-green underline" rel="noopener noreferrer" target="_blank">
                Source
              </a>
            </div>
          </Card>
        ))}
        <p className="text-xs text-muted">Found through Openverse. None of these photos show the fictional properties named in the app, and none imply endorsement.</p>
      </div>
    </div>
  );
}
