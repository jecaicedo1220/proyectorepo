document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');

  if (API.getToken()) {
    const usuario = API.getUser();
    window.location = usuario?.esAdmin ? 'admin.html' : 'reservas.html';
    return;
  }

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const correo = document.getElementById('correo').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    try {
      const resultado = await API.login(correo, password);
      if (resultado.error) {
        alert('Error: ' + resultado.error);
      } else {
        alert('Bienvenido ' + resultado.usuario.nombre);
        window.location = resultado.usuario.esAdmin ? 'admin.html' : 'reservas.html';
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });
});
