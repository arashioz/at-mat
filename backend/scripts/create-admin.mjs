/**
 * Create or update an admin user directly in MongoDB.
 * Run inside the backend container:
 *   docker compose -p atmat -f docker-compose.yml exec backend node scripts/create-admin.mjs
 *
 * Credentials come from environment variables (never hardcode them):
 *   ADMIN_EMAIL, ADMIN_PASSWORD (required)
 *   ADMIN_FULL_NAME (optional), ADMIN_ROLE (optional: admin | super_admin, default super_admin)
 *   MONGO_URI (required; set by compose inside the container)
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const SALT_ROUNDS = 10;
const ALLOWED_ROLES = ['admin', 'super_admin'];

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'System Admin';
const role = process.env.ADMIN_ROLE?.trim() || 'super_admin';
const mongoUri = process.env.MONGO_URI;

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters.');
  process.exit(1);
}
if (!ALLOWED_ROLES.includes(role)) {
  console.error(`ADMIN_ROLE must be one of: ${ALLOWED_ROLES.join(', ')}`);
  process.exit(1);
}
if (!mongoUri) {
  console.error('MONGO_URI must be set.');
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  const users = mongoose.connection.db.collection('users');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await users.updateOne(
    { email },
    {
      $set: { fullName, passwordHash, role, isActive: true, updatedAt: new Date() },
      $setOnInsert: { email, createdAt: new Date() },
    },
    { upsert: true },
  );

  if (result.upsertedCount === 1) {
    console.log(`Admin created: ${email} (role: ${role})`);
  } else {
    console.log(`Admin updated: ${email} (role: ${role}), password reset.`);
  }
} catch (error) {
  console.error('Failed to create admin:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
