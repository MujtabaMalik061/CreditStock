import Icon from '../components/Icon.jsx';
import SalesChart from '../components/SalesChart.jsx';
import BreakdownChart from '../components/BreakdownChart.jsx';
import { money } from '../utils/format.js';
import { downloadCsv } from '../utils/export.js';
export default function Reports({ data }) {
  const d = data.dashboard || {};
  const trend = d.salesTrend || [];
  const categories = Object.entries(data.products.reduce((map, product) => { const name = product.category || 'General'; map[name] = (map[name] || 0) + product.stock * product.costPrice; return map; }, {})).sort((a, b) => b[1] - a[1]);
  const categoryItems = categories.slice(0, 5).map(([label, value]) => ({ label, value }));
  if (categories.length > 5) categoryItems.push({ label: 'Other categories', value: categories.slice(5).reduce((sum, [, value]) => sum + value, 0) });
  function exportTrend() { downloadCsv('creditstock-weekly-sales.csv', ['Date', 'Day', 'Sales', 'Transactions'], trend.map(day => [day.date, day.label, day.sales, day.count])); }
  return <>
    <section className="page-intro"><div><span className="eyebrow">BUSINESS INSIGHTS</span><h2>Turn shop activity into clarity.</h2><p>Use your last seven days of sales and your current stock to guide the next move.</p></div><button className="btn soft" onClick={exportTrend}><Icon name="download" size={17}/> Export report</button></section>
    <section className="report-metrics"><div className="report-card featured"><span className="report-icon"><Icon name="trend" size={23}/></span><small>SALES · LAST 7 DAYS</small><strong>{money(d.weeklySales)}</strong><p>Revenue recorded this week</p><div className="report-decoration"></div></div><div className="report-card"><span className="report-icon orange"><Icon name="wallet" size={23}/></span><small>TO COLLECT</small><strong>{money(d.outstandingCredit)}</strong><p>Current customer credit</p></div><div className="report-card"><span className="report-icon blue"><Icon name="layers" size={23}/></span><small>INVENTORY AT COST</small><strong>{money(d.inventoryValue)}</strong><p>Value of stock on hand</p></div><div className="report-card"><span className="report-icon green"><Icon name="reports" size={23}/></span><small>EST. PROFIT · 7 DAYS</small><strong>{money(d.estimatedProfit)}</strong><p>Sales less recorded product cost</p></div></section>
    <section className="reports-grid"><div className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">REVENUE TREND</span><h3>Daily sales</h3></div><span className="period-tag">Past 7 days</span></div><SalesChart trend={trend}/><div className="report-note"><Icon name="activity" size={16}/> Sales are counted on the day they were recorded.</div></div><div className="panel"><div className="panel-head"><div><span className="eyebrow">STOCK BREAKDOWN</span><h3>Inventory by category</h3></div></div><BreakdownChart items={categoryItems} label="Inventory value" currency empty="Add stock to see your inventory value by category." /></div></section>
    <section className="panel chart-panel volume-panel"><div className="panel-head"><div><span className="eyebrow">SALES VOLUME</span><h3>Transactions per day</h3></div><span className="period-tag">Past 7 days</span></div><SalesChart trend={trend} metric="count" /><div className="report-note"><Icon name="receipt" size={16}/> Number of recorded sales, regardless of sale value.</div></section>
    <section className="insight-banner"><span className="insight-symbol"><Icon name="warning" size={25}/></span><div><strong>{d.lowStock?.length ? d.lowStock.length + ' products need attention' : 'Your stock looks healthy'}</strong><p>{d.lowStock?.length ? 'Restock low items to keep sales moving.' : 'Set reorder levels for every product to get timely alerts.'}</p></div><span className="insight-value">{d.lowStock?.length || 0} alerts</span></section>
  </>;
}
