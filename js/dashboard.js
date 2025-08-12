const SUPABASE_URL = "https://pdcmeyfvgfabgjxrkynu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY21leWZ2Z2ZhYmdqeHJreW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUwMTUsImV4cCI6MjA3MDA4MTAxNX0.fh_kJN-Im2cjenMOMjg-aZQB4Dh3SwKKFgteGW3OIfI";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function agregarEstudiante() {
    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const clase = document.getElementById("clase").value;

    const {
        data: { user },
        error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
        Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: 'No estás autenticado.',
        });
        return;
    }

    const { error } = await client.from("estudiantes").insert({
        nombre,
        correo,
        clase,
        user_id: user.id,
    });

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error al agregar',
            text: error.message,
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: 'Estudiante agregado',
            text: 'El estudiante ha sido registrado con éxito.',
        });
        document.getElementById("nombre").value = "";
        document.getElementById("correo").value = "";
        document.getElementById("clase").value = "";
        cargarEstudiantes();
    }
}

async function cargarEstudiantes() {
    const {
        data: { user },
        error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
        window.location.href = "index.html";
        return;
    }
    
    const { data, error } = await client
        .from("estudiantes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar',
            text: 'Error al cargar estudiantes: ' + error.message,
        });
        return;
    }

    const lista = document.getElementById("lista-estudiantes");
    lista.innerHTML = "";

    data.forEach((est) => {
        const item = document.createElement("li");
        item.innerHTML = `
            <span>${est.nombre} (${est.correo}, ${est.clase})</span>
            <button onclick="editarEstudiantePrompt('${est.id}', '${est.nombre}', '${est.correo}', '${est.clase}')">Editar</button>
            <button onclick="eliminarEstudiante('${est.id}')" class="cerrar-btn">Eliminar</button>
        `;
        lista.appendChild(item);
    });
}

async function editarEstudiantePrompt(id, nombreActual, correoActual, claseActual) {
    const { value: formValues } = await Swal.fire({
        title: 'Editar estudiante',
        html:
            `<input id="swal-input1" class="swal2-input" placeholder="Nombre" value="${nombreActual}">` +
            `<input id="swal-input2" class="swal2-input" placeholder="Correo" value="${correoActual}">` +
            `<input id="swal-input3" class="swal2-input" placeholder="Clase" value="${claseActual}">`,
        focusConfirm: false,
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value,
                document.getElementById('swal-input3').value
            ]
        }
    });

    if (formValues) {
        const [nuevoNombre, nuevoCorreo, nuevaClase] = formValues;
        if (nuevoNombre && nuevoCorreo && nuevaClase) {
            await editarEstudiante(id, nuevoNombre, nuevoCorreo, nuevaClase);
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Debes rellenar todos los campos.',
            });
        }
    }
}

async function editarEstudiante(id, nuevoNombre, nuevoCorreo, nuevaClase) {
    const { error } = await client
        .from("estudiantes")
        .update({ nombre: nuevoNombre, correo: nuevoCorreo, clase: nuevaClase })
        .eq("id", id);

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error al editar',
            text: error.message,
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: '¡Editado!',
            text: 'El estudiante ha sido editado con éxito, gracias.',
        });
        cargarEstudiantes();
    }
}

async function eliminarEstudiante(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esto!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, ¡eliminar!',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const { error } = await client
            .from("estudiantes")
            .delete()
            .eq("id", id);

        if (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al eliminar',
                text: error.message,
            });
        } else {
            Swal.fire(
                '¡Eliminado!',
                'El estudiante ha sido eliminado.',
                'success'
            );
            cargarEstudiantes();
        }
    }
}

async function subirArchivo() {
    const archivoInput = document.getElementById("archivo");
    const archivo = archivoInput.files[0];

    if (!archivo) {
        Swal.fire({
            icon: 'warning',
            title: 'Archivo no seleccionado',
            text: 'Selecciona un archivo primero.',
        });
        return;
    }

    const {
        data: { user },
        error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
        Swal.fire({
            icon: 'error',
            title: 'Error de sesión',
            text: 'Sesión no válida.',
        });
        return;
    }

    const nombreRuta = `${user.id}/${archivo.name}`;
    const { data, error } = await client.storage
        .from("tareas")
        .upload(nombreRuta, archivo, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error al subir',
            text: error.message,
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: '¡Subido!',
            text: 'Archivo subido correctamente.',
        });
        listarArchivos();
    }
}

async function listarArchivos() {
    const {
        data: { user },
        error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
        Swal.fire({
            icon: 'error',
            title: 'Error de sesión',
            text: 'Sesión no válida.',
        });
        return;
    }

    const { data, error } = await client.storage
        .from("tareas")
        .list(`${user.id}`, { limit: 20 });

    const lista = document.getElementById("lista-archivos");
    lista.innerHTML = "";

    if (error) {
        lista.innerHTML = "<li>Error al listar archivos</li>";
        return;
    }

    data.forEach(async (archivo) => {
        const { data: signedUrlData, error: signedUrlError } = await client.storage
            .from("tareas")
            .createSignedUrl(`${user.id}/${archivo.name}`, 60);

        if (signedUrlError) {
            console.error("Error al generar URL firmada:", signedUrlError.message);
            return;
        }

        const publicUrl = signedUrlData.signedUrl;

        const item = document.createElement("li");

        const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
        const esPDF = archivo.name.match(/\.pdf$/i);

        if (esImagen) {
            item.innerHTML = `
                <strong>${archivo.name}</strong><br>
                <a href="${publicUrl}" target="_blank">
                    <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
                </a>
            `;
        } else if (esPDF) {
            item.innerHTML = `
                <strong>${archivo.name}</strong><br>
                <a href="${publicUrl}" target="_blank">Ver PDF</a>
            `;
        } else {
            item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`;
        }
        lista.appendChild(item);
    });
}
listarArchivos();

async function cerrarSesion() {
    const { error } = await client.auth.signOut();

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error al cerrar sesión',
            text: error.message,
        });
    } else {
        localStorage.removeItem("token");
        Swal.fire({
            icon: 'success',
            title: 'Sesión cerrada',
            text: 'Has cerrado sesión correctamente.',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "index.html";
        });
    }
}