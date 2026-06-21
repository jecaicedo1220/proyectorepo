require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const correo = String(process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();

async function main() {
  if (!correo) {
    throw new Error('Indica el correo: npm run promote-admin -- correo@ejemplo.com');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Falta MONGODB_URI en .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const usuario = await User.findOneAndUpdate(
    { correo },
    { role: 'admin' },
    { new: true }
  );

  if (!usuario) {
    throw new Error(`No existe un usuario registrado con el correo ${correo}`);
  }

  console.log(`Usuario promovido a admin: ${usuario.correo}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
