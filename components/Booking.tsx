
import React, { useState } from 'react';
import { Transaction } from '../types';

interface Mentor {
  id: string;
  name: string;
  credentials: string;
  bio: string;
  avatar: string;
  price: number;
  rating: number;
  tags: string[];
}

const MOCK_MENTORS: Mentor[] = [
  { 
    id: 'm1', name: 'Dr. Alex Chen', credentials: 'PhD Oxford, 10+ Years Exp.', 
    bio: 'Specialist in Grade 9 Algebra and Calculus. My sessions focus on high-speed exam techniques and logic patterns.',
    avatar: '👨‍🏫', price: 45, rating: 4.9, tags: ['Algebra', 'Exam Prep']
  },
  { 
    id: 'm2', name: 'Sarah Newton', credentials: 'Imperial College Graduate', 
    bio: 'Experienced in OCR and Edexcel board specifications. I emphasize visual measurement and ratio visualization.',
    avatar: '👩‍🏫', price: 40, rating: 4.8, tags: ['Geometry', 'Ratio']
  },
  { 
    id: 'm3', name: 'James Wilson', credentials: 'GCSE Examiner & Lead Tutor', 
    bio: 'Former head of Math with over 20 years experience. I know exactly what examiners are looking for in Statistics.',
    avatar: '👨‍🎓', price: 50, rating: 5.0, tags: ['Statistics', 'AQA Expert']
  },
];

const BOOKED_SLOTS_MOCK = [12, 14, 20, 21, 25];

interface BookingProps {
  onConfirm: (tx: Transaction) => void;
}

const Booking: React.FC<BookingProps> = ({ onConfirm }) => {
  const [step, setStep] = useState(1);
  const [selectedMentor, setSelectedMentor] = useState<Mentor>(MOCK_MENTORS[0]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const currentMonth = "June 2025";
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const times = ["09:00", "10:30", "13:00", "14:30", "16:00", "17:30", "19:00"];

  const handleFinalize = () => {
    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      item: `Coaching Session with ${selectedMentor.name}`,
      amount: selectedMentor.price,
      date: new Date().toISOString(),
      type: 'Lesson',
      appointmentDetails: {
        mentor: selectedMentor.name,
        date: `${selectedDate} ${currentMonth}`,
        time: selectedTime
      }
    };
    onConfirm(tx);
    setBookingConfirmed(true);
  };

  if (bookingConfirmed) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-12 animate-fade-in">
        <div className="apple-card apple-shadow p-12 text-center space-y-10 bg-white border border-gray-100 rounded-[48px]">
           <div className="w-32 h-32 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-6xl mx-auto shadow-inner border border-green-100">✓</div>
           <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900">Booking Finalized</h2>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">A confirmation email with session links has been sent to your registered address.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mentor</p>
                <p className="font-black text-gray-900">{selectedMentor.name}</p>
                <p className="text-xs text-blue-600 font-bold">{selectedMentor.credentials}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Appointment</p>
                <p className="font-black text-gray-900">{selectedDate} {currentMonth}</p>
                <p className="text-xs text-gray-500 font-bold">{selectedTime} BST</p>
              </div>
           </div>

           <div className="p-6 bg-blue-50/50 rounded-3xl text-sm font-medium text-blue-800 leading-relaxed border border-blue-100">
              Session link will become active 10 minutes before start. Ensure your microphone is calibrated in the AI Lab before joining.
           </div>

           <button 
             onClick={() => window.location.reload()}
             className="w-full py-6 bg-black text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
           >
             Dismiss
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in py-12">
      <header className="text-center space-y-4">
        <div className="inline-block px-5 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black tracking-[0.3em] uppercase">
          Neural Mentorship
        </div>
        <h1 className="text-6xl font-black tracking-tight text-gray-900">Elite 1-on-1 Sessions</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-xl font-medium">Calibrate your learning path with board-certified human intelligence.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Step Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-3">
           {[
             { s: 1, label: 'Choose Strategist', desc: 'Select your mentor' },
             { s: 2, label: 'Identify Window', desc: 'Browse available slots' },
             { s: 3, label: 'Neural Link', desc: 'Confirm & Finalize' }
           ].map(item => (
             <div key={item.s} className={`p-8 rounded-[32px] border transition-all relative overflow-hidden ${step === item.s ? 'bg-black text-white border-black shadow-2xl scale-105 z-10' : 'bg-white text-gray-400 border-gray-100'}`}>
                {step === item.s && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>}
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${step === item.s ? 'text-blue-400' : 'text-gray-300'}`}>Phase 0{item.s}</p>
                <h4 className="font-black text-lg tracking-tight leading-none mb-1">{item.label}</h4>
                <p className="text-xs opacity-60">{item.desc}</p>
             </div>
           ))}
        </div>

        <div className="lg:col-span-9 apple-card apple-shadow p-12 bg-white border border-gray-100 min-h-[700px] flex flex-col rounded-[48px]">
          {step === 1 && (
            <div className="space-y-10 animate-fade-in flex-1">
              <h3 className="text-3xl font-black text-gray-900">Mentor Selection</h3>
              <div className="grid grid-cols-1 gap-6">
                {MOCK_MENTORS.map(mentor => (
                  <button 
                    key={mentor.id} 
                    onClick={() => setSelectedMentor(mentor)}
                    className={`p-8 rounded-[36px] border-2 text-left transition-all flex flex-col md:flex-row gap-8 items-start md:items-center relative ${selectedMentor.id === mentor.id ? 'border-blue-600 bg-blue-50/20 shadow-lg' : 'border-gray-50 hover:border-gray-200 bg-white'}`}
                  >
                    <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-5xl shadow-sm border border-gray-100 shrink-0">{mentor.avatar}</div>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-2xl font-black text-gray-900 leading-none">{mentor.name}</p>
                          <p className="text-sm text-blue-600 font-bold mt-1">{mentor.credentials}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-900">£{mentor.price}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Per Hour</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed pr-8">{mentor.bio}</p>
                      <div className="flex gap-2">
                        {mentor.tags.map(t => <span key={t} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">{t}</span>)}
                        <span className="ml-auto text-xs font-black text-yellow-500">★ {mentor.rating}</span>
                      </div>
                    </div>
                    {selectedMentor.id === mentor.id && <div className="absolute top-8 right-8 w-3 h-3 bg-blue-600 rounded-full animate-ping"></div>}
                  </button>
                ))}
              </div>
              <div className="pt-10 border-t border-gray-50 flex justify-end">
                <button onClick={() => setStep(2)} className="px-12 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all">Proceed to Calendar &rarr;</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 animate-fade-in flex-1">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                 <div>
                   <h3 className="text-3xl font-black text-gray-900">Identifying Windows</h3>
                   <p className="text-gray-400 font-medium mt-1">Viewing availability for <span className="text-blue-600 font-bold">{selectedMentor.name}</span></p>
                 </div>
                 <div className="flex gap-4">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-100 rounded-full border border-gray-200"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Past</span></div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-50 rounded-full border border-red-200"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booked</span></div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white rounded-full border-2 border-blue-600"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Open</span></div>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-7 space-y-6">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] text-center">{currentMonth}</p>
                    <div className="grid grid-cols-7 gap-3">
                      {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-gray-300 py-2">{d}</div>
                      ))}
                      {daysInMonth.map(day => {
                        const isPast = day <= 5;
                        const isBooked = BOOKED_SLOTS_MOCK.includes(day);
                        const isAvailable = !isPast && !isBooked;
                        
                        return (
                          <button 
                            key={day}
                            disabled={!isAvailable}
                            onClick={() => setSelectedDate(day)}
                            className={`aspect-square rounded-[20px] text-sm font-black transition-all flex flex-col items-center justify-center relative group ${
                              isPast ? 'bg-gray-50 text-gray-200 cursor-not-allowed opacity-40' :
                              isBooked ? 'bg-red-50 text-red-300 border border-red-100 cursor-not-allowed' :
                              selectedDate === day ? 'bg-blue-600 text-white shadow-[0_20px_40px_-12px_rgba(59,130,246,0.6)] scale-110 z-10' : 
                              'bg-white border-2 border-gray-100 text-gray-700 hover:border-blue-600 hover:scale-105'
                            }`}
                          >
                            <span>{day}</span>
                            {isAvailable && selectedDate !== day && <div className="absolute bottom-2 w-1 h-1 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100"></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-8 bg-gray-50/50 p-8 rounded-[36px] border border-gray-100 shadow-inner">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Temporal Slots</p>
                    {selectedDate ? (
                      <div className="grid grid-cols-1 gap-3">
                        {times.map(t => (
                          <button 
                            key={t} 
                            onClick={() => setSelectedTime(t)}
                            className={`p-5 rounded-2xl text-left px-8 text-sm font-black transition-all border-2 relative overflow-hidden ${selectedTime === t ? 'border-blue-600 bg-white text-blue-700 shadow-xl' : 'border-transparent bg-white text-gray-600 hover:border-gray-200'}`}
                          >
                            {t}
                            {selectedTime === t && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600">✓</div>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="text-4xl opacity-20">📅</div>
                        <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest leading-relaxed">Designate a date from the calendar to view temporal availability.</p>
                      </div>
                    )}
                  </div>
               </div>

               <div className="pt-10 border-t border-gray-50 flex justify-between items-center">
                 <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-gray-400 hover:text-black tracking-widest transition-colors">&larr; Re-select Mentor</button>
                 <button 
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="px-12 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all disabled:opacity-30"
                 >
                   Establish Link &rarr;
                 </button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-fade-in flex-1">
               <h3 className="text-3xl font-black text-gray-900">Neural Link Authorization</h3>
               <div className="bg-gray-50 p-12 rounded-[48px] space-y-10 border border-gray-100 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                     <div className="flex gap-8 items-center">
                       <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-5xl shadow-xl border border-gray-100 shrink-0">{selectedMentor.avatar}</div>
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Lead Strategist</p>
                          <p className="text-3xl font-black text-gray-900 leading-tight">{selectedMentor.name}</p>
                          <p className="text-sm font-bold text-blue-600">{selectedMentor.credentials}</p>
                       </div>
                     </div>
                     <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-gray-100 text-center min-w-[200px] transform hover:scale-105 transition-transform">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-60">Temporal Lock</p>
                        <p className="text-2xl font-black text-gray-900">{selectedDate} {currentMonth}</p>
                        <p className="text-sm font-black text-blue-600">{selectedTime} BST</p>
                     </div>
                  </div>
                  
                  <div className="space-y-5 pt-10 border-t border-gray-200/60">
                    <div className="flex justify-between items-center group">
                      <span className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] group-hover:text-gray-900 transition-colors">Strategic Consultation (1.0h)</span>
                      <span className="font-black text-gray-900 text-lg">£{selectedMentor.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-40">
                      <span className="text-xs text-gray-400 font-black uppercase tracking-[0.2em]">Neural Network Tax</span>
                      <span className="font-black text-gray-900 text-lg">£0.00</span>
                    </div>
                    <div className="pt-8 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-black text-2xl text-gray-900 uppercase tracking-tight">Final Authorization</span>
                      <span className="font-black text-4xl text-blue-600">£{selectedMentor.price.toFixed(2)}</span>
                    </div>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleFinalize}
                    className="w-full py-7 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.4em] shadow-[0_25px_50px_-12px_rgba(59,130,246,0.5)] active:scale-95 transition-all hover:bg-blue-700 hover:-translate-y-1"
                  >
                    Authorize & Secure Slot
                  </button>
                  <button onClick={() => setStep(2)} className="text-[10px] font-black uppercase text-gray-400 hover:text-black text-center tracking-widest transition-colors py-2">Return to temporal grid</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
