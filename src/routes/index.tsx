import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Users, Trophy, Laptop, CalendarDays, ArrowRight } from "lucide-react";
import { SiteLayout, meta } from "@/components/SiteLayout";
import { school, news, events } from "@/lib/school";
import hero from "@/assets/classroom.jpg";
import sports from "@/assets/sports.jpg";

export const Route = createFileRoute("/")({
  head: () => meta("Welcome", "His Grace Academy in Penkwase, Sunyani — nurturing young minds with grace, knowledge and excellence."),
  component: Home,
});

const highlights = [
  { icon: BookOpen, t: "Strong academics", d: "GES curriculum taught by dedicated, qualified teachers." },
  { icon: Users, t: "Small classes", d: "Personal attention for every child." },
  { icon: Laptop, t: "ICT & science", d: "Modern computer lab and hands-on science." },
  { icon: Trophy, t: "Sports & arts", d: "Football, athletics, music and cultural dance." },
];

function Home() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Crest className="h-20 w-20" />
            <span className="eyebrow mt-5 block !text-secondary">Penkwase · Sunyani</span>
            <h1 className="mt-3 text-5xl font-extrabold leading-tight md:text-6xl">
              Where every child <span className="text-secondary">shines</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg opacity-85">
              Welcome to {school.name}. We nurture curious, confident and caring learners rooted in faith and excellence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/admissions" className="btn-sun">Apply for admission <ArrowRight size={18} /></Link>
              <Link to="/contact" className="inline-flex items-center rounded-full border border-navy-foreground/40 px-5 py-3 font-bold">Visit us</Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-secondary" aria-hidden />
            <img src={hero} alt="Pupils raising their hands in a bright classroom" width={1200} height={912} className="relative rounded-2xl shadow-2xl" />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <span className="eyebrow">Why families choose us</span>
        <h2 className="mt-2 text-3xl font-extrabold">A school that feels like family</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <div key={h.t} className="rounded-2xl border bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-primary"><h.icon size={22} /></span>
              <h3 className="mt-4 text-lg font-bold">{h.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{h.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-accent">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2">
          <img src={sports} alt="Pupils playing football on the school field" loading="lazy" width={1200} height={912} className="rounded-2xl" />
          <div>
            <span className="eyebrow">A word from our head</span>
            <blockquote className="mt-3 font-display text-2xl font-semibold leading-snug">
              “Our goal is simple: to help every child discover their gifts and grow in character, knowledge and grace.”
            </blockquote>
            <p className="mt-4 font-bold">— The Headteacher</p>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-10 py-16 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-extrabold">Latest news</h2>
            <Link to="/news" className="font-bold text-primary">All news →</Link>
          </div>
          <div className="mt-6 space-y-4">
            {news.map((n) => (
              <article key={n.title} className="rounded-2xl border bg-card p-5">
                <p className="text-xs font-bold text-muted-foreground">{n.date}</p>
                <h3 className="mt-1 text-lg font-bold">{n.title}</h3>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </article>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold">Upcoming</h2>
          <ul className="mt-6 space-y-3">
            {events.map((e) => (
              <li key={e.title} className="flex gap-4 rounded-2xl bg-navy p-4 text-navy-foreground">
                <CalendarDays className="text-secondary" />
                <div><p className="font-bold">{e.title}</p><p className="text-sm opacity-80">{e.date} · {e.place}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}
