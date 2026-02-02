
import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus, Info, ShieldCheck } from 'lucide-react';
import { api } from './services/api';
import { Booking } from './types';
import Calendar from './components/Calendar';
import Schedule from './components/Schedule';
import BookingForm from './components/BookingForm';

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: number; end: number } | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const data = await api.getBookings(dateStr);
    setBookings(data);
    setIsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSlotClick = (hour: number) => {
    setSelectedSlot({ start: hour, end: hour + 1 });
    setIsFormOpen(true);
  };

  const handleBookingSuccess = (message: string) => {
    setIsFormOpen(false);
    setEditingBooking(null);
    setSelectedSlot(null);
    setShowToast(message || "Success!");
    setTimeout(() => setShowToast(null), 3000);
    fetchBookings();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Tube Furnace <span className="text-indigo-600">Booking</span></h1>
          </div>
          <div className="hidden md:flex items-center text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
            <Info size={16} className="mr-2 text-slate-400" />
            Open Access • Anyone can edit or book
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Calendar & Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <Calendar 
                selectedDate={selectedDate} 
                onDateSelect={handleDaySelect} 
              />
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              <h3 className="text-indigo-900 font-semibold mb-2 flex items-center">
                <ShieldCheck size={18} className="mr-2" />
                Quick Guide
              </h3>
              <ul className="text-indigo-800 text-sm space-y-2 list-disc pl-4">
                <li>Select a date on the monthly calendar.</li>
                <li>Click an empty slot to create a new booking.</li>
                <li>Click an existing booking to edit or cancel.</li>
                <li>Overnight bookings are fully supported.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Schedule */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
              <div className="p-6 border-b flex items-center justify-between bg-white sticky top-[64px] z-10">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{format(selectedDate, 'EEEE, MMMM do')}</h2>
                  <p className="text-sm text-slate-500">{bookings.length} active bookings</p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm"
                >
                  <Plus size={18} className="mr-2" />
                  New Booking
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-20 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    Loading schedule...
                  </div>
                ) : (
                  <Schedule 
                    date={selectedDate} 
                    bookings={bookings} 
                    onSlotClick={handleSlotClick}
                    onEditBooking={(b) => {
                      setEditingBooking(b);
                      setIsFormOpen(true);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Booking Form Modal */}
      {isFormOpen && (
        <BookingForm
          date={selectedDate}
          initialSlot={selectedSlot}
          editingBooking={editingBooking}
          onClose={() => {
            setIsFormOpen(false);
            setEditingBooking(null);
            setSelectedSlot(null);
          }}
          onSuccess={handleBookingSuccess}
          existingBookings={bookings}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-medium flex items-center">
            <ShieldCheck size={18} className="mr-2 text-green-400" />
            {showToast}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
