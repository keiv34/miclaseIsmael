const SUPABASE_URL = "https://pdcmeyfvgfabgjxrkynu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY21leWZ2Z2ZhYmdqeHJreW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUwMTUsImV4cCI6MjA3MDA4MTAxNX0.fh_kJN-Im2cjenMOMjg-aZQB4Dh3SwKKFgteGW3OIfI";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function toggleForms() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    loginForm.style.display = loginForm.style.display === "none" ? "block" : "none";
    registerForm.style.display = registerForm.style.display === "none" ? "block" : "none";
}

async function register() {
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    const { data, error } = await client.auth.signUp({
        email,
        password,
    });

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de registro',
            text: error.message,
        });
    } else {
        Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Por favor, revisa tu correo para confirmar tu cuenta.',
        });
        toggleForms();
    }
}

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error al iniciar sesión',
            text: error.message,
        });
    } else {
        localStorage.setItem("token", data.session.access_token);
        Swal.fire({
            icon: 'success',
            title: '¡Sesión iniciada!',
            text: 'Redirigiendo al panel de estudiantes.',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "dashboard.html";
        });
    }
}