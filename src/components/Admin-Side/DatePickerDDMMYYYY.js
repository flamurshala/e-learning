import { useMemo, useState } from "react";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseDisplayDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || "").trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDisplayDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

export function todayDisplayDate() {
  return formatDisplayDate(new Date());
}

export function displayDateToIso(value) {
  const date = parseDisplayDate(value);
  if (!date) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isoDateToDisplay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return value || "";

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export default function DatePickerDDMMYYYY({ id, label, value, onChange, required = false }) {
  const selectedDate = parseDisplayDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);

  const moveMonth = (offset) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const changeYear = (year) => {
    if (!year || year.length > 4) return;
    const numericYear = Number(year);
    if (!Number.isInteger(numericYear) || numericYear < 1 || numericYear > 9999) return;

    setViewDate((current) => new Date(numericYear, current.getMonth(), 1));
  };

  const selectDate = (date) => {
    onChange(formatDisplayDate(date));
    setViewDate(date);
    setIsOpen(false);
  };

  return (
    <div className="relative mb-4">
      {label && (
        <label htmlFor={id} className="font-semibold block mb-2">
          {label}
        </label>
      )}
      <input
        id={id}
        className="w-full border border-black p-2"
        type="text"
        placeholder="dd/mm/yyyy"
        pattern="\d{2}/\d{2}/\d{4}"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        required={required}
      />
      <button
        type="button"
        className="absolute right-2 top-[34px] rounded border px-2 py-1 text-sm hover:bg-gray-100"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Open calendar"
      >
        Calendar
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded border border-gray-300 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded border px-2 py-1 hover:bg-gray-100"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
            >
              &lt;
            </button>
            <div className="flex items-center gap-2 font-semibold">
              <span>{monthNames[viewDate.getMonth()]}</span>
              <input
                type="number"
                min="1"
                max="9999"
                className="w-20 rounded border px-2 py-1 text-center"
                value={viewDate.getFullYear()}
                onChange={(event) => changeYear(event.target.value)}
                aria-label="Calendar year"
              />
            </div>
            <button
              type="button"
              className="rounded border px-2 py-1 hover:bg-gray-100"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
            {weekDays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const isCurrentMonth = date.getMonth() === viewDate.getMonth();
              const isSelected =
                selectedDate &&
                date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getDate() === selectedDate.getDate();

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  className={`rounded px-2 py-1 text-sm ${
                    isSelected
                      ? "bg-[#152259] text-white"
                      : isCurrentMonth
                      ? "hover:bg-gray-100"
                      : "text-gray-400 hover:bg-gray-50"
                  }`}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
