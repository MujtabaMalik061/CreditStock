export const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const fail = (res, message, status = 400) => res.status(status).json({ message });
export const validMoney = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
export const validCount = value => Number.isInteger(value) && value >= 0;
