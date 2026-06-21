# JellySpa - Backend Node.js + Express + MongoDB

## Requisitos

- Node.js 14 o superior
- MongoDB Community local o una URI de MongoDB Atlas

## Configuracion

Crea `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jellyspa
JWT_SECRET=una_clave_segura
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_EMAIL=admin@jellyspa.com
```

`ADMIN_EMAIL` ya no convierte a nadie en admin al registrarse. Solo sirve como valor por defecto para el script de promocion.

## Ejecutar

```bash
cd backend
npm install
npm start
```

Abre el frontend con un servidor local desde la raiz del proyecto:

```bash
python -m http.server 3000
```

Luego entra a:

```text
http://localhost:3000/Index.html
```

## Crear un administrador

1. Registra el usuario desde `registro.html`.
2. Promuevelo desde consola:

```bash
cd backend
npm run promote-admin -- admin@jellyspa.com
```

Tambien puedes omitir el correo si `ADMIN_EMAIL` esta configurado:

```bash
npm run promote-admin
```

## API principal

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesion
- `POST /api/reservas` - Crear reserva con token
- `GET /api/reservas` - Obtener mis reservas
- `PATCH /api/reservas/:id/pagar` - Enviar pago para verificacion
- `DELETE /api/reservas/:id` - Cancelar mi reserva
- `GET /api/admin/reservas` - Ver todas las reservas como admin
- `PATCH /api/admin/reservas/:id/confirmar` - Confirmar cita como admin
- `PATCH /api/admin/reservas/:id/confirmar-pago` - Confirmar pago como admin
- `POST /api/contacto` - Enviar mensaje de contacto

## Notas de seguridad aplicadas

- El rol admin se guarda en MongoDB (`role: "admin"`), no se concede por email al registrarse.
- El cliente no puede marcar reservas como pagadas; solo solicita verificacion.
- El admin confirma el pago desde el panel.
- Los servicios y precios se validan en el backend.
- CORS usa `FRONTEND_ORIGINS`.
- Hay validacion de campos y limites basicos de solicitudes.
- El frontend escapa datos de reservas antes de renderizarlos.
