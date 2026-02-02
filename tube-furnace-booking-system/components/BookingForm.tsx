
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Save, Trash2, Clock, AlertCircle, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Booking } from '../types';
import { api } from '../services/api';

interface BookingFormProps {
  date: Date;
  initialSlot: { start: number; end: number } | null;
  editingBooking: Booking | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  existingBookings: Booking[];
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  date, 
  initialSlot, 
  editingBooking, 
  onClose, 
  onSuccess, 
  existingBookings 
}) => {
  const [startDate, setStartDate] = useState(format(date, 'yyyy-MM-dd'));
  const [startHour, setStartHour] = useState(initialSlot?.start ?? 9);
  const [endDate, setEndDate] = useState(format(date, 'yyyy-MM-dd'));
  const [endHour, setEndHour] = useState(initialSlot?.end ?? 10);
  
  const [formData, setFormData] = useState({
    name: '',
    sample: '',
    gas: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBooking) {
      const s = new Date(editingBooking.startDateTime);
      const e = new Date(editingBooking.endDateTime);
      setStartDate(format(s, 'yyyy-MM-dd'));
      setStartHour(s.getHours());
      setEndDate(format(e, 'yyyy-MM-dd'));
      setEndHour(e.getHours());
      setFormData({
        name: editingBooking.name,
        sample: editingBooking.sample,
        gas: editingBooking.gas,
        notes: editingBooking.notes || '',
      });
    }
  }, [editingBooking]);

  const validate = () => {
    const fullStart = new Date(`${startDate}T${String(startHour).padStart(2, '0')}:00:00`);
    const fullEnd = new Date(`${endDate}T${String(endHour).padStart(2, '0')}:00:00`);

    if (!formData.name.trim() || !formData.sample.trim() || !formData.gas.trim()) {
      setError("Please fill in all required fields.");
      return false;
    }
    if (fullStart.getTime() >= fullEnd.getTime()) {
      setError("End time must be strictly after start time.");
      return false;
    }
    
    // Conflict check
    const isOverlap = existingBookings.some(b => {
      if (editingBooking && b.id === editingBooking.id) return false;
      const bStart = new Date(b.startDateTime).getTime();
      const bEnd = new Date(b.endDateTime).getTime();
      return !(fullEnd.getTime() <= bStart || fullStart.getTime() >= bEnd);
    });

    if (isOverlap) {
      setError("This range overlaps with an existing booking.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    const fullStart = `${startDate}T${String(startHour).padStart(2, '0')}:00:00`;
    const fullEnd = `${endDate}T${String(endHour).padStart(2, '0')}:00:00`;

    const payload = {
      ...formData,
      startDateTime: fullStart,
      endDateTime: fullEnd,
    };
    
    try {
      if (editingBooking) {
        const result = await api.updateBooking({
          ...payload,
          id: editingBooking.id
        });
        if (result.success) {
          onSuccess("Booking updated successfully.");
        } else {
          setError(result.message || "Failed to update booking.");
        }
      } else {
        const result = await api.createBooking(payload);
        if (result.success) {
          onSuccess("Booking created successfully.");
        } else {
          setError(result.message || "Could not create booking.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const endHours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-5 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {editingBooking ? 'Modify Booking' : 'New Furnace Booking'}
            </h2>
            <p className="text-sm text-slate-500">Public Access Edit Mode</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center text-sm font-medium">
              <AlertCircle size={18} className="mr-3 shrink-0" />
              {error}
            </div>
          )}

          {/* Time & Date Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Start Time</label>
                <select
                  value={startHour}
                  onChange={e => setStartHour(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {hours.map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">End Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">End Time</label>
                <select
                  value={endHour}
                  onChange={e => setEndHour(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {endHours.map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Your Name *</label>
              <input
                required
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Sample Description *</label>
              <input
                required
                type="text"
                placeholder="Sample"
                value={formData.sample}
                onChange={e => setFormData({ ...formData, sample: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Gas / Air flow *</label>
              <input
                required
                type="text"
                placeholder="Gas"
                value={formData.gas}
                onChange={e => setFormData({ ...formData, gas: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Additional Notes</label>
              <textarea
                placeholder="Optional notes..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[80px]"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t bg-slate-50 flex items-center space-x-3">
          {editingBooking ? (
            <>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm("Are you sure you want to delete this booking?")) return;
                  setIsLoading(true);
                  const result = await api.deleteBooking(editingBooking.id);
                  if (result.success) { onSuccess("Booking deleted."); onClose(); }
                  else { setError(result.message || "Delete failed."); setIsLoading(false); }
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl disabled:opacity-50"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Update'}
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full px-4 py-4 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
