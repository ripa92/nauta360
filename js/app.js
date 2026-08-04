/* ==========================================================================
   GUIANAUTA - Sistema Integrado: Google Sheets + Lógica QR + IA Real + Pasaporte + Mapas
   ========================================================================== */

// 1. CONFIGURACIÓN
const SHEET_ID = '1NxsIhqz1W522b_TA51_H4ZP4Ds9KeYtKwI3FkJkTMdU'; 
// NOTA DE SEGURIDAD: Revoca esta clave en OpenAI y usa un proxy/backend seguro.
const OPENAI_API_KEY = 'sk-proj-...'; 

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
    'mistica': { nombre: 'Santuario Rosa Mística', imagen: 'https://lh3.googleusercontent.com/d/1GrYJ5Z1ZuoGFDy2ivm2NXw8TKKmD_4rX' },
    'zaragoza': { nombre: 'Balneario Zaragoza', imagen: 'https://lh3.googleusercontent.com/d/12lrQc2kbhJP0O5gRwFxSgfsqup_6L0w1' }
};

// Diccionario con rutas peatonales exactas usando los mismos IDs que RUTA_MONUMENTOS
const MAPAS_RELEVANTES = {
    'plaza': {
        siguienteNombre: "📍 Siguiente parada: Lago Sapi Sapi (Caminando por Jr. Tarapacá)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d3981.203657784013!2d-73.57866752520638!3d-4.506542795467657!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91ea6b6fa3500a4b%3A0xc3da0b75a176cc38!2sPlaza%20de%20Armas%20de%20Nauta%2C%20Nauta!3m2!1d-4.5055047!2d-73.5762031!4m5!1s0x91ea6b677b5bd6e5%3A0xa14bf9828469d4be!2sLago%20Sapi%20Sapi%2C%20Nauta%2016501!3m2!1d-4.5073059!2d-73.5794829!5e0!3m2!1ses-419!2spe!4v1716584200000!5m2!1ses-419!2spe"
    },
    'sapi': {
        siguienteNombre: "📍 Siguiente parada: Mercado Central de Nauta (Caminando por Jr. Lima)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d3981.198357784013!2d-73.57900002520638!3d-4.508500000000000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e2!4m5!1s0x91ea6b677b5bd6e5%3A0xa14bf9828469d4be!2sLago%20Sapi%20Sapi%2C%20Nauta%2016501!3m2!1d-4.5073059!2d-73.5794829!4m5!1s0x91ea6b66fa5a5555%3A0x5555555555555555!2sMercado%20Central%20De%20Nauta%2C%20Nauta!3m2!1d-4.5090000!2d-73.5765000!5e0!3m2!1ses-419!2spe!4v1716584300000!5m2!1ses-419!2spe"
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
        cargarYMostrarMonumento(monumentoId);
    } else {
        mostrarMensajePantalla("¡Bienvenido Viajero!", "Por favor, escanea un código QR oficial en cualquiera de los monumentos turísticos de la ciudad para conocer su historia.");
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
});

function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.toString().toLowerCase()
        .replace(/\s+/g, '-') 
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .trim();
}

// 2. REGISTRO DE PASAPORTE (FUNCIÓN AGREGADA)
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
            if (fila.c && fila.c[0]) {
                const idCeldaLimpio = normalizarTexto(fila.c[0].v);
                if (idCeldaLimpio === idBuscadoLimpio) {
                    monumentoEncontrado = {
                        id: idCeldaLimpio, 
                        nombre: fila.c[1] ? fila.c[1].v : "Monumento sin nombre",
                        descripcion: fila.c[2] ? fila.c[2].v : "Sin descripción disponible.",
                        url_imagen: fila.c[3] ? fila.c[3].v : "assets/imagenes/placeholder.jpg",
                        url_audio: fila.c[4] ? fila.c[4].v : ""
                    };
                }
            }
        });

        if (monumentoEncontrado) {
            document.getElementById("monumento-titulo").innerText = monumentoEncontrado.nombre;
            document.getElementById("monumento-descripcion").innerText = monumentoEncontrado.descripcion;
            
            const imgElemento = document.getElementById("monumento-imagen");
            if (imgElemento) imgElemento.src = monumentoEncontrado.url_imagen;

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

            // Registrar e interacciones de interfaz
            registrarVisitaPasaporte(monumentoEncontrado.id);
            actualizarMapaRuta(monumentoEncontrado.id);

        } else {
            mostrarMensajePantalla("Monumento no encontrado", "El código QR no coincide con ningún lugar registrado.");
        }

    } catch (error) {
        console.error("Error:", error);
        mostrarMensajePantalla("Error de Conexión", "No se pudo conectar a la base de datos.");
    }
}

// 4. CONEXIÓN REAL CON LA IA (OpenAI)
async function manejarPreguntaIA() {
    const inputPregunta = document.getElementById("chat-pregunta");
    if (!inputPregunta) return;

    const preguntaTexto = inputPregunta.value.trim();
    if (preguntaTexto === "") return;

    agregarMensajeAlChat(preguntaTexto, "usuario-mensaje");
    inputPregunta.value = ""; 

    const idMensajeEspera = agregarMensajeAlChat("Escribiendo...", "bot-mensaje");

    try {
        const contextoHistorico = window.historiaMonumentoActual || "un monumento histórico de Nauta, Loreto.";

        const respuestaIA = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres un guía turístico experto de la ciudad de Nauta en Loreto, Perú. Estás frente al monumento histórico que tiene la siguiente descripción real: "${contextoHistorico}". Responde de manera muy amable, entusiasta y concisa (máximo 3 líneas). Si el usuario te pregunta algo que no tenga nada que ver con el turismo, la historia local o este monumento, recuérdale amablemente que estás aquí para guiarlo en su recorrido por Nauta.` 
                    },
                    { role: "user", content: preguntaTexto }
                ],
                temperature: 0.7
            })
        });

        const datosIA = await respuestaIA.json();
        const respuestaTexto = datosIA.choices[0].message.content;

        document.getElementById(idMensajeEspera).innerText = respuestaTexto;

    } catch (error) {
        console.error("Error OpenAI API:", error);
        document.getElementById(idMensajeEspera).innerText = "Disculpa, mi señal en la selva falló un momento. ¿Podrías repetirme la pregunta?";
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
    contenedor.style.display = "flex";
    contenedor.style.justifyContent = "space-around";
    contenedor.style.alignItems = "flex-start";
    contenedor.style.gap = "10px";
    contenedor.style.flexWrap = "wrap";

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
    } else {
        if (textoParada) textoParada.innerText = "📍 Explora los encantos de la ciudad de Nauta";
        iframeMapa.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15924.779774026362!2d-73.578502!3d-4.50821035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91ea6b6f7902047b%3A0x8efb36511fa35712!2sNauta!5e0!3m2!1ses-419!2spe!4v1710000000000!5m2!1ses-419!2spe";
    }
}

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

// 8. MÓDULO TEXT-TO-SPEECH
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
    lectura.lang = 'es-ES'; 
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

    window.speechSynthesis.speak(lectura);
}
