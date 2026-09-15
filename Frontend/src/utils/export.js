export function downloadCsv(filename, headers, rows) {
  const cell = value => {
    const raw = String(value ?? '');
    const safe = /^[=+\-@]/.test(raw) ? "'" + raw : raw;
    return '"' + safe.replaceAll('"', '""') + '"';
  };
  const csv = [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function printReceipt(sale) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const windowRef = window.open('', '_blank', 'width=480,height=650');
  if (!windowRef) return false;
  const due = Math.max(0, sale.total - sale.paid);
  windowRef.document.write('<!doctype html><html><head><title>CreditStock receipt</title><style>body{font:14px Arial;padding:30px;color:#1b2430}.brand{font-size:24px;font-weight:800}.line{display:flex;justify-content:space-between;margin:12px 0}.muted{color:#777}.rule{border-top:1px dashed #aaa;margin:22px 0}.total{font-weight:800;font-size:18px}</style></head><body><div class="brand">CreditStock</div><p class="muted">Sale receipt · ' + escape(new Date(sale.createdAt).toLocaleString()) + '</p><div class="rule"></div><div class="line"><span>' + escape(sale.product?.name || 'Product') + ' × ' + escape(sale.quantity) + '</span><strong>Rs ' + escape(sale.total) + '</strong></div><div class="rule"></div><div class="line total"><span>Total</span><span>Rs ' + escape(sale.total) + '</span></div><div class="line"><span>Paid</span><span>Rs ' + escape(sale.paid) + '</span></div><div class="line"><span>Credit due</span><span>Rs ' + escape(due) + '</span></div><p>Customer: ' + escape(sale.customer?.name || 'Walk-in') + '</p><div class="rule"></div><p class="muted">Thank you for shopping with us.</p></body></html>');
  windowRef.document.close(); windowRef.focus(); windowRef.print(); return true;
}

export function openCreditReminder(customer) {
  let phone = String(customer.phone || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '92' + phone.slice(1);
  if (phone.length < 10) return false;
  const message = 'Hello ' + customer.name + ', this is a friendly reminder from CreditStock. Your outstanding shop balance is Rs ' + Number(customer.balance || 0).toLocaleString('en-PK') + '. Please let us know when you can make a payment. Thank you!';
  return !!window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
}
