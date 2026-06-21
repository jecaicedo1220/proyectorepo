require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const correo = String(process.argv[2] || '').trim().toLowerCase();
const passwordPlano = String(process.argv[3] || '');

async function main() {
  if (!correo || !passwordPlano) {
    throw new Error('Uso: node scripts/setAdmin.js correo@ejemplo.com contrasena');
  }

  if (passwordPlano.length < 8 || passwordPlano.length > 72) {
    throw new Error('La contrasena debe tener entre 8 y 72 caracteres');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('Falta MONGODB_URI en .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const password = await bcrypt.hash(passwordPlano, 10);
  const usuario = await User.findOneAndUpdate(
    { correo },
    {
      $set: {
        nombre: 'Administrador JellySpa',
        correo,
        password,
        role: 'admin',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Administrador listo: ${usuario.correo}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
