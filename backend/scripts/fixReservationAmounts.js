require('dotenv').config();
const mongoose = require('mongoose');
const Reserva = require('../models/Reserva');
const { obtenerServicio } = require('../config/services');

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Falta MONGODB_URI en .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const reservas = await Reserva.find({
    $or: [
      { monto: { $exists: false } },
      { monto: null },
      { monto: { $lte: 0 } },
    ],
  });

  let actualizadas = 0;
  for (const reserva of reservas) {
    const servicio = obtenerServicio(reserva.servicio);
    if (!servicio) continue;

    reserva.monto = servicio.precio;
    await reserva.save();
    actualizadas += 1;
  }

  console.log(`Reservas actualizadas: ${actualizadas}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
