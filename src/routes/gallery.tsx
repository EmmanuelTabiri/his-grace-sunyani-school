import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader, meta } from "@/components/SiteLayout";
import classroom from "@/assets/classroom.jpg";
import sports from "@/assets/sports.jpg";
import science from "@/assets/science.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => meta("Gallery", "Photos of school life at His Grace Academy — classrooms, science, sports and more."),
  component: Gallery,
});

const photos = [
  { src: classroom, cat: "Classroom", cap: "Social Studies lesson", alt: "Pupils raising their hands while a teacher stands at the whiteboard" },
  { src: science, cat: "Science", cap: "JHS chemistry practical", alt: "Students examining coloured liquids in test tubes beside a microscope" },
  { src: sports, cat: "Sports", cap: "Inter-house football", alt: "Pupils in blue and yellow jerseys chasing a football at sunset" },
];

function Gallery() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Gallery" title="Life at His Grace" />
      <section className="container-page grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p) => (
          <figure key={p.cap} className="overflow-hidden rounded-2xl border bg-card">
            <img src={p.src} alt={p.alt} loading="lazy" width={1200} height={912} className="aspect-[4/3] w-full object-cover" />
            <figcaption className="p-4"><span className="eyebrow">{p.cat}</span><p className="font-bold">{p.cap}</p></figcaption>
          </figure>
        ))}
      </section>
    </SiteLayout>
  );
}
