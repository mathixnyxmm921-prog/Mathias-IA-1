const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messagesContainer = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChat");
const chatHistory = document.getElementById("chatHistory");

const STORAGE_KEY = "mathias_chats";

const USER_NAME = "Collazos";

let chats = cargarChats();
let activeChatId = chats.length ? chats[0].id : null;
let esperandoRespuesta = false;

// CARGAR HISTORIAL
function cargarChats() {
    try {
        const guardados = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (Array.isArray(guardados)) {
            return guardados.filter(chat =>
                chat &&
                typeof chat.id === "string" &&
                Array.isArray(chat.messages)
            );
        }
    } catch (error) {
        console.error("Error cargando chats:", error);
    }

    return [];
}

// GUARDAR HISTORIAL
function guardarChats() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

// OBTENER CHAT ACTIVO
function obtenerChatActivo() {
    return chats.find(chat => chat.id === activeChatId);
}

// CREAR CHAT
function crearChat() {
    const nuevoChat = {
        id: crypto.randomUUID(),
        title: "Nuevo chat",
        messages: [],
        updatedAt: Date.now()
    };

    chats.unshift(nuevoChat);
    activeChatId = nuevoChat.id;

    guardarChats();
    mostrarTodo();

    messageInput.focus();
}

// GENERAR TÍTULO
function generarTitulo(texto) {
    const titulo = texto.trim().replace(/\s+/g, " ");

    return titulo.length > 30
        ? titulo.slice(0, 30) + "..."
        : titulo;
}

// MOSTRAR HISTORIAL
function mostrarHistorial() {
    chatHistory.replaceChildren();

    chats.forEach(chat => {
        const fila = document.createElement("div");
        fila.className = "history-item";

        if (chat.id === activeChatId) {
            fila.classList.add("active");
        }

        const titulo = document.createElement("button");
        titulo.className = "history-title";
        titulo.type = "button";
        titulo.textContent = chat.title || "Nuevo chat";

        titulo.addEventListener("click", () => {
            if (esperandoRespuesta) return;

            activeChatId = chat.id;
            mostrarTodo();
        });

        const eliminar = document.createElement("button");
        eliminar.className = "delete-chat";
        eliminar.type = "button";
        eliminar.textContent = "×";
        eliminar.title = "Eliminar conversación";

        eliminar.addEventListener("click", evento => {
            evento.stopPropagation();

            chats = chats.filter(item => item.id !== chat.id);

            if (activeChatId === chat.id) {
                activeChatId = chats.length ? chats[0].id : null;
            }

            guardarChats();
            mostrarTodo();
        });

        fila.append(titulo, eliminar);
        chatHistory.appendChild(fila);
    });
}

// CREAR MENSAJE VISUAL
function crearMensajeVisual(rol, contenido) {
    const fila = document.createElement("div");
    fila.className = `message-row ${rol}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";

    avatar.textContent = rol === "user" ? "C" : "M";

    const contenidoMensaje = document.createElement("div");
    contenidoMensaje.className = "message-content";

    const nombre = document.createElement("div");
    nombre.className = "message-name";

    nombre.textContent = rol === "user" ? USER_NAME : "Mathias";

    const burbuja = document.createElement("div");
    burbuja.className = "message-bubble";

    // textContent evita interpretar mensajes como HTML.
    burbuja.textContent = contenido;

    contenidoMensaje.append(nombre, burbuja);
    fila.append(avatar, contenidoMensaje);

    return fila;
}

// MOSTRAR MENSAJES
function mostrarMensajes() {
    messagesContainer.replaceChildren();

    const chat = obtenerChatActivo();

    if (!chat || chat.messages.length === 0) {
        const bienvenida = document.createElement("div");
        bienvenida.className = "welcome-screen";

        const logo = document.createElement("div");
        logo.className = "welcome-orb";
        logo.innerHTML = "<span>M</span>";

        const etiqueta = document.createElement("div");
        etiqueta.className = "welcome-eyebrow";
        etiqueta.textContent = "TU ASISTENTE PERSONAL";

        const titulo = document.createElement("h1");
        titulo.textContent = "Hola, Collazos.";

        const descripcion = document.createElement("p");
        descripcion.className = "welcome-description";
        descripcion.textContent =
            "¿Qué tienes en mente hoy? Estoy listo para ayudarte.";

        const sugerencias = document.createElement("div");
        sugerencias.className = "suggestions";

        const opciones = [
            {
                icono: "✦",
                titulo: "Conocer a Mathias",
                descripcion: "Descubre lo que puedo hacer",
                mensaje: "Hola Mathias, preséntate y dime qué puedes hacer."
            },
            {
                icono: "⌘",
                titulo: "Aprender programación",
                descripcion: "Practica y mejora tus habilidades",
                mensaje: "Ayúdame a aprender programación desde cero."
            },
            {
                icono: "↗",
                titulo: "Abrir una aplicación",
                descripcion: "Prueba los comandos de Mathias",
                mensaje: "Abre YouTube"
            }
        ];

        opciones.forEach(opcion => {
            const boton = document.createElement("button");
            boton.className = "suggestion";
            boton.type = "button";

            const icono = document.createElement("span");
            icono.className = "suggestion-icon";
            icono.textContent = opcion.icono;

            const textos = document.createElement("span");

            const tituloOpcion = document.createElement("strong");
            tituloOpcion.textContent = opcion.titulo;

            const descripcionOpcion = document.createElement("small");
            descripcionOpcion.textContent = opcion.descripcion;

            textos.append(tituloOpcion, descripcionOpcion);

            const flecha = document.createElement("span");
            flecha.className = "suggestion-arrow";
            flecha.textContent = "↗";

            boton.append(icono, textos, flecha);

            boton.addEventListener("click", () => {
                enviarMensaje(opcion.mensaje);
            });

            sugerencias.appendChild(boton);
        });

        bienvenida.append(
            logo,
            etiqueta,
            titulo,
            descripcion,
            sugerencias
        );

        messagesContainer.appendChild(bienvenida);
        return;
    }

    chat.messages.forEach(mensaje => {
        messagesContainer.appendChild(
            crearMensajeVisual(mensaje.role, mensaje.content)
        );
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// MOSTRAR TODO
function mostrarTodo() {
    mostrarHistorial();
    mostrarMensajes();
}

// AGREGAR MENSAJE AL HISTORIAL
function agregarMensaje(chat, role, content) {
    chat.messages.push({
        role,
        content
    });

    chat.updatedAt = Date.now();

    if (role === "user" && chat.messages.length === 1) {
        chat.title = generarTitulo(content);
    }

    guardarChats();

    chats.sort((a, b) =>
        (b.updatedAt || 0) - (a.updatedAt || 0)
    );

    mostrarTodo();
}

// INDICADOR DE ESPERA
function mostrarEstado(texto) {
    const fila = document.createElement("div");
    fila.className = "message-row assistant";
    fila.id = "mathias-loading";

    const contenido = document.createElement("div");
    contenido.className = "message-content";

    const burbuja = document.createElement("div");
    burbuja.className = "message-bubble";
    burbuja.textContent = texto;

    contenido.appendChild(burbuja);
    fila.appendChild(contenido);

    messagesContainer.appendChild(fila);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function quitarEstado() {
    document.getElementById("mathias-loading")?.remove();
}

// COMPROBAR COMANDOS DE WINDOWS
async function intentarAbrirAplicacion(texto) {
    const respuesta = await fetch("/api/accion", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            comando: texto
        })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "No pude ejecutar la acción.");
    }

    return datos;
}

// ENVIAR MENSAJE
async function enviarMensaje(texto) {
    const contenido = texto.trim();

    if (!contenido || esperandoRespuesta) return;

    if (!activeChatId || !obtenerChatActivo()) {
        const nuevoChat = {
            id: crypto.randomUUID(),
            title: "Nuevo chat",
            messages: [],
            updatedAt: Date.now()
        };

        chats.unshift(nuevoChat);
        activeChatId = nuevoChat.id;
    }

    const chat = obtenerChatActivo();

    agregarMensaje(chat, "user", contenido);

    messageInput.value = "";
    messageInput.style.height = "auto";

    esperandoRespuesta = true;
    sendButton.disabled = true;

    mostrarEstado("Mathias está pensando...");

    try {
        // Primero comprobamos si es una orden para Windows.
        const accion = await intentarAbrirAplicacion(contenido);

        if (accion.ejecutada) {
            quitarEstado();

            agregarMensaje(
                chat,
                "assistant",
                accion.respuesta
            );

            return;
        }

        // Si no es un comando, enviamos el mensaje a la IA.
        const respuesta = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mensajes: chat.messages
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error || "No pude comunicarme con Mathias."
            );
        }

        quitarEstado();

        agregarMensaje(
            chat,
            "assistant",
            datos.respuesta || "No recibí una respuesta."
        );

    } catch (error) {
        quitarEstado();

        agregarMensaje(
            chat,
            "assistant",
            "Ocurrió un error: " + error.message
        );

        console.error("Error:", error);

    } finally {
        esperandoRespuesta = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// FORMULARIO
chatForm.addEventListener("submit", evento => {
    evento.preventDefault();
    enviarMensaje(messageInput.value);
});

// NUEVO CHAT
newChatButton.addEventListener("click", () => {
    if (esperandoRespuesta) return;
    crearChat();
});

// ENTER PARA ENVIAR
messageInput.addEventListener("keydown", evento => {
    if (evento.key === "Enter" && !evento.shiftKey) {
        evento.preventDefault();
        chatForm.requestSubmit();
    }
});

// ALTURA AUTOMÁTICA DEL CUADRO DE TEXTO
messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";

    messageInput.style.height =
        Math.min(messageInput.scrollHeight, 160) + "px";
});

// ORDENAR HISTORIAL
chats.sort((a, b) =>
    (b.updatedAt || 0) - (a.updatedAt || 0)
);

// RESTAURAR CHAT
if (!activeChatId || !obtenerChatActivo()) {
    activeChatId = chats.length ? chats[0].id : null;
}

mostrarTodo();