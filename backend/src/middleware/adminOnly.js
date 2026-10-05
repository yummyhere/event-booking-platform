export function adminOnly(request, response, next) {
  if (request.user?.role !== 'admin') {
    return response.status(403).json({ success: false, message: 'Access denied. Administrator privileges are required.' });
  }
  return next();
}