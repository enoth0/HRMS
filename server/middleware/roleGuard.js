/**
 * Role-based access control middleware factory.
 * @param {string[]} allowedRoles - Array of roles permitted to access the route.
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/admin-only', auth, roleGuard(['admin']), handler)
 */
export const roleGuard = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
    });
  }
  next();
};
