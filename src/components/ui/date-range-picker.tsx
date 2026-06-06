"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  label?: string;
}

const PRESETS = [
  { label: "Hoje",           getDates: () => { const d = today(); return { from: d, to: d }; } },
  { label: "Ontem",          getDates: () => { const d = offsetDay(-1); return { from: d, to: d }; } },
  { label: "Últimos 7 dias", getDates: () => ({ from: offsetDay(-6), to: today() }) },
  { label: "Últimos 30 dias",getDates: () => ({ from: offsetDay(-29), to: today() }) },
  { label: "Esse mês",       getDates: () => { const n = new Date(); return { from: fmt(new Date(n.getFullYear(), n.getMonth(), 1)), to: fmt(new Date(n.getFullYear(), n.getMonth() + 1, 0)) }; } },
  { label: "Mês passado",    getDates: () => { const n = new Date(); return { from: fmt(new Date(n.getFullYear(), n.getMonth() - 1, 1)), to: fmt(new Date(n.getFullYear(), n.getMonth(), 0)) }; } },
  { label: "Esse ano",       getDates: () => { const y = new Date().getFullYear(); return { from: `${y}-01-01`, to: `${y}-12-31` }; } },
  { label: "Últimos 12 meses", getDates: () => ({ from: offsetDay(-364), to: today() }) },
  { label: "Personalizado",  getDates: () => ({ from: "", to: "" }) },
];

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

function today() { return fmt(new Date()); }
function offsetDay(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return fmt(d); }
function fmt(d: Date) { return d.toISOString().slice(0, 10); }

function parseDate(s: string) { return s ? new Date(s + "T12:00:00") : null; }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun → convert to Mon-based (0=Mon)
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function isSame(a: string, b: string) { return a === b; }
function isBetween(d: string, from: string, to: string) {
  return from && to && d > from && d < to;
}

export function DateRangePicker({ value, onChange, placeholder = "Selecionar período", label }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const [selecting, setSelecting] = useState<"from" | "to" | null>(null);
  const [hovering, setHovering] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Two months shown: left=leftMonth, right=leftMonth+1
  const now = new Date();
  const [leftYear, setLeftYear] = useState(now.getFullYear());
  const [leftMonth, setLeftMonth] = useState(now.getMonth() === 0 ? 11 : now.getMonth() - 1);
  const [leftMonthYear, setLeftMonthYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (open) { setDraft(value); setSelecting(null); setHovering(""); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function getRightMonth() {
    const m = leftMonth + 1 > 11 ? 0 : leftMonth + 1;
    const y = leftMonth + 1 > 11 ? leftMonthYear + 1 : leftMonthYear;
    return { month: m, year: y };
  }

  function prevMonth() {
    if (leftMonth === 0) { setLeftMonth(11); setLeftMonthYear(y => y - 1); }
    else setLeftMonth(m => m - 1);
  }
  function nextMonth() {
    if (leftMonth === 11) { setLeftMonth(0); setLeftMonthYear(y => y + 1); }
    else setLeftMonth(m => m + 1);
  }

  function handleDayClick(day: string) {
    if (!selecting || selecting === "from") {
      setDraft({ from: day, to: "" });
      setSelecting("to");
      setActivePreset("Personalizado");
    } else {
      if (day < draft.from) {
        setDraft({ from: day, to: draft.from });
      } else {
        setDraft({ from: draft.from, to: day });
      }
      setSelecting(null);
      setActivePreset("Personalizado");
    }
  }

  function handlePreset(preset: typeof PRESETS[0]) {
    if (preset.label === "Personalizado") {
      setActivePreset("Personalizado");
      setDraft({ from: "", to: "" });
      setSelecting("from");
      return;
    }
    const dates = preset.getDates();
    setDraft(dates);
    setActivePreset(preset.label);
    setSelecting(null);
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clear() {
    onChange({ from: "", to: "" });
    setOpen(false);
  }

  const displayValue = value.from
    ? value.from === value.to || !value.to
      ? formatDisplay(value.from)
      : `${formatDisplay(value.from)} → ${formatDisplay(value.to)}`
    : null;

  return (
    <div className="relative" ref={ref}>
      {label && <label className="text-xs text-zinc-500 font-medium block mb-1.5">{label}</label>}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg border transition-all text-left ${
          displayValue
            ? "bg-violet-600/10 border-violet-500/30 text-violet-300"
            : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
        }`}
      >
        <Calendar className="w-4 h-4 shrink-0" />
        <span className="flex-1 truncate">{displayValue ?? placeholder}</span>
        {displayValue && (
          <X className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 shrink-0"
            onClick={(e) => { e.stopPropagation(); clear(); }} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex overflow-hidden"
          style={{ minWidth: 620 }}>
          {/* Presets sidebar */}
          <div className="w-40 border-r border-zinc-800 py-2 shrink-0">
            {PRESETS.map((p) => (
              <button key={p.label}
                onClick={() => handlePreset(p)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  activePreset === p.label
                    ? "bg-blue-600 text-white font-medium"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendars + footer */}
          <div className="flex flex-col flex-1">
            <div className="flex p-4 gap-6">
              {/* Left month */}
              <MonthCalendar
                year={leftMonthYear} month={leftMonth}
                draft={draft} hovering={hovering}
                selecting={selecting}
                onDayClick={handleDayClick}
                onDayHover={setHovering}
                onPrev={prevMonth}
                showPrev
              />
              {/* Right month */}
              <MonthCalendar
                year={getRightMonth().year} month={getRightMonth().month}
                draft={draft} hovering={hovering}
                selecting={selecting}
                onDayClick={handleDayClick}
                onDayHover={setHovering}
                onNext={nextMonth}
                showNext
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 pb-4 border-t border-zinc-800 pt-3">
              <span className="text-sm text-zinc-400 font-mono">
                {draft.from
                  ? draft.from === draft.to || !draft.to
                    ? formatDisplay(draft.from)
                    : `${formatDisplay(draft.from)} → ${formatDisplay(draft.to)}`
                  : <span className="text-zinc-600">Nenhum período selecionado</span>
                }
              </span>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)}
                  className="px-4 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg hover:border-zinc-500 transition-all">
                  Cancelar
                </button>
                <button onClick={apply}
                  className="px-4 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all">
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDisplay(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

interface MonthCalendarProps {
  year: number; month: number;
  draft: DateRange; hovering: string;
  selecting: "from" | "to" | null;
  onDayClick: (d: string) => void;
  onDayHover: (d: string) => void;
  onPrev?: () => void; onNext?: () => void;
  showPrev?: boolean; showNext?: boolean;
}

function MonthCalendar({ year, month, draft, hovering, selecting, onDayClick, onDayHover, onPrev, onNext, showPrev, showNext }: MonthCalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // effective "to" when hovering during selection
  function effectiveTo(d: string) {
    if (selecting === "to" && hovering && draft.from) {
      return hovering > draft.from ? hovering : draft.from;
    }
    return draft.to;
  }
  function effectiveFrom(d: string) {
    if (selecting === "to" && hovering && draft.from) {
      return hovering < draft.from ? hovering : draft.from;
    }
    return draft.from;
  }

  return (
    <div className="flex-1">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className={`p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all ${!showPrev ? "invisible" : ""}`}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-zinc-200">{MONTHS_PT[month]} {year}</span>
        <button onClick={onNext} className={`p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all ${!showNext ? "invisible" : ""}`}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-zinc-600 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const ef = effectiveFrom(d);
          const et = effectiveTo(d);
          const isFrom = isSame(d, ef);
          const isTo = isSame(d, et);
          const isMid = ef && et && isBetween(d, ef, et);
          const isSelected = isFrom || isTo;
          const isToday = d === fmt(new Date());

          return (
            <div key={d} className="relative flex items-center justify-center h-8">
              {/* Range highlight background */}
              {(isMid || (isFrom && et && et !== ef) || (isTo && ef && et !== ef)) && (
                <div className={`absolute inset-y-0 ${
                  isFrom ? "left-1/2 right-0" : isTo ? "left-0 right-1/2" : "left-0 right-0"
                } bg-blue-600/15`} />
              )}
              <button
                onClick={() => onDayClick(d)}
                onMouseEnter={() => onDayHover(d)}
                className={`relative z-10 w-7 h-7 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow"
                    : isMid
                    ? "text-zinc-200 hover:bg-zinc-700"
                    : isToday
                    ? "text-blue-400 font-bold hover:bg-zinc-800"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
