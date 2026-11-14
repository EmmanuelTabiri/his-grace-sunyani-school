import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, LoaderCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { enquirySchema } from '@/lib/enquiry';
import { Button } from '@/components/ui/button';

type FieldName = 'full_name' | 'email' | 'phone' | 'message';
type FieldErrors = Partial<Record<FieldName, string>>;
const fieldNames: FieldName[] = ['full_name', 'email', 'phone', 'message'];

export function EnquiryForm() {
  const id = useId();
  const successRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!sent || !successRef.current) return;
    successRef.current.focus({ preventScroll: true });
    successRef.current.scrollIntoView({ block: 'center' });
  }, [sent]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get('website')) return;

    const result = enquirySchema.safeParse({
      full_name: data.get('full_name'),
      email: data.get('email'),
      phone: data.get('phone'),
      message: data.get('message'),
    });

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && fieldNames.includes(field as FieldName)) {
          const name = field as FieldName;
          if (!nextErrors[name]) nextErrors[name] = issue.message;
        }
      }
      setErrors(nextErrors);
      setError('Please correct the highlighted fields and try again.');
      const firstField = result.error.issues[0]?.path[0];
      if (typeof firstField === 'string') {
        const input = form.elements.namedItem(firstField);
        if (input instanceof HTMLElement) input.focus();
      }
      return;
    }

    setBusy(true);
    setError('');
    setErrors({});
    try {
      const { error: saveError } = await supabase.from('contact_enquiries').insert(result.data);
      if (saveError) throw saveError;
      form.reset();
      setSent(true);
    } catch {
      setError('Your enquiry could not be sent. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  function fieldProps(name: FieldName) {
    const errorId = `${id}-${name}-error`;
    return {
      id: `${id}-${name}`,
      name,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? errorId : undefined,
      onInput: () => {
        if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
      },
    };
  }

  function FieldError({ name }: { name: FieldName }) {
    if (!errors[name]) return null;
    return <p id={`${id}-${name}-error`} className="mt-2 text-sm font-semibold text-destructive">{errors[name]}</p>;
  }

  if (sent) {
    return (
      <div ref={successRef} role="status" aria-live="polite" tabIndex={-1} className="py-12">
        <CheckCircle2 size={36} className="text-primary" />
        <h2 className="mt-5 text-3xl">Thank you for getting in touch.</h2>
        <p className="mt-5 leading-relaxed text-muted-foreground">Your enquiry has been saved privately for the school administrator to review. No automatic email is sent.</p>
        <Button variant="outline" className="mt-7" onClick={() => { setSent(false); setError(''); }}>Send another enquiry</Button>
      </div>
    );
  }

  const field = 'mt-2 w-full rounded-md border bg-background px-4 py-3 font-normal focus:border-primary';

  return (
    <form onSubmit={submit} noValidate aria-labelledby={`${id}-title`} className="space-y-5">
      <h2 id={`${id}-title`} className="text-3xl">Send an enquiry</h2>
      <p className="text-sm text-muted-foreground">Share a little about your child or your question. Required fields are marked with an asterisk.</p>

      <div>
        <label htmlFor={`${id}-full_name`} className="block text-sm font-bold">Full name *</label>
        <input {...fieldProps('full_name')} required autoComplete="name" maxLength={120} className={field} />
        <FieldError name="full_name" />
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="block text-sm font-bold">Email address *</label>
        <input {...fieldProps('email')} type="email" required autoComplete="email" maxLength={254} className={field} />
        <FieldError name="email" />
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className="block text-sm font-bold">Phone number <span className="font-normal text-muted-foreground">(optional)</span></label>
        <input {...fieldProps('phone')} type="tel" autoComplete="tel" maxLength={40} className={field} />
        <FieldError name="phone" />
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="block text-sm font-bold">Your message *</label>
        <textarea {...fieldProps('message')} required rows={5} maxLength={3000} className={field} />
        <FieldError name="message" />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      <Button type="submit" variant="secondary" disabled={busy} className="h-12 w-full">
        {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
        {busy ? 'Sending enquiry…' : 'Send enquiry'}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">Your details are shared privately with the school administrator, not displayed publicly.</p>
    </form>
  );
}
