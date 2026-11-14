import { Link } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { Menu, MapPin, ArrowRight, LogIn } from 'lucide-react';
import logo from '@/assets/school-logo.png.asset.json';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';

const nav = [
  { to: '/', label: 'Home' }, { to: '/about', label: 'About' },
  { to: '/academics', label: 'Academics' }, { to: '/admissions', label: 'Admissions' },
  { to: '/gallery', label: 'Gallery' }, { to: '/news', label: 'News & Events' }, { to: '/contact', label: 'Contact' },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="public-site flex min-h-screen flex-col">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="public-header sticky top-0 z-40 border-b bg-background">
      <div className="container-page flex h-24 items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="His Grace Academy home">
          <img src={logo.url} alt="His Grace Academy crest" width={60} height={60} className="h-14 w-14 shrink-0 object-contain"/>
          <span className="school-wordmark"><span className="block text-xl font-bold">His Grace Academy</span><span className="mt-1 block text-xs text-muted-foreground">Penkwase · Sunyani</span></span>
        </Link>
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Main navigation">{nav.map(n => <Link key={n.to} to={n.to} activeOptions={{exact:n.to==='/'}} className="public-nav text-sm font-semibold" activeProps={{className:'public-nav-active'}}>{n.label}</Link>)}</nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" className="hidden h-11 px-5 sm:inline-flex"><Link to="/portal"><LogIn/>Portal Login</Link></Button>
          <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open menu"><Menu/></Button></SheetTrigger>
            <SheetContent aria-describedby={undefined} className="public-site overflow-y-auto bg-background"><SheetTitle className="flex items-center gap-3 pr-3"><img src={logo.url} alt="" width={44} height={44}/>His Grace Academy</SheetTitle><nav aria-label="Mobile navigation" className="mt-8 flex flex-col gap-1">{nav.map(n => <SheetClose asChild key={n.to}><Link to={n.to} className="border-b py-4 font-semibold" activeOptions={{exact:n.to==='/'}} activeProps={{className:'text-primary'}}>{n.label}</Link></SheetClose>)}<Button asChild variant="secondary" className="mt-6 h-12"><Link to="/portal" onClick={()=>setOpen(false)}><LogIn/>Portal Login</Link></Button></nav></SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
    <footer className="bg-navy text-navy-foreground">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><div className="flex items-center gap-3"><img src={logo.url} alt="His Grace Academy crest" width={68} height={68} className="h-16 w-16 rounded-lg bg-card p-1 object-contain"/><p className="font-display text-2xl">His Grace Academy</p></div><p className="mt-5 flex max-w-xs gap-2 text-sm leading-relaxed text-navy-foreground/75"><MapPin size={18} className="shrink-0"/>Penkwase, Sunyani<br/>Bono Region, Ghana</p><p className="mt-5 text-xs text-navy-foreground/60">Official social links awaiting confirmation.</p></div>
        <div><h2 className="!font-sans text-sm font-bold text-secondary">Explore the school</h2><ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">{nav.map(n => <li key={n.to}><Link to={n.to} className="text-navy-foreground/80 hover:text-secondary">{n.label}</Link></li>)}</ul></div>
        <div><h2 className="!font-sans text-sm font-bold text-secondary">Let’s start a conversation</h2><p className="mt-5 text-sm leading-relaxed text-navy-foreground/75">Ask about admission, arrange a visit, or share your questions with us.</p><Button asChild variant="secondary" className="mt-5 h-11"><Link to="/contact">Admissions enquiry<ArrowRight/></Link></Button><p className="mt-4 text-xs text-navy-foreground/60">Phone and email awaiting confirmation.</p></div>
      </div><div className="container-page flex flex-wrap justify-between gap-3 border-t border-navy-foreground/15 py-6 text-xs text-navy-foreground/65"><p>© 2026 His Grace Academy. All rights reserved.</p><Link to="/portal" className="hover:text-secondary">School portal <span aria-hidden>↗</span></Link></div>
    </footer>
  </div>;
}

export function Crest({ className = 'h-16 w-16', rounded = 'rounded-lg' }: { className?: string; rounded?: string }) {
  return <span className={`grid shrink-0 place-items-center bg-background ring-1 ring-border ${rounded} ${className}`}><img src={logo.url} alt="" width={256} height={256} className="h-[88%] w-[88%] object-contain"/></span>;
}
export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return <section className="public-page-heading bg-muted"><div className="container-page py-14 md:py-20"><div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"><Link to="/" className="hover:text-primary">Home</Link><span>/</span><span>{eyebrow}</span></div><span className="public-eyebrow">His Grace Academy · {eyebrow}</span><h1 className="mt-4 max-w-3xl text-4xl leading-tight md:text-5xl">{title}</h1>{intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}</div></section>;
}
export function AdmissionsCTA() { return <section className="bg-muted"><div className="container-page flex flex-col items-start justify-between gap-8 py-14 md:flex-row md:items-center"><div><span className="public-eyebrow">Your next chapter</span><h2 className="mt-3 text-3xl md:text-4xl">Let’s talk about your child’s future.</h2><p className="mt-3 text-muted-foreground">Connect with His Grace Academy in Penkwase, Sunyani.</p></div><Button asChild variant="secondary" className="h-12 shrink-0 px-6"><Link to="/contact">Make an enquiry<ArrowRight/></Link></Button></div></section>; }
export function meta(title: string, description: string) { return {meta:[{title:`${title} | His Grace Academy`},{name:'description',content:description},{property:'og:title',content:`${title} | His Grace Academy`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}; }
