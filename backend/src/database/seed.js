import bcrypt from 'bcryptjs';
import { closeDatabase, get, initializeDatabase, run } from '../config/db.js';

const events = [
  { title: 'Sunday Table: A Neighborhood Supper', description: 'A long table, seasonal dishes, and new friends. Come hungry and leave with a few new names in your phone.', category: 'Food & drink', location: 'Juniper House, Brooklyn', days: 4, hour: 18, price: 24, seats: 28, image: 'photo-1511795409834-ef04bbd61622' },
  { title: 'Make Something: Open Clay Studio', description: 'An easygoing afternoon learning the basics of hand-building with clay. All materials and a little tea are included.', category: 'Arts & culture', location: 'Common Ground Studio, Queens', days: 7, hour: 14, price: 18, seats: 16, image: 'photo-1565193298595-6c2d5a35c3a9' },
  { title: 'The Riverside Run Club', description: 'A welcoming five-kilometer loop with a steady pace, good company, and coffee waiting at the finish.', category: 'Outdoors', location: 'Pier 5, Brooklyn Bridge Park', days: 2, hour: 9, price: 0, seats: 40, image: 'photo-1530549387789-4c1017266635' },
  { title: 'Listening Room: Songs & Stories', description: 'Local musicians share the songs behind the songs in an intimate, low-key listening room.', category: 'Music', location: 'The Lantern Room, Manhattan', days: 12, hour: 19, price: 16, seats: 35, image: 'photo-1516280440614-37939bbacd81' },
  { title: 'A Little More Plant, Please', description: 'A hands-on introduction to keeping houseplants happy, from choosing your first pot to propagating cuttings.', category: 'Learning', location: 'Leaf & Letter, Brooklyn', days: 9, hour: 11, price: 12, seats: 18, image: 'photo-1487530811176-3780de880c2d' },
  { title: 'Tiny Tech Talks: Build for Good', description: 'Three short talks from people using technology to make everyday community life a little better.', category: 'Technology', location: 'Civic Hall, Manhattan', days: 15, hour: 18, price: 10, seats: 55, image: 'photo-1517245386807-bb43f82c33c4' },
  { title: 'Saturday Sketch Walk', description: 'See your familiar streets differently. Bring a notebook, borrow a pencil, and draw alongside local artists.', category: 'Arts & culture', location: 'Washington Square Park, Manhattan', days: 6, hour: 10, price: 8, seats: 22, image: 'photo-1513364776144-60967b0f800f' },
  { title: 'Slow Morning: Breath & Stretch', description: 'A gentle outdoor reset with guided movement, breathing, and a shared pot of tea. All levels welcome.', category: 'Wellness', location: 'Prospect Park Boathouse, Brooklyn', days: 10, hour: 8, price: 14, seats: 20, image: 'photo-1506126613408-eca07ce68773' },
  { title: 'Pasta from Scratch, Together', description: 'Roll up your sleeves and learn fresh pasta from a neighborhood chef. We will cook, eat, and clean up together.', category: 'Food & drink', location: 'Casa Verde Kitchen, Queens', days: 18, hour: 17, price: 38, seats: 14, image: 'photo-1551183053-bf91a1d81141' },
  { title: 'The People Who Keep Us Growing', description: 'A community conversation about urban gardens, shared land, and making room for nature in the city.', category: 'Outdoors', location: 'Greenpoint Community Garden, Brooklyn', days: -5, hour: 13, price: 0, seats: 30, image: 'photo-1416879595882-3373a0480b5b' },
  { title: 'Sunday Matinee: Short Film Club', description: 'An afternoon of inventive short films followed by a relaxed conversation with local filmmakers.', category: 'Arts & culture', location: 'Nitehawk Cinema, Brooklyn', days: -12, hour: 15, price: 13, seats: 48, image: 'photo-1489599849927-2ee91cede3ba' },
  { title: 'Neighborhood Sound Bath', description: 'A quiet hour of restorative sound and stillness in a sunlit community room. Bring a mat if you have one.', category: 'Wellness', location: 'Still House, Manhattan', days: -21, hour: 10, price: 20, seats: 0, image: 'photo-1518837695005-2083093ee35b' }
];

function eventDate(dayOffset, hour) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

try {
  await initializeDatabase();
  const demo = await get('SELECT id FROM users WHERE email = ?', ['demo@gather.local']);
  if (!demo) {
    const passwordHash = await bcrypt.hash('GatherDemo123!', 12);
    await run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', ['Jamie Rivera', 'demo@gather.local', passwordHash]);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const admin = await get('SELECT id, role FROM users WHERE email = ?', [adminEmail]);
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
      'Gather Admin', adminEmail, passwordHash, 'admin'
    ]);
  } else if (admin.role !== 'admin') {
    await run("UPDATE users SET role = 'admin' WHERE id = ?", [admin.id]);
  }

  const existing = await get('SELECT COUNT(*) AS count FROM events');
  if (existing.count === 0) {
    for (const event of events) {
      await run(`INSERT INTO events
        (title, description, category, location, event_date, price, total_seats, available_seats, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        event.title, event.description, event.category, event.location, eventDate(event.days, event.hour),
        event.price, Math.max(event.seats, 1), event.seats,
        `https://images.unsplash.com/${event.image}?auto=format&fit=crop&w=900&q=85`
      ]);
    }
  }
  console.log(`Seed complete. ${events.length} sample events are available.`);
  console.log('Demo login: demo@gather.local / GatherDemo123!');
  console.log(`Admin account ensured for ${adminEmail} (existing account password is preserved).`);
} catch (error) {
  console.error('Could not seed the database:', error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}