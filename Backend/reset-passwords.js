const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threat-website';

async function resetPasswords() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);

  const res1 = await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@phishguard.com' },
    { $set: { password: adminPass } }
  );
  console.log('Updated admin@phishguard.com:', res1.modifiedCount);

  const res2 = await mongoose.connection.db.collection('users').updateOne(
    { email: 'user@phishguard.com' },
    { $set: { password: userPass } }
  );
  console.log('Updated user@phishguard.com:', res2.modifiedCount);

  const res3 = await mongoose.connection.db.collection('users').updateOne(
    { email: 'rahul.issar09@gmail.com' },
    { $set: { password: userPass } }
  );
  console.log('Updated rahul.issar09@gmail.com:', res3.modifiedCount);

  await mongoose.disconnect();
  console.log('✅ Passwords reset successfully!');
}

resetPasswords().catch(console.error);
