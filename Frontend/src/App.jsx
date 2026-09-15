import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { api } from './api/client.js';
import Icon from './components/Icon.jsx';
import Modal from './components/Modal.jsx';
import Overview from './pages/Overview.jsx';
import Inventory from './pages/Inventory.jsx';
import Customers from './pages/Customers.jsx';
import Activity from './pages/Activity.jsx';
import Reports from './pages/Reports.jsx';
import './assets/style/Style.css';

const nav = [
  { key: 'overview', label: 'Overview', icon: 'overview' },
  { key: 'inventory', label: 'Inventory', icon: 'inventory' },
  { key: 'customers', label: 'Customers & credit', icon: 'customers' },
  { key: 'activity', label: 'Transactions', icon: 'activity' },
  { key: 'reports', label: 'Reports', icon: 'reports' }
];
const copy = {
  overview: ['Overview', 'Your shop’s pulse, all in one place.'],
  inventory: ['Inventory', 'Everything on your shelves, always up to date.'],
  customers: ['Customers & credit', 'Know who owes what, without the notebook.'],
  activity: ['Transactions', 'Every sale, payment, and stock movement.'],
  reports: ['Reports', 'Clear numbers for smarter decisions.']
};
export default function App() {
  const [view, setView] = useState('overview');
  const [data, setData] = useState({ dashboard: null, products: [], customers: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const refresh = async () => {
    try {
      const [dashboard, products, customers, transactions] = await Promise.all([api.dashboard(), api.products(), api.customers(), api.transactions()]);
      setData({ dashboard, products, customers, transactions }); setError('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);
  async function submit(action) {
    try { await action(); setModal(null); await refresh(); toast.success('Saved successfully'); return true; }
    catch (err) { toast.error(err.message); return false; }
  }
  function go(next) { setView(next); setMobileOpen(false); }
  const alerts = data.dashboard?.lowStock?.length || 0;
  return <div className="app-shell">
    <aside className={'sidebar ' + (mobileOpen ? 'open' : '')}>
      <div className="brand"><span className="brand-icon">C<span>·</span></span><span>CreditStock<small>SHOP OPERATIONS, SIMPLIFIED</small></span><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><Icon name="close" /></button></div>
      <div className="shop-switch"><div className="shop-avatar">CS</div><div><strong>My shop</strong><small>Business workspace</small></div><span className="switch-chevron">⌄</span></div>
      <span className="side-label">WORKSPACE</span>
      <nav aria-label="Main navigation">{nav.map(item => <button key={item.key} className={'nav-item ' + (view === item.key ? 'active' : '')} onClick={() => go(item.key)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.key === 'inventory' && alerts > 0 && <b className="nav-count">{alerts}</b>}</button>)}</nav>
      <div className="side-help"><span className="help-spark">✦</span><strong>Keep your shop moving</strong><p>Record a sale in seconds and stay ahead of every balance.</p><button onClick={() => setModal({ type: 'sale' })}>New sale <Icon name="arrow" size={15} /></button></div>
      <div className="side-footer"><span className="online-dot"></span> CreditStock workspace <span className="version">v1.0</span></div>
    </aside>
    {mobileOpen && <button className="mobile-shade" onClick={() => setMobileOpen(false)} aria-label="Close menu"></button>}
    <main className="main">
      <header className="topbar"><div className="topbar-left"><button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Icon name="menu" /></button><div><span className="eyebrow">CREDITSTOCK / {view.toUpperCase()}</span><h1>{copy[view][0]}</h1><p>{copy[view][1]}</p></div></div><div className="top-actions"><span className="date-chip"><Icon name="calendar" size={15} />{new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span><button className="alert-button" onClick={() => go('inventory')} title="Low-stock alerts" aria-label={alerts + ' low-stock alerts'}><Icon name="bell" size={19} />{alerts > 0 && <span>{alerts}</span>}</button><button className="btn primary sale-button" onClick={() => setModal({ type: 'sale' })}><Icon name="plus" size={17} /> New sale</button></div></header>
      {error ? <div className="connection-state"><span className="connection-icon"><Icon name="warning" size={27}/></span><h2>We can’t connect to your shop data</h2><p>{error}. Check that MongoDB and the backend are running, then try again.</p><button className="btn primary" onClick={refresh}>Try again</button></div> : loading ? <div className="loading-grid"><div/><div/><div/><div/></div> : <>
        {view === 'overview' && <Overview data={data} setView={go} open={setModal} />}
        {view === 'inventory' && <Inventory products={data.products} open={setModal} />}
        {view === 'customers' && <Customers customers={data.customers} open={setModal} />}
        {view === 'activity' && <Activity transactions={data.transactions} />}
        {view === 'reports' && <Reports data={data} />}
      </>}
      <footer className="main-footer"><span>© {new Date().getFullYear()} CreditStock</span><span>Made for the everyday business of your shop.</span></footer>
    </main>
    {modal && <Modal modal={modal} data={data} close={() => setModal(null)} submit={submit} />}
    <Toaster position="bottom-right" richColors />
  </div>;
}
