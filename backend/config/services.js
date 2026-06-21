const servicios = [
  { nombre: 'Manicura clasica', precio: 30000 },
  { nombre: 'Manicura en gel', precio: 60000 },
  { nombre: 'Manicura y pedicura', precio: 70000 },
  { nombre: 'Unas acrilicas', precio: 100000 },
  { nombre: 'Diseno Personalizado', precio: 12000 },
];

const normalizarServicio = (valor = '') =>
  String(valor)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const serviciosPorClave = new Map(
  servicios.map((servicio) => [normalizarServicio(servicio.nombre), servicio])
);

const obtenerServicio = (nombre) => serviciosPorClave.get(normalizarServicio(nombre));

module.exports = {
  servicios,
  obtenerServicio,
  normalizarServicio,
};
