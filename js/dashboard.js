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
    alert("No estás autenticado.");
    return;
  }

  const { error } = await client.from("estudiantes").insert({
    nombre,
    correo,
    clase,
    user_id: user.id,
  });

  if (error) {
    alert("Error al agregar: " + error.message);
  } else {
    alert("Estudiante agregado");
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
    alert("No estás autenticado.");
    window.location.href = "index.html"; // Redirige al login si no hay usuario
    return;
  }
  
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .eq("user_id", user.id) // Filtra por el user_id para solo mostrar los del usuario logueado
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  data.forEach((est) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span>${est.nombre} (${est.clase})</span>
      <button onclick="editarEstudiantePrompt('${est.id}', '${est.nombre}', '${est.clase}')">Editar</button>
      <button onclick="eliminarEstudiante('${est.id}')" class="cerrar-btn">Eliminar</button>
    `;
    lista.appendChild(item);
  });
}

// --- NUEVAS FUNCIONES PARA EDITAR Y ELIMINAR ---

// Pide nuevos datos y llama a la función de edición
async function editarEstudiantePrompt(id, nombreActual, claseActual) {
    const nuevoNombre = prompt("Nuevo nombre:", nombreActual);
    const nuevaClase = prompt("Nueva clase:", claseActual);
    
    // Si el usuario cancela o no introduce datos, no hacemos nada
    if (nuevoNombre === null || nuevaClase === null) {
        return;
    }
    
    // Llamamos a la función principal de edición
    if (nuevoNombre !== "" && nuevaClase !== "") {
        await editarEstudiante(id, nuevoNombre, nuevaClase);
    }
}

// Función principal para editar un estudiante
async function editarEstudiante(id, nuevoNombre, nuevaClase) {
  const { data, error } = await client
    .from("estudiantes")
    .update({ nombre: nuevoNombre, clase: nuevaClase })
    .eq("id", id); // Busca el estudiante por su ID

  if (error) {
    alert("Error al editar: " + error.message);
  } else {
    alert("Estudiante editado con éxito.");
    cargarEstudiantes(); // Recarga la lista para ver los cambios
  }
}

// Función para eliminar un estudiante
async function eliminarEstudiante(id) {
  if (confirm("¿Estás seguro de que quieres eliminar a este estudiante?")) {
    const { error } = await client
      .from("estudiantes")
      .delete()
      .eq("id", id); // Busca el estudiante por su ID y lo elimina

    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      alert("Estudiante eliminado.");
      cargarEstudiantes(); // Recarga la lista
    }
  }
}

// --- RESTO DE TU CÓDIGO (SIN CAMBIOS) ---

cargarEstudiantes();

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    alert("Selecciona un archivo primero.");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
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
    alert("Error al subir: " + error.message);
  } else {
    alert("Archivo subido correctamente.");
    listarArchivos();
  }
}

async function listarArchivos() {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
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
    alert("Error al cerrar sesión: " + error.message);
  } else {
    localStorage.removeItem("token");
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}