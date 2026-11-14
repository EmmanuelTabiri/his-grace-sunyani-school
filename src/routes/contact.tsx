import { createFileRoute } from '@tanstack/react-router';
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { SiteLayout, PageHeader, meta } from '@/components/SiteLayout';
import { EnquiryForm } from '@/components/EnquiryForm';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/contact')({
  head: () => meta('Contact & enquiries', 'Contact His Grace Academy in Penkwase, Sunyani. Send an admission enquiry or find the school’s confirmed location.'),
  component: Contact,
});

const details = [
  { icon: MapPin, label: 'School location', value: 'Penkwase, Sunyani, Bono Region, Ghana' },
  { icon: Phone, label: 'Telephone', value: 'Awaiting school confirmation' },
  { icon: Mail, label: 'Email address', value: 'Awaiting school confirmation' },
  { icon: Clock, label: 'Office hours', value: 'Awaiting school confirmation' },
];

function Contact() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Contact" title="Let’s start a conversation." intro="Questions about admissions or school life? We’d love to hear from you." />
      <section className="container-page grid gap-14 py-16 lg:grid-cols-2">
        <div>
          <span className="public-eyebrow">Visit His Grace Academy</span>
          <h2 className="mt-3 text-3xl">Find us in Penkwase, Sunyani.</h2>
          <div className="mt-8 space-y-6">
            {details.map((detail) => (
              <div key={detail.label} className="flex gap-4">
                <detail.icon size={21} className="mt-1 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold">{detail.label}</p>
                  <p className="mt-1 text-muted-foreground">{detail.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-9 border-y bg-muted px-6 py-8">
            <MapPin size={28} className="text-primary" />
            <h3 className="mt-4 text-xl">Penkwase · Sunyani · Ghana</h3>
            <p className="mt-3 text-sm text-muted-foreground">The exact school map pin is awaiting confirmation.</p>
            <Button asChild variant="link" className="mt-4 px-0">
              <a href="https://www.google.com/maps/search/?api=1&query=Penkwase%2C%20Sunyani%2C%20Ghana" target="_blank" rel="noopener noreferrer">View the Penkwase area<ArrowUpRight /></a>
            </Button>
          </div>
        </div>
        <div className="rounded-lg border bg-muted p-6 sm:p-8">
          <EnquiryForm />
        </div>
      </section>
    </SiteLayout>
  );
}
