import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/User.js';

const users = [
  {
    name: 'Admin User',
    email: 'admin@splitsync.com',
    password: 'password123',
    role: 'admin',
  },
  {
    name: 'Jane Member',
    email: 'jane@example.com',
    password: 'password123',
    role: 'member',
  },
];

const seed = async () => {
  try {
    await connectDB();
    await User.deleteMany({});
    await User.create(users);
    console.log('Seeded users:');
    users.forEach((u) =>
      console.log(`  ${u.email} / ${u.password} (${u.role})`)
    );
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
