import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { SiteLayout, PageHeader, meta } from "@/components/SiteLayout";
import { news, events } from "@/lib/school";

export const Route = createFileRoute("/news")({
  head: () => meta("News & Events", "Announcements, school news and upcoming events at His Grace Academy."),
  component: News,
});

function News() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="News & Events" title="What's happening" />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {news.map((n) => (
            <article key={n.title} className="rounded-2xl border bg-card p-6">
              <p className="text-xs font-bold text-muted-foreground">{n.date}</p>
              <h2 className="mt-1 text-xl font-extrabold">{n.title}</h2>
              <p className="mt-2 text-muted-foreground">{n.body}</p>
            </article>
          ))}
        </div>
        <aside>
          <h2 className="text-2xl font-extrabold">Events</h2>
          <ul className="mt-4 space-y-3">
            {events.map((e) => (
              <li key={e.title} className="flex gap-3 rounded-xl bg-secondary p-4 text-secondary-foreground">
                <CalendarDays /><div><p className="font-bold">{e.title}</p><p className="text-sm">{e.date} · {e.place}</p></div>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </SiteLayout>
  );
}
