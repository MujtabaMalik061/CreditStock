import { useState } from 'react';
import { money } from '../utils/format.js';

const colors = ['#315c46', '#9bab73', '#d9a575', '#779ba5', '#a18bb2', '#b9b7a4'];

export default function BreakdownChart({ items, label, currency = false, empty = 'No data yet.' }) {
  const [active, setActive] = useState(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const format = currency ? money : value => value.toLocaleString('en-PK');
  const selected = items[active];
  let offset = 0;
  return total > 0 ? <div className="breakdown-chart">
    <div className="donut-wrap">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${label}: ${format(total)}. ${items.map(item => `${item.label}: ${format(item.value)}`).join(', ')}`}>
        <circle cx="100" cy="100" r="78" fill="none" stroke="#edf0e7" strokeWidth="25" />
        {items.map((item, index) => {
          const share = item.value / total * 100;
          const start = offset;
          offset += share;
          return <circle key={item.label} cx="100" cy="100" r="78" fill="none" stroke={colors[index % colors.length]} strokeWidth={active === index ? 31 : 25} pathLength="100" strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={-start} transform="rotate(-90 100 100)" onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}><title>{item.label}: {format(item.value)} ({Math.round(share)}%)</title></circle>;
        })}
      </svg>
      <div className="donut-center"><strong>{selected ? `${Math.round(selected.value / total * 100)}%` : '100%'}</strong><span>{selected?.label || label}</span></div>
    </div>
    <div className="chart-legend">{items.map((item, index) => <button type="button" key={item.label} className={active === index ? 'is-active' : ''} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onClick={() => setActive(active === index ? null : index)} aria-label={`${item.label}: ${format(item.value)}, ${Math.round(item.value / total * 100)} percent`}><i style={{ background: colors[index % colors.length] }} /><span>{item.label}</span><strong>{format(item.value)}</strong></button>)}</div>
  </div> : <div className="analytics-empty">{empty}</div>;
}
