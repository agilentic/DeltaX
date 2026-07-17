import React, { useEffect, useMemo, useState } from 'react';
import { Mentor, Transaction } from '../types';

const env = (import.meta as any).env || {};
const fallbackUrl = env.VITE_CALENDLY_URL || '';

const MENTORS: Mentor[] = [
  {
    id: 'alex', name: 'Dr. Alex Chen', credentials: 'PhD Oxford, 10+ Years Exp.',
    bio: 'Grade 9 Algebra, exam technique and problem-solving.', avatar: '👨‍🏫', price: 98,
    rating: 4.9, tags: ['Algebra', 'Exam Prep'],
    calendlyUrl: env.VITE_CALENDLY_ALEX_URL || fallbackUrl,
  },
  {
    id: 'sarah', name: 'Sarah Newton', credentials: 'Imperial College Graduate',
    bio: 'OCR and Edexcel specialist with a visual approach to geometry and ratio.', avatar: '👩‍🏫', price: 98,
    rating: 4.8, tags: ['Geometry', 'Ratio'],
    calendlyUrl: env.VITE_CALENDLY_SARAH_URL || fallbackUrl,
  },
  {
    id: 'james', name: 'James Wilson', credentials: 'GCSE Examiner & Lead Tutor',
    bio: 'Statistics and examiner-led preparation backed by 20 years of teaching.', avatar: '👨‍🎓', price: 98,
    rating: 5, tags: ['Statistics', 'AQA Expert'],
    calendlyUrl: env.VITE_CALENDLY_JAMES_URL || fallbackUrl,
  },
];

interface BookingProps { onConfirm: (tx: Transaction) => void; }

const Booking: React.FC<BookingProps> = ({ onConfirm }) => {
  const [mentor, setMentor] = useState(MENTORS[0]);
  const [confirmed, setConfirmed] = useState(false);

  const calendlyUrl = useMemo(() => {
    if (!mentor.calendlyUrl) return '';
    try {
      const url = new URL(mentor.calendlyUrl);
      url.searchParams.set('hide_gdpr_banner', '1');
      url.searchParams.set('background_color', 'ffffff');
      url.searchParams.set('text_color', '111827');
      url.searchParams.set('primary_color', '2563eb');
      return url.toString();
    } catch { return ''; }
  }, [mentor]);

  useEffect(() => {
    const receiveCalendlyEvent = (event: MessageEvent) => {
      if (event.origin !== 'https://calendly.com' || event.data?.event !== 'calendly.event_scheduled') return;
      const eventUri = event.data?.payload?.event?.uri as string | undefined;
      onConfirm({
        id: eventUri || crypto.randomUUID(), item: `Tutoring session with ${mentor.name}`,
        amount: mentor.price, date: new Date().toISOString(), type: 'Lesson',
        appointmentDetails: { mentor: mentor.name, date: 'Confirmed in Calendly', time: 'See calendar invitation' },
      });
      setConfirmed(true);
    };
    window.addEventListener('message', receiveCalendlyEvent);
    return () => window.removeEventListener('message', receiveCalendlyEvent);
  }, [mentor, onConfirm]);

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-8 animate-fade-in">
      <header className="text-center space-y-3">
        <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">Live tutor availability</span>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900">Book a tutor</h1>
        <p className="text-gray-500 text-lg">Times are shown live by Calendly and reserved immediately when you book.</p>
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <aside className="bg-white border border-gray-100 rounded-[32px] p-5 apple-shadow space-y-3">
          <p className="px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Choose your tutor</p>
          {MENTORS.map(item => (
            <button key={item.id} onClick={() => { setMentor(item); setConfirmed(false); }}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${mentor.id === item.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}>
              <div className="flex gap-3 items-center">
                <span className="text-3xl">{item.avatar}</span>
                <div><p className="font-black text-gray-900">{item.name}</p><p className="text-xs text-blue-600 font-bold">★ {item.rating} · £{item.price}/session</p></div>
              </div>
              <p className="text-xs text-gray-500 mt-3">{item.bio}</p>
            </button>
          ))}
        </aside>

        <section className="bg-white border border-gray-100 rounded-[32px] overflow-hidden apple-shadow min-h-[700px]">
          {confirmed && <div className="m-5 p-4 rounded-2xl bg-green-50 text-green-800 font-bold">Booking confirmed. Calendly has sent your calendar invitation.</div>}
          {calendlyUrl ? (
            <iframe key={calendlyUrl} title={`Book ${mentor.name}`} src={calendlyUrl}
              className="w-full min-h-[700px] border-0" allow="payment" />
          ) : (
            <div className="min-h-[700px] flex items-center justify-center p-10 text-center">
              <div className="max-w-lg space-y-4">
                <div className="text-5xl">📅</div><h2 className="text-2xl font-black">Calendly setup required</h2>
                <p className="text-gray-500">Add <code className="bg-gray-100 px-2 py-1 rounded">VITE_CALENDLY_URL</code> or a tutor-specific Calendly URL to your deployment environment.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Booking;
