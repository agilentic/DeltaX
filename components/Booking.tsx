
import React, { useState } from 'react';
import { Transaction, Mentor, LessonPackage } from '../types';

const MOCK_MENTORS: Mentor[] = [
  { 
    id: 'm1', name: 'Dr. Alex Chen', credentials: 'PhD Oxford, 10+ Years Exp.', 
    bio: 'Specialist in Grade 9 Algebra and Calculus. My sessions focus on high-speed exam techniques and logic patterns.',
    avatar: '👨‍🏫', price: 98, rating: 4.9, tags: ['Algebra', 'Exam Prep'],
    calendlyUrl: '' // Not using Calendly as per user request
  },
  { 
    id: 'm2', name: 'Sarah Newton', credentials: 'Imperial College Graduate', 
    bio: 'Experienced in OCR and Edexcel board specifications. I emphasize visual measurement and ratio visualization.',
    avatar: '👩‍🏫', price: 98, rating: 4.8, tags: ['Geometry', 'Ratio'],
    calendlyUrl: ''
  },
  { 
    id: 'm3', name: 'James Wilson', credentials: 'GCSE Examiner & Lead Tutor', 
    bio: 'Former head of Math with over 20 years experience. I know exactly what examiners are looking for in Statistics.',
    avatar: '👨‍🎓', price: 98, rating: 5.0, tags: ['Statistics', 'AQA Expert'],
    calendlyUrl: ''
  },
];

const LESSON_PLANS: LessonPackage[] = [
  { id: 'single', name: 'Single Session', description: 'One-off strategic consultation', lessonCount: 1, discountMultiplier: 1, isRecurring: false },
  { id: 'weekly', name: 'Weekly Momentum', description: 'Recurring weekly session (4 per month)', lessonCount: 4, discountMultiplier: 0.9, isRecurring: true },
  { id: 'exam_bundle', name: 'Exam season Bundle', description: 'Pre-exam intensive (10 sessions)', lessonCount: 10, discountMultiplier: 0.8, isRecurring: false },
];

const BOOKED_SLOTS_MOCK = [12, 14, 20, 21, 25];

interface BookingProps {
  onConfirm: (tx: Transaction) => void;
}

const Booking: React.FC<BookingProps> = ({ onConfirm }) => {
  const [step, setStep] = useState(1);
  const [selectedMentor, setSelectedMentor] = useState<Mentor>(MOCK_MENTORS[0]);
  const [selectedPlan, setSelectedPlan] = useState<LessonPackage>(LESSON_PLANS[0]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'stripe' | 'bank'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const currentMonth = "June 2025";
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const times = ["09:00", "10:30", "13:00", "14:30", "16:00", "17:30", "19:00"];

  const totalPrice = selectedMentor.price * selectedPlan.lessonCount * selectedPlan.discountMultiplier;

  const handleFinalize = () => {
    setIsProcessing(true);
    // Simulate payment gateway
    setTimeout(() => {
      const tx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        item: `${selectedPlan.name} with ${selectedMentor.name}`,
        amount: totalPrice,
        date: new Date().toISOString(),
        type: 'Lesson',
        appointmentDetails: {
          mentor: selectedMentor.name,
          date: `${selectedDate} ${currentMonth}`,
          time: selectedTime,
          planType: selectedPlan.name
        }
      };
      onConfirm(tx);
      setIsProcessing(false);
      setBookingConfirmed(true);
    }, 2000);
  };

  if (bookingConfirmed) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-12 animate-fade-in">
        <div className="apple-card apple-shadow p-12 text-center space-y-10 bg-white border border-gray-100 rounded-[48px]">
           <div className="w-32 h-32 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-6xl mx-auto shadow-inner border border-green-100">✓</div>
           <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900">Tutorial Confirmed</h2>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">
                {paymentMethod === 'bank' 
                  ? "Your request is pending verification. Please complete the bank transfer using the reference provided."
                  : `Payment of £${totalPrice.toFixed(2)} successful. Your session is now officially scheduled.`}
              </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Strategist</p>
                <p className="font-black text-gray-900">{selectedMentor.name}</p>
                <p className="text-xs text-blue-600 font-bold">{selectedPlan.name}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                <p className="font-black text-gray-900">{selectedDate} {currentMonth}</p>
                <p className="text-xs text-gray-500 font-bold">{selectedTime} BST</p>
              </div>
           </div>

           <button 
             onClick={() => window.location.reload()}
             className="w-full py-6 bg-black text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
           >
             Finish & Return
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
        <h1 className="text-6xl font-black tracking-tight text-gray-900">Coaching Sessions</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-xl font-medium">Select a strategist, lock your time slot, and authorize payment to finalize.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Progress Sidebar */}
        <div className="lg:col-span-3 space-y-3">
           {[
             { s: 1, label: 'Choose Strategist', desc: 'Expert Selection' },
             { s: 2, label: 'Temporal Window', desc: 'Online Booking' },
             { s: 3, label: 'Choose Plan', desc: 'Single or Bundle' },
             { s: 4, label: 'Neural Link', desc: 'Secure Authorization' }
           ].map(item => (
             <div key={item.s} className={`p-6 rounded-[28px] border transition-all relative overflow-hidden ${step === item.s ? 'bg-black text-white border-black shadow-2xl scale-105 z-10' : 'bg-white text-gray-400 border-gray-100'}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${step === item.s ? 'text-blue-400' : 'text-gray-300'}`}>Phase 0{item.s}</p>
                <h4 className="font-black text-md tracking-tight leading-none mb-1">{item.label}</h4>
                <p className="text-[10px] opacity-60">{item.desc}</p>
             </div>
           ))}
        </div>

        {/* Step Content */}
        <div className="lg:col-span-9 apple-card apple-shadow bg-white border border-gray-100 min-h-[700px] flex flex-col rounded-[48px] overflow-hidden">
          {step === 1 && (
            <div className="p-12 space-y-10 animate-fade-in flex-1">
              <h3 className="text-3xl font-black text-gray-900">Mentor Selection</h3>
              <div className="grid grid-cols-1 gap-4">
                {MOCK_MENTORS.map(mentor => (
                  <button 
                    key={mentor.id} 
                    onClick={() => setSelectedMentor(mentor)}
                    className={`p-6 rounded-[32px] border-2 text-left transition-all flex flex-col md:flex-row gap-6 items-center relative ${selectedMentor.id === mentor.id ? 'border-blue-600 bg-blue-50/20 shadow-lg' : 'border-gray-50 hover:border-gray-200 bg-white'}`}
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-gray-100 shrink-0">{mentor.avatar}</div>
                    <div className="flex-1">
                        <p className="text-xl font-black text-gray-900 leading-none">{mentor.name}</p>
                        <p className="text-xs text-blue-600 font-bold mt-1">{mentor.credentials}</p>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-1">{mentor.bio}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-gray-900">£{mentor.price}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Recommended Price</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="pt-10 border-t border-gray-50 flex justify-end">
                <button onClick={() => setStep(2)} className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all">Select Slot &rarr;</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-12 space-y-10 animate-fade-in flex-1">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                 <div>
                   <h3 className="text-3xl font-black text-gray-900">Scheduling Window</h3>
                   <p className="text-gray-400 font-medium mt-1">Booking for <span className="text-blue-600 font-bold">{selectedMentor.name}</span></p>
                 </div>
                 <div className="flex gap-4">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-400 rounded-full"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booked</span></div>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full border border-gray-300"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Open</span></div>
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
                            className={`aspect-square rounded-[20px] text-sm font-black transition-all flex flex-col items-center justify-center relative ${
                              isPast ? 'bg-gray-50 text-gray-200 cursor-not-allowed opacity-40' :
                              isBooked ? 'bg-red-50 text-red-300 border border-red-100 cursor-not-allowed' :
                              selectedDate === day ? 'bg-blue-600 text-white shadow-xl scale-110 z-10' : 
                              'bg-white border-2 border-gray-100 text-gray-700 hover:border-blue-600 hover:scale-105'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-8 bg-gray-50/50 p-8 rounded-[36px] border border-gray-100 shadow-inner overflow-y-auto max-h-[400px]">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Temporal Grid</p>
                    {selectedDate ? (
                      <div className="grid grid-cols-1 gap-3">
                        {times.map(t => (
                          <button 
                            key={t} 
                            onClick={() => setSelectedTime(t)}
                            className={`p-5 rounded-2xl text-left px-8 text-sm font-black transition-all border-2 ${selectedTime === t ? 'border-blue-600 bg-white text-blue-700 shadow-lg' : 'border-transparent bg-white text-gray-600 hover:border-gray-200'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="text-4xl opacity-10">📅</div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-relaxed">Designate a date from the grid to view temporal availability.</p>
                      </div>
                    )}
                  </div>
               </div>

               <div className="pt-10 border-t border-gray-50 flex justify-between items-center">
                 <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-gray-400">← Change Mentor</button>
                 <button 
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(3)}
                  className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all"
                 >
                   Confirm Time &rarr;
                 </button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-12 space-y-10 animate-fade-in flex-1">
              <h3 className="text-3xl font-black text-gray-900">Subscription Plans</h3>
              <p className="text-gray-500 -mt-8">Choose a single session or a intensive bundle for exam season mastery.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {LESSON_PLANS.map(plan => (
                   <button 
                     key={plan.id}
                     onClick={() => setSelectedPlan(plan)}
                     className={`p-8 rounded-[40px] border-2 text-left transition-all flex flex-col justify-between h-full relative ${selectedPlan.id === plan.id ? 'border-blue-600 bg-blue-50/20 shadow-xl scale-105' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                   >
                     {plan.id === 'exam_bundle' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Intensive</div>}
                     <div className="space-y-4">
                        <h4 className="font-black text-xl text-gray-900">{plan.name}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{plan.description}</p>
                     </div>
                     <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-2xl font-black text-gray-900">£{(selectedMentor.price * plan.lessonCount * plan.discountMultiplier).toFixed(2)}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">{plan.lessonCount} Session{plan.lessonCount > 1 ? 's' : ''}</p>
                     </div>
                   </button>
                 ))}
              </div>
              
              <div className="pt-10 border-t border-gray-50 flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-xs font-black uppercase text-gray-400">← Back to Grid</button>
                <button onClick={() => setStep(4)} className="px-12 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all">Payment Gateway &rarr;</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-12 space-y-10 animate-fade-in flex-1">
               <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black text-gray-900">Secure Authorization</h3>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Total</p>
                    <p className="text-3xl font-black text-blue-600">£{totalPrice.toFixed(2)}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Method Selection</p>
                     <div className="space-y-2">
                        {[
                          { id: 'card', label: 'Credit Card', icon: 'fa-solid fa-credit-card', color: 'gray' },
                          { id: 'stripe', label: 'Stripe Pay', icon: 'fa-brands fa-stripe', color: '#635BFF' },
                          { id: 'paypal', label: 'PayPal', icon: 'fa-brands fa-paypal', color: '#003087' },
                          { id: 'bank', label: 'Bank Transfer', icon: 'fa-solid fa-building-columns', color: 'indigo' }
                        ].map(method => (
                          <button 
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={`w-full p-5 rounded-3xl border-2 flex items-center gap-4 transition-all ${paymentMethod === method.id ? 'border-blue-600 bg-blue-50/20' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'}`}
                          >
                             <i className={`${method.icon} text-xl`} style={{ color: method.id === 'card' ? '#374151' : method.color }}></i>
                             <span className="font-black text-sm text-gray-900">{method.label}</span>
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="bg-gray-50 p-10 rounded-[48px] border border-gray-100 shadow-inner flex flex-col justify-center">
                    {paymentMethod === 'card' ? (
                       <div className="space-y-6">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manual Entry</p>
                         <div className="space-y-3">
                            <input type="text" placeholder="Card Number" value={cardNumber} onChange={e=>setCardNumber(e.target.value)} className="stripe-input w-full" />
                            <div className="grid grid-cols-2 gap-3">
                               <input type="text" placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(e.target.value)} className="stripe-input w-full" />
                               <input type="text" placeholder="CVC" value={cvc} onChange={e=>setCvc(e.target.value)} className="stripe-input w-full" />
                            </div>
                         </div>
                         <button onClick={handleFinalize} disabled={isProcessing} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50">
                            {isProcessing ? 'Authorizing...' : 'Authorize Transaction'}
                         </button>
                       </div>
                    ) : paymentMethod === 'bank' ? (
                       <div className="space-y-6 text-center">
                          <i className="fa-solid fa-building-columns text-5xl text-indigo-200"></i>
                          <div className="space-y-2">
                             <p className="font-black text-gray-900">Direct Deposit Details</p>
                             <p className="text-[11px] text-gray-500 leading-relaxed">Ref: MM-{Math.random().toString(36).substr(2, 4).toUpperCase()}<br/>Acc: 88291022 • Sort: 20-44-12</p>
                          </div>
                          <button onClick={handleFinalize} disabled={isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
                             Funds Dispatched
                          </button>
                       </div>
                    ) : (
                       <div className="space-y-8 text-center py-6">
                          <i className={`fa-brands fa-${paymentMethod} text-8xl opacity-10`} style={{ color: paymentMethod === 'stripe' ? '#635BFF' : '#003087' }}></i>
                          <p className="font-black text-gray-900 capitalize">{paymentMethod} Integration Active</p>
                          <button onClick={handleFinalize} disabled={isProcessing} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
                             {isProcessing ? 'Redirecting...' : `Continue with ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`}
                          </button>
                       </div>
                    )}
                  </div>
               </div>
               
               <div className="pt-10 border-t border-gray-100 flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
                  <div className="flex gap-4">
                     <span>Secure Sandbox Active</span>
                     <span>•</span>
                     <span>SSL V3 Encrypted</span>
                  </div>
                  <button onClick={()=>setStep(3)} className="hover:text-black transition-colors underline">Return to Plans</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
