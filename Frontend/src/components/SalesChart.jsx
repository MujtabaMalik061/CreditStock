import { money } from '../utils/format.js';
export default function SalesChart({ trend = [], compact = false, metric = 'sales' }) {
  const format = metric === 'count' ? value => Math.ceil(value).toLocaleString('en-PK') : money;
  const peak = Math.max(1, ...trend.map(day => day[metric] || 0));
  const max = metric === 'count' ? Math.ceil(peak / 2) * 2 : peak;
  const hasSales = trend.some(day => day[metric] > 0);
  return <div className={'sales-chart ' + (compact ? 'compact-chart' : '')}>
    <div className="chart-grid"><span>{format(max)}</span><span>{format(max / 2)}</span><span>{format(0)}</span></div>
    <div className="chart-bars">{trend.map((day, index) => <div className="chart-column" key={day.date || index}><div className="chart-track"><div className={'chart-bar ' + (index === trend.length - 1 ? 'latest' : '')} style={{ height: day[metric] / max * 100 + '%' }} tabIndex={0} role="img" aria-label={day.label + ': ' + format(day[metric]) + (metric === 'count' ? ' transactions' : ' sales')} title={day.label + ': ' + format(day[metric])} /></div><span>{day.label}</span></div>)}</div>
    {!hasSales && <span className="chart-empty">Your sales trend will appear here after your first sale.</span>}
  </div>;
}
