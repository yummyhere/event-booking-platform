import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.data)).catch(() => setStats(null));
  }, []);

  if (!stats) return null;
  const items = [
    ['Events', stats.total_events],
    ['Bookings', stats.total_bookings],
    ['Members', stats.total_users],
    ['Confirmed revenue', `$${Number(stats.total_revenue).toFixed(2)}`]
  ];
  return <section className="admin-stats" aria-label="Platform statistics">{items.map(([label, value]) => (
    <article className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></article>
  ))}</section>;
}