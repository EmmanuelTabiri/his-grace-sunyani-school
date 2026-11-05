import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import logo from "@/assets/school-logo.png.asset.json";
import { school } from "@/lib/school";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/admissions", label: "Admissions" },
  { to: "/academics", label: "Academics" },
  { to: "/gallery", label: "Gallery" },
  { to: "/news", label: "News & Events" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <img src={logo.url} alt="His Grace Academy logo" width={44} height={44} className="h-11 w-11 object-contain" />
            {school.name}
          </Link>
          <nav className="hidden gap-1 lg:flex" aria-label="Main">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                activeProps={{ className: "bg-accent !text-foreground" }}>{n.label}</Link>
            ))}
          </nav>
          <Link to="/portal" className="btn-sun !py-2 !px-4 hidden sm:inline-flex">Portal login</Link>
          <button className="lg:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <nav className="container-page flex flex-col pb-4 lg:hidden" aria-label="Mobile">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 font-semibold">{n.label}</Link>
            ))}
            <Link to="/portal" className="py-2 font-bold text-primary">Portal login</Link>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-navy text-navy-foreground">
        <div className="container-page grid gap-8 py-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3"><img src={logo.url} alt="" width={56} height={56} className="h-14 w-14 rounded-full bg-background object-contain" /><p className="font-display text-xl font-extrabold">{school.name}</p></div>
            <p className="mt-2 text-sm opacity-80">{school.motto}</p>
            <div className="mt-4 flex gap-3 text-sm opacity-80"><a href="#">Facebook</a><a href="#">Instagram</a><a href="#">YouTube</a></div>
          </div>
          <div>
            <p className="font-bold text-secondary">Quick links</p>
            <ul className="mt-3 space-y-1 text-sm opacity-90">
              {nav.slice(1).map((n) => <li key={n.to}><a href={n.to}>{n.label}</a></li>)}
            </ul>
          </div>
          <div className="space-y-2 text-sm opacity-90">
            <p className="font-bold text-secondary">Contact</p>
            <p className="flex gap-2"><MapPin size={16} />{school.location}</p>
            <p className="flex gap-2"><Phone size={16} />{school.phone}</p>
            <p className="flex gap-2"><Mail size={16} />{school.email}</p>
          </div>
        </div>
        <p className="border-t border-navy-foreground/15 py-4 text-center text-xs opacity-70">© 2026 {school.name}. All rights reserved.</p>
      </footer>
    </div>
  );
}

/** School crest on a light chip — keeps the maroon lettering readable on dark bands. */
export function Crest({ className = "h-16 w-16", rounded = "rounded-2xl" }: { className?: string; rounded?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center bg-background ring-1 ring-black/5 ${rounded} ${className}`}>
      <img src={logo.url} alt="" width={256} height={256} className="h-[88%] w-[88%] object-contain" />
    </span>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="bg-navy text-navy-foreground">
      <div className="container-page flex items-start gap-5 py-16">
        <Crest className="hidden h-20 w-20 sm:grid" />
        <div>
          <span className="eyebrow !text-secondary">{eyebrow}</span>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl text-lg opacity-85">{intro}</p>}
        </div>
      </div>
    </section>
  );
}

export function meta(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | His Grace Academy` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | His Grace Academy` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
