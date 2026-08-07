/* ==========================================================================
   GUIANAUTA - Sistema Integrado: Google Sheets + Lógica QR + IA Real + Pasaporte + Mapas + Galería + Modal
   ========================================================================== */

// 1. CONFIGURACIÓN
const SHEET_ID = '1NxsIhqz1W522b_TA51_H4ZP4Ds9KeYtKwI3FkJkTMdU'; 
// REEMPLAZA LA SIGUIENTE LÍNEA CON TU NUEVA API KEY RECIÉN CREADA EN OPENAI:
const OPENAI_API_KEY = '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'; 

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Lista oficial de IDs de monumentos
const RUTA_MONUMENTOS = ['plaza', 'ucamara', 'parroquia', 'sapi', 'bolognesi', 'playa', 'mistica', 'zaragoza'];

// Datos completos del pasaporte para los 8 monumentos
const DATOS_PASAPORTE = {
    'plaza': { nombre: 'Plaza Centenario', imagen: 'https://lh3.googleusercontent.com/d/1tbEt7Gnxqd5bla0dm-fTqsLE6KZ-LTSj' },
    'ucamara': { nombre: 'Teatro Ucamara', imagen: 'https://lh3.googleusercontent.com/d/14wggFFfMMS912zT53ZI4Liz1bEIwXt-X' },
    'parroquia': { nombre: 'Parroquia', imagen: 'https://lh3.googleusercontent.com/d/10gczRkOfcoInxIPbHh0W4R-J0ZWr6wjZ' },
    'sapi': { nombre: 'Laguna Sapi Sapi', imagen: 'https://lh3.googleusercontent.com/d/16LIiyFPN8aat-3PLNBjFPcVmfi5I1JbK' },
    'bolognesi': { nombre: 'Plaza Bolognesi', imagen: 'https://lh3.googleusercontent.com/d/1RAOhmHW2wtEYHqxA1vOuR9RV9fGkf5cl' },
    'playa': { nombre: 'Playa del Amor', imagen: 'https://lh3.googleusercontent.com/d/1mbYuGsz2dM6hB-lcpe5oq_9qFi5ECLSh' },
    'mistica': { nombre: 'Santuario Rosa Mística', imagen: 'https://lh3.googleusercontent.com/d/1nndm9v4pgy7B3HD3qtgSgiB5JRvu4Xxe' },
    'zaragoza': { nombre: 'Balneario Zaragoza', imagen: 'https://lh3.googleusercontent.com/d/15H_u-r9Y4GN9NdddIdIiVgcm3YOzpMgC' }
};

// Diccionario con rutas peatonales exactas
const MAPAS_RELEVANTES = {
    'plaza': {
        siguienteNombre: "📍 Siguiente parada: Teatro Ucamara (Caminando frente a la plaza)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d3977.4839529038686!2d-73.57793617594335!3d-4.506417847622853!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91c0223a12e199b9%3A0x8bd2ed680bf5bf7c!2sPlaza%20De%20Armas%20De%20Nauta%2C%20FCVF%2B9RF%2C%20C.%20Diego%20Rodriguez%2C%20Nauta%2016300!3m2!1d-4.5065662!2d-73.5754512!4m5!1s0x91c0223a6e467e8b%3A0xc174aea122a2c29b!2sTEATRO%20UCAMARA%2C%20FCVF%2B9XC%2C%20Nauta%2016300!3m2!1d-4.506573899999999!2d-73.5751126!5e0!3m2!1ses!2spe!4v1785896490603!5m2!1ses!2spe"
    },
    'ucamara': {
        siguienteNombre: "📍 Siguiente parada: Iglesia San Felipe y San Tiago (Caminando frente a la plaza)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m24!1m8!1m3!1d3977.4842157989983!2d-73.57791057594345!3d-4.50636979762253!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91c0223a6e467e8b%3A0xc174aea122a2c29b!2sTEATRO%20UCAMARA%2C%20FCVF%2B9XC%2C%20Nauta%2016300!3m2!1d-4.506573899999999!2d-73.5751126!4m5!1s0x91c0232bd40da05b%3A0x9d211b32a28f51a6!2sIglesia%20Matriz%20(San%20Felipe%20y%20Santiago)%2C%20FCVF%2BGQW%2C%20Nauta%2016300!3m2!1d-4.5061307!2d-73.5755587!5e0!3m2!1ses!2spe!4v1785897064407!5m2!1ses!2spe"
    },
    'parroquia': {
        siguienteNombre: "📍 Siguiente parada: Laguna Sapi Sapi (Caminando por Jr. Manuel Pacaya)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d1988.7460239374361!2d-73.57815526164931!3d-4.504938074942083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91c0232bd40da05b%3A0x9d211b32a28f51a6!2sIglesia%20Matriz%20(San%20Felipe%20y%20Santiago)%2C%20FCVF%2BGQW%2C%20Nauta%2016300!3m2!1d-4.5061307!2d-73.5755587!4m5!1s0x91c02237232a68f5%3A0xae82109b6254dc21!2sLaguna%20sapi%20sapi%2C%20Nauta%2016300!3m2!1d-4.5037389!2d-73.5781777!5e0!3m2!1ses!2spe!4v1785897191159!5m2!1ses!2spe"
    },
    'sapi': {
        siguienteNombre: "📍 Siguiente parada: Plaza Bolognesi (Caminando frente al Sapi Sapi)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d1988.7495725980027!2d-73.5791056116871!3d-4.5036402749375695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91c02237232a68f5%3A0xae82109b6254dc21!2sLaguna%20sapi%20sapi%2C%20Nauta%2016300!3m2!1d-4.5037389!2d-73.5781777!4m5!1s0x91c022372c33fa25%3A0xde9b8002d4e5b8d0!2sPlaza%20Francisco%20Bolognesi%2C%20FCWF%2BC2X%2C%20Nauta%2016300!3m2!1d-4.5038766!2d-73.57738069999999!5e0!3m2!1ses!2spe!4v1785897299767!5m2!1ses!2spe"
    },
    'bolognesi': {
        siguienteNombre: "📍 Siguiente parada: Playa del Amor (Calle Diego Arturo con San José)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d3977.5126125012084!2d-73.58265892594345!3d-4.501176647589526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91c022372c33fa25%3A0xde9b8002d4e5b8d0!2sPlaza%20Francisco%20Bolognesi%2C%20FCWF%2BC2X%2C%20Nauta%2016300!3m2!1d-4.5038766!2d-73.57738069999999!4m5!1s0x91c022357351b59d%3A0x93764620fbb8358f!2sPLAYA%20DEL%20AMOR%2C%20Nauta%2016300!3m2!1d-4.4982185!2d-73.58153039999999!5e0!3m2!1ses!2spe!4v1785897398930!5m2!1ses!2spe"
    },
    'playa': {
        siguienteNombre: "📍 Siguiente parada: Santuario Virgen Rosa Mística (CENCCA)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d15910.079952264952!2d-73.5813450672859!3d-4.499826835885302!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91c022357351b59d%3A0x93764620fbb8358f!2sPLAYA%20DEL%20AMOR%2C%20Nauta%2016300!3m2!1d-4.4982185!2d-73.58153039999999!4m5!1s0x91c023d5623529e5%3A0xbec5261b6c557efa!2sSANTUARIO%20VIRGEN%20ROSA%20MISTICA%2C%20GC4R%2BC46%2C%20Nauta%2016300!3m2!1d-4.4939599!2d-73.55974549999999!5e0!3m2!1ses!2spe!4v1785897484736!5m2!1ses!2spe"
    },
    'mistica': {
        siguienteNombre: "📍 Siguiente parada: Balneario Zaragoza (Km 5 Carretera Nauta-Iquitos)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d31820.900567393488!2d-73.60007840414517!3d-4.482848626683775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91c023d5623529e5%3A0xbec5261b6c557efa!2sSANTUARIO%20VIRGEN%20ROSA%20MISTICA%2C%20GC4R%2BC46%2C%20Nauta%2016300!3m2!1d-4.4939599!2d-73.55974549999999!4m5!1s0x91c02398368f3aef%3A0x2544f10a965e8053!2sBalneario%20Zaragoza%2C%20Carr.%20Iquitos-Nauta%20500%2C%20Nauta%2016300!3m2!1d-4.4744458!2d-73.5960827!5e0!3m2!1ses!2spe!4v1785897579238!5m2!1ses!2spe"
    },
    'zaragoza': {
        siguienteNombre: "🏁 ¡Felicidades! Has completado el circuito turístico de Nauta (Retorno a la Plaza)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d31820.551281898537!2d-73.6080562541393!3d-4.490863276641761!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91c02398368f3aef%3A0x2544f10a965e8053!2sBalneario%20Zaragoza%2C%20Carr.%20Iquitos-Nauta%20500%2C%20Nauta%2016300!3m2!1d-4.4744458!2d-73.5960827!4m5!1s0x91c0223a12e199b9%3A0x8bd2ed680bf5bf7c!2sPlaza%20De%20Armas%20De%20Nauta%2C%20FCVF%2B9RF%2C%20C.%20Diego%20Rodriguez%2C%20Nauta%2016300!3m2!1d-4.5065662!2d-73.5754512!5e0!3m2!1ses!2spe!4v1785897648425!5m2!1ses!2spe"
    }
};

let enIngles = false;
let textoOriginalEs = ""; 

// EJECUCIÓN INMEDIATA
document.addEventListener("DOMContentLoaded", () => {
    actualizarVisualizacionPasaporte();

    const urlParams = new URLSearchParams(window.location.search);
    const monumentoId = urlParams.get('id'); 

    if (monumentoId) {
        // Muestra todas las secciones si hay un ID detectado
        ocultarSeccionesSecundarias(false);
        cargarYMostrarMonumento(monumentoId);
    } else {
        // Modo Inicio: Oculta secciones de abajo y muestra mensaje de bienvenida
        ocultarSeccionesSecundarias(true);
        mostrarMensajeBienvenida();
    }

    const btnChat = document.getElementById("btn-enviar-chat");
    if (btnChat) btnChat.addEventListener("click", manejarPreguntaIA);

    const inputChat = document.getElementById("chat-pregunta");
    if (inputChat) {
        inputChat.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') manejarPreguntaIA();
        });
    }

    const btnLeer = document.getElementById("btn-leer-texto");
    if (btnLeer) btnLeer.addEventListener("click", hablarReseñaHistorica);

    inicializarModalGaleria();
});

// CONTROL DE VISIBILIDAD DE SECCIONES INTERACTIVAS
function ocultarSeccionesSecundarias(ocultar) {
    const estadoDisplay = ocultar ? "none" : "block";

    const seccionAudio = document.querySelector(".audio-seccion");
    const seccionGaleria = document.querySelector(".galeria-seccion") || document.getElementById("galeria-1")?.closest("section");
    const seccionChat = document.querySelector(".chat-seccion") || document.getElementById("chat-historial")?.closest("section");
    const seccionPasaporte = document.querySelector(".pasaporte-seccion") || document.getElementById("contenedor-sellos")?.closest("section");
    const seccionMapa = document.querySelector(".mapa-seccion") || document.getElementById("mapa-ruta")?.closest("section");

    if (seccionAudio) seccionAudio.style.display = estadoDisplay;
    if (seccionGaleria) seccionGaleria.style.display = estadoDisplay;
    if (seccionChat) seccionChat.style.display = estadoDisplay;
    if (seccionPasaporte) seccionPasaporte.style.display = estadoDisplay;
    if (seccionMapa) seccionMapa.style.display = estadoDisplay;
}

function mostrarMensajeBienvenida() {
    const tituloEl = document.getElementById("monumento-titulo");
    const descEl = document.getElementById("monumento-descripcion");
    const imgEl = document.getElementById("monumento-imagen");

    if (tituloEl) tituloEl.innerText = "¡Bienvenido a GuiaNauta 360!";
    if (descEl) descEl.innerText = "Explora la riqueza histórica de Nauta. Escanea los códigos QR ubicados en los monumentos de la ciudad para activar tu guía interactivo, audio-relatos, mapas y tu pasaporte digital de turista.";
    if (imgEl) imgEl.src = "https://lh3.googleusercontent.com/d/1tbEt7Gnxqd5bla0dm-fTqsLE6KZ-LTSj"; 
}

function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.toString().toLowerCase()
        .replace(/\s+/g, '-') 
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .trim();
}

// 2. REGISTRO DE PASAPORTE
function registrarVisitaPasaporte(idMonumento) {
    let sellosObtenidos = [];
    try {
        sellosObtenidos = JSON.parse(localStorage.getItem("sellos_guianauta")) || [];
    } catch (e) {
        sellosObtenidos = [];
    }

    if (!sellosObtenidos.includes(idMonumento)) {
        sellosObtenidos.push(idMonumento);
        localStorage.setItem("sellos_guianauta", JSON.stringify(sellosObtenidos));
        actualizarVisualizacionPasaporte();
    }
}

// 3. CONEXIÓN Y FILTRADO: Google Sheets
async function cargarYMostrarMonumento(idBuscado) {
    try {
        const respuesta = await fetch(SHEET_URL);
        const textoFila = await respuesta.text();
        const jsonLimpio = JSON.parse(textoFila.substr(47).slice(0, -2));
        const filas = jsonLimpio.table.rows;

        let monumentoEncontrado = null;
        const idBuscadoLimpio = normalizarTexto(idBuscado);

        filas.forEach(fila => {
            if (fila.c && fila.c[0] && fila.c[0].v !== null) {
                const idCeldaLimpio = normalizarTexto(fila.c[0].v);
                if (idCeldaLimpio === idBuscadoLimpio) {
                    const fallbackImg = fila.c[3] ? fila.c[3].v : "assets/imagenes/placeholder.jpg";
                    monumentoEncontrado = {
                        id: idCeldaLimpio, 
                        nombre: (fila.c[1] && fila.c[1].v) ? fila.c[1].v : "Monumento sin nombre",
                        descripcion: (fila.c[2] && fila.c[2].v) ? fila.c[2].v : "Sin descripción disponible.",
                        url_imagen: fallbackImg,
                        url_audio: (fila.c[4] && fila.c[4].v) ? fila.c[4].v : "",
                        foto1: (fila.c[5] && fila.c[5].v) ? fila.c[5].v : fallbackImg,
                        foto2: (fila.c[6] && fila.c[6].v) ? fila.c[6].v : fallbackImg,
                        foto3: (fila.c[7] && fila.c[7].v) ? fila.c[7].v : fallbackImg,
                        foto4: (fila.c[8] && fila.c[8].v) ? fila.c[8].v : fallbackImg
                    };
                }
            }
        });

        if (monumentoEncontrado) {
            document.getElementById("monumento-titulo").innerText = monumentoEncontrado.nombre;
            document.getElementById("monumento-descripcion").innerText = monumentoEncontrado.descripcion;
            
            const imgElemento = document.getElementById("monumento-imagen");
            if (imgElemento) imgElemento.src = monumentoEncontrado.url_imagen;

            const g1 = document.getElementById("galeria-1");
            const g2 = document.getElementById("galeria-2");
            const g3 = document.getElementById("galeria-3");
            const g4 = document.getElementById("galeria-4");

            if (g1) g1.src = monumentoEncontrado.foto1;
            if (g2) g2.src = monumentoEncontrado.foto2;
            if (g3) g3.src = monumentoEncontrado.foto3;
            if (g4) g4.src = monumentoEncontrado.foto4;

            window.historiaMonumentoActual = monumentoEncontrado.descripcion;
            textoOriginalEs = monumentoEncontrado.descripcion;

            const elementoAudio = document.getElementById("monumento-audio");
            const seccionAudio = document.querySelector(".audio-seccion");
            if (elementoAudio && seccionAudio) {
                if (monumentoEncontrado.url_audio) {
                    elementoAudio.src = monumentoEncontrado.url_audio;
                    seccionAudio.style.display = "block";
                } else {
                    seccionAudio.style.display = "none";
                }
            }

            registrarVisitaPasaporte(monumentoEncontrado.id);
            actualizarMapaRuta(monumentoEncontrado.id);

        } else {
            ocultarSeccionesSecundarias(true);
            mostrarMensajePantalla("Monumento no encontrado", "El código QR no coincide con ningún lugar registrado.");
        }

    } catch (error) {
        console.error("Error al cargar Google Sheets:", error);
        ocultarSeccionesSecundarias(true);
        mostrarMensajePantalla("Error de Conexión", "No se pudo conectar a la base de datos.");
    }
}

// 4. CONEXIÓN CON IA (OpenAI)
// Asegúrate de que tu clave esté pegada arriba:
// const OPENAI_API_KEY = 'sk-proj-...';

async function manejarPreguntaIA() {
    const inputPregunta = document.getElementById("chat-pregunta");
    if (!inputPregunta) return;

    const preguntaTexto = inputPregunta.value.trim();
    if (preguntaTexto === "") return;

    agregarMensajeAlChat(preguntaTexto, "usuario-mensaje");
    inputPregunta.value = ""; 

    const idMensajeEspera = agregarMensajeAlChat("Pensando respuesta...", "bot-mensaje");

    try {
        const contextoHistorico = window.historiaMonumentoActual || "un monumento histórico de Nauta, Loreto.";

        // Cambiamos el modelo a gpt-3.5-turbo o gpt-4o-mini
        const respuestaIA = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY.trim()}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres un guía turístico experto de la ciudad de Nauta en Loreto, Perú. Estás frente al monumento histórico que tiene la siguiente descripción real: "${contextoHistorico}". Responde de manera muy amable, entusiasta y concisa (máximo 3 líneas).` 
                    },
                    { role: "user", content: preguntaTexto }
                ]
            })
        });

        const datosIA = await respuestaIA.json();

        if (respuestaIA.ok && datosIA.choices && datosIA.choices[0]) {
            const respuestaTexto = datosIA.choices[0].message.content;
            document.getElementById(idMensajeEspera).innerText = respuestaTexto;
        } else {
            console.error("Detalle error OpenAI:", datosIA);
            if (datosIA.error) {
                document.getElementById(idMensajeEspera).innerText = `⚠️ OpenAI Error (${datosIA.error.code || '401'}): ${datosIA.error.message}`;
            } else {
                document.getElementById(idMensajeEspera).innerText = "Error de autorización con la clave de OpenAI.";
            }
        }

    } catch (error) {
        console.error("Error OpenAI API:", error);
        document.getElementById(idMensajeEspera).innerText = "Error de red/CORS al conectar con OpenAI. Verifica tu conexión.";
    }
}

// 5. MÓDULO DE TRADUCCIÓN NATIVA
const btnIdioma = document.getElementById("btn-idioma");
if (btnIdioma) {
    btnIdioma.addEventListener("click", async () => {
        const descripcionElemento = document.getElementById("monumento-descripcion");

        if (!textoOriginalEs) {
            textoOriginalEs = descripcionElemento.innerText;
        }

        enIngles = !enIngles;

        if (enIngles) {
            btnIdioma.innerText = "🇵🇪 Español";
            descripcionElemento.innerText = "Translating / Traduciendo...";

            try {
                const respuesta = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(textoOriginalEs)}`);
                const datos = await respuesta.json();
                const textoTraducido = datos[0].map(item => item[0]).join("");
                descripcionElemento.innerText = textoTraducido;
            } catch (error) {
                console.error("Error al traducir:", error);
                descripcionElemento.innerText = textoOriginalEs; 
                enIngles = false;
                btnIdioma.innerText = "🇺🇸 English / 🇵🇪 ESP";
            }
        } else {
            btnIdioma.innerText = "🇺🇸 English / 🇵🇪 ESP";
            descripcionElemento.innerText = textoOriginalEs;
        }
    });
}

// 6. MÓDULO PASAPORTE DIGITAL
function actualizarVisualizacionPasaporte() {
    let sellosObtenidos = [];
    try {
        sellosObtenidos = JSON.parse(localStorage.getItem("sellos_guianauta")) || [];
    } catch (e) {
        sellosObtenidos = [];
    }

    const contenedor = document.getElementById("contenedor-sellos");
    const textoProgreso = document.getElementById("progreso-texto");
    const cajaPremio = document.getElementById("premio-completo");

    if (!contenedor || !textoProgreso) return; 

    contenedor.innerHTML = "";

    RUTA_MONUMENTOS.forEach(monumentoId => {
        const infoMonumento = DATOS_PASAPORTE[monumentoId] || { nombre: monumentoId, imagen: '' };
        const estaDesbloqueado = sellosObtenidos.includes(monumentoId);

        const tarjetaSello = document.createElement("div");
        tarjetaSello.style.display = "flex";
        tarjetaSello.style.flexDirection = "column";
        tarjetaSello.style.alignItems = "center";
        tarjetaSello.style.width = "75px";

        const circuloSello = document.createElement("div");
        circuloSello.style.width = "60px";
        circuloSello.style.height = "60px";
        circuloSello.style.borderRadius = "50%";
        circuloSello.style.position = "relative";
        circuloSello.style.boxSizing = "border-box";
        circuloSello.style.backgroundSize = "cover";
        circuloSello.style.backgroundPosition = "center";
        circuloSello.style.display = "flex";
        circuloSello.style.alignItems = "center";
        circuloSello.style.justifyContent = "center";
        circuloSello.style.transition = "all 0.3s ease";

        if (estaDesbloqueado) {
            circuloSello.style.backgroundImage = `url('${infoMonumento.imagen}')`;
            circuloSello.style.border = "3px solid #10B981";
            circuloSello.style.boxShadow = "0 4px 6px rgba(16, 185, 129, 0.3)";

            const badgeCheck = document.createElement("span");
            badgeCheck.innerHTML = "✓";
            badgeCheck.style.position = "absolute";
            badgeCheck.style.bottom = "-2px";
            badgeCheck.style.right = "-2px";
            badgeCheck.style.background = "#10B981";
            badgeCheck.style.color = "#ffffff";
            badgeCheck.style.fontSize = "12px";
            badgeCheck.style.fontWeight = "bold";
            badgeCheck.style.width = "20px";
            badgeCheck.style.height = "20px";
            badgeCheck.style.borderRadius = "50%";
            badgeCheck.style.display = "flex";
            badgeCheck.style.alignItems = "center";
            badgeCheck.style.justifyContent = "center";
            badgeCheck.style.border = "2px solid #ffffff";

            circuloSello.appendChild(badgeCheck);
        } else {
            circuloSello.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${infoMonumento.imagen}')`;
            circuloSello.style.border = "2px dashed #9CA3AF";
            circuloSello.style.color = "#ffffff";
            circuloSello.style.fontSize = "18px";
            circuloSello.innerHTML = "🔒";
        }

        const etiquetaNombre = document.createElement("span");
        etiquetaNombre.innerText = infoMonumento.nombre;
        etiquetaNombre.style.fontSize = "0.75rem";
        etiquetaNombre.style.textAlign = "center";
        etiquetaNombre.style.marginTop = "6px";
        etiquetaNombre.style.color = estaDesbloqueado ? "#065F46" : "#6B7280";
        etiquetaNombre.style.fontWeight = estaDesbloqueado ? "bold" : "normal";
        etiquetaNombre.style.lineHeight = "1.1";

        tarjetaSello.appendChild(circuloSello);
        tarjetaSello.appendChild(etiquetaNombre);
        contenedor.appendChild(tarjetaSello);
    });

    textoProgreso.innerText = `Has recolectado ${sellosObtenidos.length} de ${RUTA_MONUMENTOS.length} sellos de la ruta de Nauta.`;

    if (cajaPremio) {
        cajaPremio.style.display = (sellosObtenidos.length === RUTA_MONUMENTOS.length) ? "block" : "none";
    }
}

// 7. MÓDULO DE MAPAS
function actualizarMapaRuta(idMonumentoActual) {
    const textoParada = document.getElementById("siguiente-parada-texto");
    const iframeMapa = document.getElementById("mapa-ruta");

    if (!iframeMapa) return;

    if (MAPAS_RELEVANTES[idMonumentoActual]) {
        const datosRuta = MAPAS_RELEVANTES[idMonumentoActual];
        if (textoParada) textoParada.innerText = datosRuta.siguienteNombre;
        iframeMapa.src = datosRuta.embedUrl;
    }
}

// 8. MÓDULO VISOR MODAL
function inicializarModalGaleria() {
    const modalVisor = document.getElementById("modal-imagen");
    const imagenAmpliada = document.getElementById("imagen-ampliada");

    function habilitarVisorGaleria(elementoImg) {
        if (elementoImg) {
            elementoImg.addEventListener("click", (e) => {
                e.stopPropagation(); 
                if (elementoImg.src && !elementoImg.src.includes("placeholder")) {
                    imagenAmpliada.src = elementoImg.src;
                    modalVisor.style.display = "block";
                }
            });
        }
    }

    [1, 2, 3, 4].forEach(num => {
        habilitarVisorGaleria(document.getElementById(`galeria-${num}`));
    });
}

window.cerrarModalImagen = function() {
    const modalVisor = document.getElementById("modal-imagen");
    if (modalVisor) {
        modalVisor.style.display = "none";
    }
};

// FUNCIONES AUXILIARES DE INTERFAZ
function mostrarMensajePantalla(titulo, mensaje) {
    const tituloEl = document.getElementById("monumento-titulo");
    const descEl = document.getElementById("monumento-descripcion");
    if (tituloEl) tituloEl.innerText = titulo;
    if (descEl) descEl.innerText = mensaje;
}

function agregarMensajeAlChat(texto, claseEstilo) {
    const historial = document.getElementById("chat-historial");
    if (!historial) return "";
    
    const nuevaBurbuja = document.createElement("p");
    const idUnico = "msg-" + Date.now() + Math.random().toString(36).substr(2, 5);
    
    nuevaBurbuja.id = idUnico;
    nuevaBurbuja.className = claseEstilo;
    nuevaBurbuja.innerText = texto;
    
    historial.appendChild(nuevaBurbuja);
    historial.scrollTop = historial.scrollHeight; 
    
    return idUnico;
}

// 9. MÓDULO TEXT-TO-SPEECH
function hablarReseñaHistorica() {
    const descEl = document.getElementById("monumento-descripcion");
    if (!descEl) return;

    const textoParaLeer = descEl.innerText;
    const botonEfecto = document.getElementById("btn-leer-texto");

    if (!botonEfecto) return;

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        botonEfecto.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar texto';
        botonEfecto.style.backgroundColor = 'var(--verde-selva, #10B981)';
        return;
    }

    const lectura = new SpeechSynthesisUtterance(textoParaLeer);
    lectura.lang = enIngles ? 'en-US' : 'es-ES'; 
    lectura.rate = 1.0; 
    lectura.pitch = 1.0; 

    lectura.onstart = () => {
        botonEfecto.innerHTML = '<i class="fas fa-stop"></i> Detener';
        botonEfecto.style.backgroundColor = '#DC2626'; 
    };

    lectura.onend = () => {
        botonEfecto.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar texto';
        botonEfecto.style.backgroundColor = 'var(--verde-selva, #10B981)';
    };

    lectura.onerror = () => {
        botonEfecto.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar texto';
        botonEfecto.style.backgroundColor = 'var(--verde-selva, #10B981)';
    };

    window.speechSynthesis.speak(lectura);
}
