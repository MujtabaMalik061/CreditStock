import Session from '../models/session.model.js';
import { cookieName, cookieOptions, hashToken } from '../utils/session.js';
import { asyncRoute } from '../utils/http.js';
export const requireAuth = asyncRoute(async (req, res, next) => {
  const token = req.cookies[cookieName];
  const session = typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
    ? await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).populate('user') : null;
  if (!session?.user) {
    res.clearCookie(cookieName, cookieOptions);
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }
  req.user = session.user;
  req.owner = session.user._id;
  next();
});
