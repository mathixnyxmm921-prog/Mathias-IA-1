
import "dotenv/config";

import express from "express";
import OpenAI from "openai";
import { spawn } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const app = express();

// Render proporciona su propio puerto.
// En tu computadora utilizará el puerto 3000.
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

// ------------------------------
// OPENAI
// ------------------------------

if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: Falta OPENAI_API_KEY.");
    process.exit(1);
}

if (!process.env.OPENAI_MODEL) {
    console.error("ERROR: Falta OPENAI_MODEL.");
    process.exit(1);
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL;

// ------------------------------
// PERSONALIDAD DE MATHIAS
// ------------------------------

const instrucciones = `
Tu nombre es Mathias.

Eres el asistente personal del usuario.

Hablas español natural, amigable y preferiblemente colombiano.

Ayudas con:
- Programación.
- Tecnología.
- Roblox Studio y Lua.
- Minecraft.
- Videojuegos.
- Windows.
- Informática.
- Cualquier otro tema.

Explicas paso a paso cuando sea necesario.
Si el usuario es principiante, utilizas ejemplos sencillos.
Mantienes el contexto de la conversación.
No inventas información.
No afirmas haber realizado acciones que no has realizado.
`;

// ------------------------------
// PÁGINAS WEB
// ------------------------------

const paginas = {
    youtube: "https://www.youtube.com",
    google: "https://www.google.com",
    roblox: "https://www.roblox.com/home"
};

// ------------------------------
// FUNCIONES DE WINDOWS
// ------------------------------

// Estas funciones solamente funcionan
// cuando Mathias se ejecuta en Windows.

function ejecutarWindows(comando, argumentos = []) {
    return new Promise((resolve, reject) => {
        if (process.platform !== "win32") {
            return reject(
                new Error("Esta función solamente está disponible en Windows.")
            );
        }

        const proceso = spawn(comando, argumentos, {
            detached: true,
            stdio: "ignore",
            windowsHide: true
        });

        proceso.once("error", reject);

        proceso.once("spawn", () => {
            proceso.unref();
            resolve();
        });
    });
}

async function abrirPagina(url) {
    await ejecutarWindows("cmd.exe", [
        "/c",
        "start",
        "",
        url
    ]);
}

async function abrirVSCode() {
    await ejecutarWindows("cmd.exe", [
        "/c",
        "start",
        "",
        "code"
    ]);
}

async function abrirRobloxStudio() {
    await ejecutarWindows("cmd.exe", [
        "/c",
        "start",
        "",
        "roblox-studio:"
    ]);
}

// ------------------------------
// ROBLOX PLAYER
// ------------------------------

async function encontrarRobloxPlayer() {
    if (process.platform !== "win32") {
        throw new Error(
            "Roblox Player solo se puede abrir desde Windows."
        );
    }

    const carpeta = path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Roblox",
        "Versions"
    );

    const versiones = await readdir(carpeta, {
        withFileTypes: true
    });

    const candidatos = [];

    for (const version of versiones) {
        if (!version.isDirectory()) continue;

        const ejecutable = path.join(
            carpeta,
            version.name,
            "RobloxPlayerBeta.exe"
        );

        try {
            const informacion = await stat(ejecutable);

            if (informacion.isFile()) {
                candidatos.push({
                    ruta: ejecutable,
                    fecha: informacion.mtimeMs
                });
            }
        } catch {
            // No existe el ejecutable en esta versión.
        }
    }

    candidatos.sort((a, b) => b.fecha - a.fecha);

    return candidatos[0]?.ruta || null;
}

async function abrirRobloxPlayer() {
    const ejecutable = await encontrarRobloxPlayer();

    if (!ejecutable) {
        throw new Error(
            "No encontré Roblox Player instalado en esta computadora."
        );
    }

    const proceso = spawn(ejecutable, [], {
        detached: true,
        stdio: "ignore",
        windowsHide: false
    });

    proceso.unref();
}

// ------------------------------
// DETECTAR COMANDOS
// ------------------------------

function detectarComando(mensaje) {
    let texto = mensaje
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[¿?¡!.,]/g, "")
        .trim();

    texto = texto.replace(
        /^(mathias|matias)[, ]+/,
        ""
    );

    const prefijos = [
        "por favor abre ",
        "puedes abrir ",
        "quiero abrir ",
        "abre ",
        "abrir ",
        "inicia ",
        "iniciar ",
        "ejecuta ",
        "ejecutar ",
        "lanza ",
        "lanzar "
    ];

    for (const prefijo of prefijos) {
        if (texto.startsWith(prefijo)) {
            texto = texto.slice(prefijo.length).trim();
            break;
        }
    }

    const comandos = {
        "youtube": "youtube",
        "google": "google",
        "roblox": "roblox",
        "vscode": "vscode",
        "visual studio code": "vscode",
        "roblox studio": "roblox-studio",
        "roblox player": "roblox-player"
    };

    return comandos[texto] || null;
}

// ------------------------------
// EJECUTAR ACCIONES
// ------------------------------

async function ejecutarAccion(comando) {
    switch (comando) {
        case "youtube":
            await abrirPagina(paginas.youtube);
            break;

        case "google":
            await abrirPagina(paginas.google);
            break;

        case "roblox":
            await abrirPagina(paginas.roblox);
            break;

        case "vscode":
            await abrirVSCode();
            break;

        case "roblox-studio":
            await abrirRobloxStudio();
            break;

        case "roblox-player":
            await abrirRobloxPlayer();
            break;

        default:
            throw new Error("Comando no reconocido.");
    }
}

// ------------------------------
// API DE ACCIONES
// ------------------------------

app.post("/api/accion", async (req, res) => {
    try {
        const mensaje = req.body?.comando;

        if (
            typeof mensaje !== "string" ||
            !mensaje.trim()
        ) {
            return res.status(400).json({
                ejecutada: false,
                error: "No recibí ningún comando."
            });
        }

        const comando = detectarComando(mensaje);

        if (!comando) {
            return res.json({
                ejecutada: false
            });
        }

        await ejecutarAccion(comando);

        return res.json({
            ejecutada: true,
            respuesta: "Windows recibió la solicitud para iniciar la aplicación."
        });

    } catch (error) {
        console.error("Error al ejecutar acción:", error);

        return res.status(500).json({
            ejecutada: false,
            error: error.message || "No pude ejecutar esa acción."
        });
    }
});

// ------------------------------
// API DEL CHAT
// ------------------------------

app.post("/api/chat", async (req, res) => {
    try {
        const mensajes = req.body?.mensajes;

        if (
            !Array.isArray(mensajes) ||
            mensajes.length === 0
        ) {
            return res.status(400).json({
                error: "No recibí mensajes."
            });
        }

        const historial = mensajes
            .filter(mensaje =>
                mensaje &&
                (
                    mensaje.role === "user" ||
                    mensaje.role === "assistant"
                ) &&
                typeof mensaje.content === "string"
            )
            .slice(-30)
            .map(mensaje => ({
                role: mensaje.role,
                content: mensaje.content.slice(0, 12000)
            }));

        if (historial.length === 0) {
            return res.status(400).json({
                error: "El historial está vacío."
            });
        }

        const respuesta = await client.responses.create({
            model: MODEL,
            instructions: instrucciones,
            input: historial,
            max_output_tokens: 1500
        });

        return res.json({
            respuesta:
                respuesta.output_text ||
                "No pude generar una respuesta."
        });

    } catch (error) {
        console.error("Error de OpenAI:", error);

        return res.status(500).json({
            error: error.message ||
                "Ocurrió un error al hablar con Mathias."
        });
    }
});

// ------------------------------
// COMPROBAR SERVIDOR
// ------------------------------

app.get("/api/estado", (req, res) => {
    res.json({
        nombre: "Mathias IA",
        estado: "activo",
        modelo: MODEL
    });
});

// ------------------------------
// INICIAR SERVIDOR
// ------------------------------

app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("================================");
    console.log("          MATHIAS IA");
    console.log("================================");
    console.log(`Puerto: ${PORT}`);
    console.log(`Modelo: ${MODEL}`);
    console.log("Servidor iniciado correctamente.");
    console.log("================================");
    console.log("");
});
