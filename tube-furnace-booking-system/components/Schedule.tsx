
import React from 'react';
import { format, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { Booking } from '../types';
import { User, FlaskConical, Wind, FileText, Edit3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ScheduleProps {
  date: Date;
  bookings: Booking[];
  onSlotClick: (hour: number) => void;
  onEditBooking: (booking: Booking) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ date, bookings, onSlotClick, onEditBooking }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Group bookings by the hour they first appear ON THIS DAY
  const visualBookings = bookings.map(b => {
    const bStart = new Date(b.startDateTime);
    const bEnd = new Date(b.endDateTime);
    
    // The portion that intersects this day
    const effectiveStart = bStart < dayStart ? dayStart : bStart;
    const effectiveEnd = bEnd > dayEnd ? dayEnd : bEnd;
    
    const startHour = effectiveStart.getHours();
    // Rounding duration to hours
    const durationHours = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60);

    return {
      original: b,
      startHour,
      durationHours,
      startsBefore: bStart < dayStart,
      endsAfter: bEnd > dayEnd,
      isFirstHourOfSegment: true // Since we filter bookings to day overlap, each booking gets one visual segment per day
    };
  });

  return (
    <div className="relative bg-slate-50 min-h-full">
      <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-slate-200 bg-white"></div>

      {hours.map(hour => {
        const segments = visualBookings.filter(vb => vb.startHour === hour);

        return (
          <div key={hour} className="group flex h-20 border-b border-slate-100 relative">
            <div className="w-16 flex flex-col items-center justify-start pt-2 bg-white z-0">
              <span className="text-[10px] font-bold text-slate-400">
                {format(new Date(date).setHours(hour, 0), 'HH:00')}
              </span>
            </div>

            <div className="flex-1 relative">
              {segments.length === 0 && !visualBookings.some(vb => hour > vb.startHour && hour < vb.startHour + vb.durationHours) ? (
                <button
                  onClick={() => onSlotClick(hour)}
                  className="absolute inset-0 w-full text-left p-4 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50/50 flex items-center justify-center cursor-pointer"
                >
                  <span className="text-indigo-600 font-bold text-sm flex items-center">
                    <Edit3 size={16} className="mr-2" /> Book {format(new Date(date).setHours(hour, 0), 'HH:00')}
                  </span>
                </button>
              ) : null}

              {segments.map((vb, idx) => (
                <div 
                  key={vb.original.id}
                  style={{ 
                    height: `${vb.durationHours * 5 - 0.25}rem`, 
                    zIndex: 10,
                    top: '0.125rem' 
                  }}
                  className={`absolute inset-x-2 rounded-xl border border-indigo-200 bg-white shadow-sm overflow-hidden flex flex-col group/booking transition-all hover:shadow-md hover:border-indigo-300`}
                >
                  <div className="flex-1 p-3 flex flex-col">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex flex-wrap gap-1 items-center">
                        {vb.startsBefore && (
                          <div className="flex items-center bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            <ArrowDownRight size={10} className="mr-0.5" /> CONTINUES
                          </div>
                        )}
                        <div className="flex items-center bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-tight">
                          {format(new Date(vb.original.startDateTime), 'HH:00')} - {format(new Date(vb.original.endDateTime), 'HH:00')}
                          {!isSameDay(new Date(vb.original.startDateTime), new Date(vb.original.endDateTime)) && ' (+1d)'}
                        </div>
                        {vb.endsAfter && (
                          <div className="flex items-center bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            NEXT DAY <ArrowUpRight size={10} className="ml-0.5" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => onEditBooking(vb.original)}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>

                    <div className="space-y-1 mt-1 overflow-hidden">
                      <div className="flex items-center text-slate-800 font-bold text-sm truncate">
                        <User size={13} className="mr-2 text-indigo-400 shrink-0" />
                        {vb.original.name}
                      </div>
                      <div className="flex items-center text-slate-600 text-xs truncate">
                        <FlaskConical size={13} className="mr-2 text-indigo-400 shrink-0" />
                        {vb.original.sample}
                      </div>
                      {vb.durationHours > 1.5 && (
                        <div className="flex items-center text-slate-500 text-xs truncate">
                          <Wind size={13} className="mr-2 text-indigo-400 shrink-0" />
                          {vb.original.gas}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Schedule;
