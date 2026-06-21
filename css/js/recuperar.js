document.addEventListener('DOMContentLoaded', function () {
  const recuperarForm = document.getElementById('recuperarForm');

  recuperarForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const correo = document.getElementById('correo').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmarPassword = document.getElementById('confirmarPassword').value;

    if (!correo || !password || !confirmarPassword) {
      alert('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 8) {
      alert('La contrasena debe tener minimo 8 caracteres.');
      return;
    }

    if (password !== confirmarPassword) {
      alert('Las contrasenas no coinciden.');
      return;
    }

    try {
      const resultado = await API.resetPassword(correo, password);
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
