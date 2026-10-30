import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Droplet,
  MapPin,
  X,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  FileText,
  Eye,
  CalendarDays,
  ListFilter,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { WaterSchedule, Language } from '../types/index.ts';

interface IrrigationCalendarProps {
  schedules: WaterSchedule[];
  language: Language;
  onNavigate?: (tab: string) => void;
}

export const IrrigationCalendar: React.FC<IrrigationCalendarProps> = ({
  schedules,
  language,
  onNavigate,
}) => {
  // Default date anchored to active season date or current date
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (schedules.length > 0) {
      const dates = schedules
        .map((s) => new Date(s.plannedStartTime).getTime())
        .filter((t) => !isNaN(t));
      if (dates.length > 0) {
        return new Date(dates[0]);
      }
    }
    return new Date();
  });

  // Default view to 'week' mode for compact high-density scheduling view
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('week');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedSchedule, setSelectedSchedule] = useState<WaterSchedule | null>(null);

  // Filter schedules by block and status
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (selectedBlockFilter !== 'ALL' && !s.plotCode.includes(selectedBlockFilter)) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL') {
        if (selectedStatusFilter === 'SCHEDULED' && !['SUBMITTED', 'APPROVED', 'DRAFT'].includes(s.status)) {
          return false;
        }
        if (selectedStatusFilter === 'ONGOING' && s.status !== 'IN_PROGRESS') {
          return false;
        }
        if (selectedStatusFilter === 'COMPLETED' && s.status !== 'COMPLETED') {
          return false;
        }
        if (selectedStatusFilter === 'INTERRUPTED' && !['INTERRUPTED', 'CANCELLED'].includes(s.status)) {
          return false;
        }
      }
      return true;
    });
  }, [schedules, selectedBlockFilter, selectedStatusFilter]);

  // Calendar Date Navigation Handlers
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    if (schedules.length > 0) {
      setCurrentDate(new Date(schedules[0].plannedStartTime));
    } else {
      setCurrentDate(new Date());
    }
  };

  // Helper for status badge styling with distinct color coding
  const getStatusBadge = (status: WaterSchedule['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return {
          labelRw: 'Iri Gukora',
          labelEn: 'Ongoing',
          bg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700/80 font-bold',
          dotBg: 'bg-amber-500 animate-pulse',
          icon: PlayCircle,
        };
      case 'APPROVED':
      case 'SUBMITTED':
      case 'DRAFT':
        return {
          labelRw: 'Yateganyijwe',
          labelEn: 'Scheduled',
          bg: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-700/80 font-semibold',
          dotBg: 'bg-sky-500',
          icon: CalendarIcon,
        };
      case 'COMPLETED':
        return {
          labelRw: 'Yarangiye',
          labelEn: 'Completed',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700/80 font-semibold',
          dotBg: 'bg-emerald-500',
          icon: CheckCircle2,
        };
      case 'INTERRUPTED':
      case 'CANCELLED':
        return {
          labelRw: 'Yahagaritswe',
          labelEn: 'Interrupted',
          bg: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700/80 font-semibold',
          dotBg: 'bg-rose-500',
          icon: AlertTriangle,
        };
      default:
        return {
          labelRw: status,
          labelEn: status,
          bg: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
          dotBg: 'bg-slate-400',
          icon: CalendarIcon,
        };
    }
  };

  // Date Calculations for Month & Week Grids
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesRw = [
    'Mweru (Mba)',
    'Gashyantare (Gas)',
    'Mutarama (Mut)',
    'Maturu (Mtu)',
    'Gishura (Gis)',
    'Kamena (Kam)',
    'Nyakanga (Nya)',
    'Agaciro (Aga)',
    'Nzeli (Nze)',
    'Kukanyoni (Kuk)',
    'Ugushyingo (Ugu)',
    'Ukuboza (Uku)',
  ];

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const calendarCells = useMemo(() => {
    const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = mondayOffset - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : (42 - cells.length > 0 ? 42 - cells.length : 0);
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return cells;
  }, [year, month, daysInMonth, mondayOffset]);

  const getSchedulesForDate = (d: Date) => {
    const targetStr = d.toISOString().split('T')[0];
    return filteredSchedules.filter((s) => {
      const schedDateStr = new Date(s.plannedStartTime).toISOString().split('T')[0];
      return schedDateStr === targetStr;
    });
  };

  // Week View Calculations (Monday to Sunday)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs overflow-hidden transition-colors">
      {/* Calendar Header Toolbar */}
      <div className="p-4 sm:p-5 bg-emerald-950 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-700 rounded-xl text-white shrink-0 shadow-xs">
            <CalendarIcon className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Kalendari yo Kuhira</span>
              <span className="text-xs font-normal text-emerald-200 hidden sm:inline">(Irrigation Calendar)</span>
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              GFI Nasho 1 · Water Delivery Schedules & Pivot Allocations
            </p>
          </div>
        </div>

        {/* View Switcher & Navigation Cluster */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Mode Segmented Controls */}
          <div className="flex items-center p-1 bg-emerald-900/90 rounded-xl text-xs font-semibold border border-emerald-800">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'week' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Icyumweru (Week)
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'month' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Ukwezi (Month)
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'day' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Umunsi (Day)
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'agenda' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Urutonde (List)
            </button>
          </div>

          {/* Date Range Navigation Buttons */}
          <div className="flex items-center gap-1.5 bg-emerald-900/90 p-1 rounded-xl border border-emerald-800">
            <button
              onClick={handlePrev}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-emerald-100 hover:text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer whitespace-nowrap"
            >
              Uyu Munsi
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Controls Bar: Filters & Period Label */}
      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Active Period Label */}
        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            {monthNamesRw[month]} {year}
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">({monthNamesEn[month]})</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Block Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Block:</span>
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL" className="dark:bg-slate-800">All Blocks</option>
              <option value="BLOCK-A" className="dark:bg-slate-800">Block A (Pivot 01)</option>
              <option value="BLOCK-B" className="dark:bg-slate-800">Block B (Pivot 02)</option>
              <option value="BLOCK-C" className="dark:bg-slate-800">Block C (Dragline)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL" className="dark:bg-slate-800">All Statuses</option>
              <option value="ONGOING" className="dark:bg-slate-800">Iri Gukora (Ongoing)</option>
              <option value="SCHEDULED" className="dark:bg-slate-800">Yateganyijwe (Scheduled)</option>
              <option value="COMPLETED" className="dark:bg-slate-800">Yarangiye (Completed)</option>
              <option value="INTERRUPTED" className="dark:bg-slate-800">Yahagaritswe (Interrupted)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="p-3 sm:p-5">
        {/* COMPACT HIGH-DENSITY WEEK VIEW GRID (DEFAULT) */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((d, idx) => {
              const daySchedules = getSchedulesForDate(d);
              const isToday = d.toDateString() === new Date().toDateString();
              const dayNameRw = ['Mbere', 'Kabiri', 'Gatatu', 'Kani', 'Gatanu', 'Gatandatu', 'Cyumweru'][idx];

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-2.5 flex flex-col space-y-2.5 transition ${
                    isToday
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-1 ring-emerald-400/50'
                      : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        {dayNameRw}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {d.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-full text-slate-800 dark:text-slate-200">
                      {daySchedules.length}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1 min-h-[140px] overflow-y-auto max-h-[300px]">
                    {daySchedules.length === 0 ? (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center py-8">
                        Nta gahunda
                      </div>
                    ) : (
                      daySchedules.map((s) => {
                        const badge = getStatusBadge(s.status);
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedSchedule(s)}
                            className={`p-2 rounded-lg border text-xs space-y-1 transition cursor-pointer hover:shadow-md ${badge.bg}`}
                          >
                            <div className="flex items-center justify-between font-mono font-extrabold text-[11px]">
                              <span>{s.plotCode}</span>
                              <span className="text-[10px] opacity-90 font-normal">
                                {new Date(s.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                              {s.farmerName}
                            </div>
                            <div className="text-[10px] text-slate-700 dark:text-slate-300 flex items-center justify-between font-mono">
                              <span>{s.plannedVolumeM3} m³</span>
                              <span className="text-[9px] font-bold uppercase">{badge.labelRw}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MONTH VIEW GRID */}
        {viewMode === 'month' && (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-600 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-700">
              <span>Mbe (Mon)</span>
              <span>Kab (Tue)</span>
              <span>Mgt (Wed)</span>
              <span>Kan (Thu)</span>
              <span>Gnu (Fri)</span>
              <span className="text-emerald-700 dark:text-emerald-400">Gmt (Sat)</span>
              <span className="text-emerald-700 dark:text-emerald-400">Gyo (Sun)</span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                const daySchedules = getSchedulesForDate(cell.date);
                const isToday = cell.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition ${
                      cell.isCurrentMonth
                        ? isToday
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                          isToday
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : cell.isCurrentMonth
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>

                      {daySchedules.length > 0 && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md">
                          {daySchedules.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px] scrollbar-thin">
                      {daySchedules.map((s) => {
                        const badge = getStatusBadge(s.status);
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSchedule(s)}
                            className={`w-full text-left p-1 rounded-md border text-[10px] font-semibold truncate transition cursor-pointer flex items-center justify-between gap-1 ${badge.bg}`}
                          >
                            <div className="flex items-center gap-1 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dotBg}`} />
                              <span className="font-mono font-bold">{s.plotCode}</span>
                            </div>
                            <span className="font-mono text-[9px] opacity-80 shrink-0">
                              {new Date(s.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DAY VIEW TIMELINE */}
        {viewMode === 'day' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                Gahunda yo Kuhira yo ku ya {currentDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                {getSchedulesForDate(currentDate).length} Delivery Cycles
              </span>
            </div>

            <div className="space-y-3">
              {getSchedulesForDate(currentDate).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nta gahunda yo kuhira ibonetse kuri iyi tariki.
                  </p>
                </div>
              ) : (
                getSchedulesForDate(currentDate).map((s) => {
                  const badge = getStatusBadge(s.status);
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSchedule(s)}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition cursor-pointer hover:shadow-md ${badge.bg}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-white/80 dark:bg-slate-800 rounded-xl shadow-xs shrink-0">
                          <Droplet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {s.plotCode}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                              {badge.labelRw}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{s.farmerName}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(s.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>• {s.plannedVolumeM3} m³</span>
                          </div>
                        </div>
                      </div>

                      <button className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center gap-1 self-start sm:self-center shrink-0 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Soma Byose</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* AGENDA LIST VIEW */}
        {viewMode === 'agenda' && (
          <div className="space-y-3">
            {filteredSchedules.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nta gahunda yo kuhira ibonetse.
                </p>
              </div>
            ) : (
              filteredSchedules.map((s) => {
                const badge = getStatusBadge(s.status);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSchedule(s)}
                    className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:shadow-xs transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white shrink-0 text-center min-w-[75px]">
                        <div>{new Date(s.plannedStartTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                        <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          {new Date(s.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                          <span>{s.plotCode}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.labelRw}
                          </span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 font-semibold">{s.farmerName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Allocated: {s.plannedVolumeM3} m³ ({s.allocationBasis.replace('_', ' ')})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        {s.scheduleCode}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* EVENT DETAILS MODAL */}
      {selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-700 rounded-xl">
                  <Droplet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedSchedule.scheduleCode}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    GFI Nasho 1 · Water Delivery Event Details
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSchedule(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Umurima (Plot Code):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{selectedSchedule.plotCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Umuhinzi (Farmer):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSchedule.farmerName}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Igihe cyo Gutangira (Start):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(selectedSchedule.plannedStartTime).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Igihe cyo Gusoza (End):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(selectedSchedule.plannedEndTime).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Amazi Yateganyijwe (Planned Volume):</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{selectedSchedule.plannedVolumeM3} m³</span>
                </div>

                {selectedSchedule.actualVolumeM3 !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Amazi Yakoreshejwe (Measured):</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{selectedSchedule.actualVolumeM3} m³</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Uburyo bwo Kugawa (Basis):</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedSchedule.allocationBasis.replace('_', ' ')}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Imimerere (Status):</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getStatusBadge(selectedSchedule.status).bg}`}>
                    {getStatusBadge(selectedSchedule.status).labelRw} ({getStatusBadge(selectedSchedule.status).labelEn})
                  </span>
                </div>
              </div>

              {selectedSchedule.approvedBy && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                  <span className="font-bold block text-[11px]">Inyandiko zo Kwemeza (Approval):</span>
                  <p className="text-[11px]">
                    Yemejwe na <strong>{selectedSchedule.approvedBy}</strong> {selectedSchedule.approvedAt ? `ku ya ${new Date(selectedSchedule.approvedAt).toLocaleDateString()}` : ''}.
                  </p>
                </div>
              )}

              {selectedSchedule.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="font-bold block text-[11px]">Ibindi Bisobanuro (Notes):</span>
                  <p className="text-[11px] leading-relaxed">{selectedSchedule.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              {onNavigate && (
                <button
                  onClick={() => {
                    setSelectedSchedule(null);
                    onNavigate('schedules');
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Reba mu Iteganyamazi (Go to Schedules)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setSelectedSchedule(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer ml-auto"
              >
                Funga (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
