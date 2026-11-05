import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const publicEventsOptions = queryOptions({
  queryKey: ['public-events'],
  queryFn: async () => {
    const { data, error } = await supabase.from('events').select('id,title,event_date,place,description').gte('event_date', new Date().toISOString().slice(0, 10)).order('event_date');
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export function PublicEvents({ compact = false }: { compact?: boolean }) {
  const { data } = useSuspenseQuery(publicEventsOptions);
  const events = compact ? data.slice(0, 3) : data;
  return events.length ? <ul className="divide-y border-y">{events.map(e => <li key={e.id} className="flex gap-5 py-6"><CalendarDays className="mt-1 shrink-0 text-primary" size={24}/><div><p className="text-sm font-semibold text-muted-foreground">{new Date(`${e.event_date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p><h3 className="mt-1 text-xl font-bold">{e.title}</h3>{e.place && <p className="mt-1 text-muted-foreground">{e.place}</p>}{!compact && e.description && <p className="mt-3">{e.description}</p>}</div></li>)}</ul> : <div className="border-y py-9"><CalendarDays className="mb-3 text-primary" size={28}/><h3 className="text-xl font-semibold">No upcoming events announced</h3><p className="mt-2 text-muted-foreground">Confirmed dates will appear here when the school posts them.</p></div>;
}