import { money } from '../utils/format.js';
export default function SalesChart({ trend = [], compact = false }) {
  const max = Math.max(1, ...trend.map(day => day.sales));
  const hasSales = trend.some(day => day.sales > 0);
  return <div className={'sales-chart ' + (compact ? 'compact-chart' : '')}>
    <div className="chart-grid"><span>{money(max)}</span><span>{money(max / 2)}</span><span>Rs 0</span></div>
    <div className="chart-bars">{trend.map((day, index) => <div className="chart-column" key={day.date || index}><div className="chart-track"><div className={'chart-bar ' + (index === trend.length - 1 ? 'latest' : '')} style={{ height: Math.max(day.sales ? 9 : 2, day.sales / max * 100) + '%' }} title={day.label + ': ' + money(day.sales)} /></div><span>{day.label}</span></div>)}</div>
    {!hasSales && <span className="chart-empty">Your sales trend will appear here after your first sale.</span>}
  </div>;
}
