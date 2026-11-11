const formulario = document.getElementById('formlogin');

formulario.addEventListener('submit', async function(e) {
    e.preventDefault();

    const boton = formulario.querySelector('button[type="submit"]');
    const mensaje = document.getElementById('mensajeLogin');

    boton.disabled = true; 

    try{
        const respuesta = await fetch(formulario.action,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(new FormData(formulario).entries()),
             ),
        });

        const resultado = await respuesta.json();

        if(!resultado.sucess){
            mensaje.textContent = "no fue posible iniciar sesion, por favor verifica tus credenciales";
            boton.disabled = false;
            return; 
        }
        
        localStorage.setItem('logueado', 'true');
        localStorage.setItem('rol', resultado.rol);
        localStorage.setItem('nombre', resultado.nombre);


        window.location.href = 'dashboard.html';

    }catch(error){
        console.error('Error al iniciar sesión:', error);
        mensaje.textContent = "Error al iniciar sesión. Por favor, inténtalo de nuevo.";
    }finally {
        boton.disabled = false;
    }
});
