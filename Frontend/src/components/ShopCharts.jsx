import BreakdownChart from './BreakdownChart.jsx';
import { money } from '../utils/format.js';

export default function ShopCharts({ products, customers }) {
  const stock = [
    { label: 'Healthy stock', value: products.filter(p => p.stock > 0 && p.stock > p.reorderLevel).length },
    { label: 'Running low', value: products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length },
    { label: 'Out of stock', value: products.filter(p => p.stock <= 0).length },
  ];
  const owing = customers.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5);
  const max = owing[0]?.balance || 1;
  return <section className="analytics-grid">
    <div className="panel"><div className="panel-head"><div><span className="eyebrow">INVENTORY HEALTH</span><h3>Stock at a glance</h3></div><span className="period-tag">{products.length} products</span></div><BreakdownChart items={stock} label="All products" empty="Add products to see your stock health." /></div>
    <div className="panel"><div className="panel-head"><div><span className="eyebrow">CUSTOMER CREDIT</span><h3>Largest outstanding balances</h3></div></div><p className="analytics-caption">Up to 5 customers · current balances</p>{owing.length ? <div className="credit-chart">{owing.map(customer => <div className="credit-chart-row" key={customer._id}><div><span>{customer.name}</span><strong>{money(customer.balance)}</strong></div><div className="credit-chart-track" role="img" aria-label={`${customer.name}: ${money(customer.balance)}`}><span style={{ width: `${customer.balance / max * 100}%` }} /></div></div>)}</div> : <div className="analytics-empty">No outstanding credit. Customer balances will appear here.</div>}</div>
  </section>;
}
