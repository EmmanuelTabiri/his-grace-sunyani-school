import { createFileRoute, Link } from '@tanstack/react-router';
import { Suspense } from 'react';
import { Newspaper, ArrowRight } from 'lucide-react';
import { SiteLayout, PageHeader, AdmissionsCTA, meta } from '@/components/SiteLayout';
import { PublicEvents } from '@/components/PublicEvents';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/news')({head:()=>meta('News & Events','Confirmed upcoming events and updates from His Grace Academy, Penkwase, Sunyani.'),component:News});
function News(){return <SiteLayout><PageHeader eyebrow="News & Events" title="Stay close to school life." intro="The latest from our community, with confirmed dates for your calendar."/><section className="container-page grid gap-14 py-16 lg:grid-cols-2"><div><h2 className="mb-7 text-3xl">School news</h2><div className="border-y py-9"><Newspaper size={28} className="text-primary"/><h3 className="mt-4 text-xl">Updates are on their way</h3><p className="mt-3 leading-relaxed text-muted-foreground">There are no confirmed public news stories yet. Families can read school and class announcements in their private portal.</p><Button asChild variant="link" className="mt-5 px-0"><Link to="/portal">View family announcements<ArrowRight/></Link></Button></div></div><div><h2 className="mb-7 text-3xl">Upcoming events</h2><Suspense fallback={<p role="status">Loading school events…</p>}><PublicEvents/></Suspense></div></section><AdmissionsCTA/></SiteLayout>}
