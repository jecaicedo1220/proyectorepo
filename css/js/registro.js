document.addEventListener('DOMContentLoaded', function () {
  const registroForm = document.getElementById('registroForm');

  registroForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!nombre || !correo || !password) {
      alert('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 8) {
      alert('La contrasena debe tener minimo 8 caracteres.');
      return;
    }

    try {
      const resultado = await API.register(nombre, correo, password);
      if (resultado.error) {
        alert('Error: ' + resultado.error);
      } else {
        alert(resultado.mensaje);
        window.location = 'login.html';
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });
});
