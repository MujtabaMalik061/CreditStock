export const money = value => 'Rs ' + Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });
export const date = value => new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
