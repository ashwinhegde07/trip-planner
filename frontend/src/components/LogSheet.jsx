/**
 * LogSheet — ELD (Electronic Logging Device) Log Sheet renderer.
 *
 * Renders a 24-hour horizontal grid for each day with 4 duty status rows:
 *   - Off Duty
 *   - Sleeper Berth (not used but shown per FMCSA format)
 *   - Driving
 *   - On Duty (Not Driving)
 *
 * Draws coloured segments and vertical transition lines dynamically
 * based on the API response events.
 */

const STATUS_ROWS = [
  { key: 'off_duty', label: 'Off Duty', color: '#64748b' },
  { key: 'sleeper', label: 'Sleeper', color: '#8b5cf6' },
  { key: 'driving', label: 'Driving', color: '#22c55e' },
  { key: 'on_duty', label: 'On Duty', color: '#f59e0b' },
];

// Map event types to row indices
const TYPE_TO_ROW = {
  off_duty: 0,
  sleeper: 1,
  driving: 2,
  on_duty: 3,
  break: 0,   // breaks are Off Duty
  fuel: 3,    // fuel stops are On Duty
  restart: 0, // restart is Off Duty
};

const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0–24

/**
 * Parse "HH:MM" to decimal hours.
 */
function parseTime(timeStr) {
  if (!timeStr) return 0;
  if (timeStr === '24:00') return 24;
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

/**
 * Render a single day's ELD log sheet.
 */
function DaySheet({ day, dayIndex }) {
  const { date, events, total_driving_hours, total_on_duty_hours, cycle_hours_remaining } = day;

  // Build segments per row
  const segments = events.map((event) => {
    const start = parseTime(event.start);
    const end = parseTime(event.end);
    const rowIdx = TYPE_TO_ROW[event.type] ?? 0;
    return { ...event, startH: start, endH: end, rowIdx, duration: end - start };
  });

  // Build transition lines (vertical connectors between rows)
  const transitions = [];
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    if (prev.rowIdx !== curr.rowIdx) {
      const x = (curr.startH / 24) * 100;
      const topRow = Math.min(prev.rowIdx, curr.rowIdx);
      const bottomRow = Math.max(prev.rowIdx, curr.rowIdx);
      transitions.push({ x, topRow, bottomRow, time: curr.startH });
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center text-sm font-bold text-primary-400">
            {dayIndex + 1}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Day {dayIndex + 1}</h4>
            <p className="text-xs text-surface-400">{date}</p>
          </div>
        </div>

        {/* Day stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-surface-400">Driving</p>
            <p className="text-sm font-bold text-emerald-400">{total_driving_hours?.toFixed(1)}h</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-surface-400">On Duty</p>
            <p className="text-sm font-bold text-amber-400">{total_on_duty_hours?.toFixed(1)}h</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-surface-400">Cycle Left</p>
            <p className={`text-sm font-bold ${cycle_hours_remaining < 10 ? 'text-red-400' : 'text-blue-400'}`}>
              {cycle_hours_remaining?.toFixed(1)}h
            </p>
          </div>
        </div>
      </div>

      {/* ELD Grid */}
      <div className="eld-grid p-4">
        <div className="eld-grid-canvas">
          {/* Hour markers */}
          <div className="eld-hour-markers">
            {HOURS.map((h) => (
              <div key={h} className="eld-hour-marker">
                {h < 24 ? (h === 0 ? 'M' : h === 12 ? 'N' : h) : ''}
              </div>
            ))}
          </div>

          {/* Status rows */}
          <div className="relative">
            {STATUS_ROWS.map((row, rowIdx) => (
              <div key={row.key} className="eld-row">
                <div className="eld-row-label">{row.label}</div>
                <div className="eld-row-track">
                  {/* Hour gridlines */}
                  {HOURS.slice(0, 24).map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 border-l border-surface-700/40"
                      style={{ left: `${(h / 24) * 100}%` }}
                    />
                  ))}

                  {/* Active segments for this row */}
                  {segments
                    .filter((seg) => seg.rowIdx === rowIdx)
                    .map((seg, i) => {
                      const left = (seg.startH / 24) * 100;
                      const width = ((seg.endH - seg.startH) / 24) * 100;
                      return (
                        <div
                          key={i}
                          className={`eld-segment eld-segment-${seg.type}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${seg.description || seg.type}: ${seg.start}–${seg.end}`}
                        />
                      );
                    })}
                </div>
              </div>
            ))}

            {/* Vertical transition lines */}
            {transitions.map((t, i) => {
              const ROW_HEIGHT = 36; // matches .eld-row height
              const top = t.topRow * ROW_HEIGHT + ROW_HEIGHT / 2;
              const height = (t.bottomRow - t.topRow) * ROW_HEIGHT;
              // Offset by label width
              const leftPx = `calc(140px + ${t.x}% * (100% - 140px) / 100)`;
              return (
                <div
                  key={i}
                  className="eld-transition"
                  style={{
                    left: `${(t.x / 100) * (100) + 0}%`,
                    marginLeft: '140px',
                    top: `${top}px`,
                    height: `${height}px`,
                  }}
                  title={`Transition at ${t.time.toFixed(1)}h`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Events timeline */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {events.map((event, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-800/80 border border-surface-700/50 text-xs"
              title={event.description}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    event.type === 'driving' ? '#22c55e' :
                      event.type === 'on_duty' ? '#f59e0b' :
                        event.type === 'break' || event.type === 'fuel' ? '#ef4444' :
                          '#64748b',
                }}
              />
              <span className="text-surface-300 font-mono">{event.start}–{event.end}</span>
              <span className="text-surface-500 capitalize">{event.type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * LogSheet — renders all daily log sheets.
 */
export default function LogSheet({ days }) {
  if (!days || days.length === 0) return null;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Daily ELD Log Sheets</h2>
          <p className="text-xs text-surface-400">{days.length} day{days.length > 1 ? 's' : ''} generated — FMCSA compliant</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 px-2 text-xs">
        {STATUS_ROWS.map((row) => (
          <div key={row.key} className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded" style={{ backgroundColor: row.color }} />
            <span className="text-surface-400">{row.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded bg-red-500" />
          <span className="text-surface-400">Break / Fuel</span>
        </div>
      </div>

      {/* Day sheets */}
      <div className="space-y-4">
        {days.map((day, idx) => (
          <DaySheet key={day.date || idx} day={day} dayIndex={idx} />
        ))}
      </div>
    </div>
  );
}
