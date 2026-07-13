/* ==========================================================================
   GUIANAUTA - Sistema Integrado: Google Sheets + Lógica QR + IA Real + Pasaporte + Mapas
   ========================================================================== */

// 1. CONFIGURACIÓN DE LLAVES
const SHEET_ID = '1NxsIhqz1W522b_TA51_H4ZP4Ds9KeYtKwI3FkJkTMdU'; 
const OPENAI_API_KEY = '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'; 

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Lista de los monumentos oficiales de la ruta para el Pasaporte
const RUTA_MONUMENTOS = ['plaza-armas', 'sapi-sapi', 'mercado-central'];

// Diccionario de navegación para guiar al usuario a su siguiente punto en Nauta
const MAPAS_RELEVANTES = {
    'plaza-armas': {
        siguienteNombre: "📍 Siguiente parada: Lago Sapi Sapi (A 3 cuadras)",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.2064115162483!2d-73.5794829!3d-4.5073059!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91ea6b677b5bd6e5%3A0xa14bf9828469d4be!2sLago%20Sapi%20Sapi!5e0!3m2!1ses-419!2spe!4v1710000000000!5m2!1ses-419!2spe"
    },
    'sapi-sapi': {
        siguienteNombre: "📍 Siguiente parada: Mercado Central de Nauta",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.1965000000000!2d-73.5765000!3d-4.5090000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91ea6b66fa5a5555%3A0x5555555555555555!2sMercado%20Central%20De%20Nauta!5e0!3m2!1ses-419!2spe!4v1710000000000!5m2!1ses-419!2spe"
    },
    'mercado-central': {
        siguienteNombre: "🎉 ¡Felicidades! Has completado el circuito turístico principal de Nauta.",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15924.779774026362!2d-73.58784865!3d-4.50821035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91ea6b6f7902047b%3A0x8efb36511fa35712!2sNauta!5e0!3m2!1ses-419!2spe!4v1710000000000!5m2!1ses-419!2spe"
    }
};

// Variables globales para traducción
let enIngles = false;
let textoOriginalEs = ""; 

// Esperamos a que todo el HTML esté listo
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const monumentoId = urlParams.get('id'); // Detecta el ?id= de la URL del QR

    if (monumentoId) {
        cargarYMostrarMonumento(monumentoId);
    } else {
        mostrarMensajePantalla("¡Bienvenido Viajero!", "Por favor, escanea un código QR oficial en cualquiera de los monumentos turísticos de la ciudad para conocer su historia.");
        actualizarVisualizacionPasaporte(); // Muestra el pasaporte vacío o con progreso previo
    }

    // Escuchar eventos del chat
    document.getElementById("btn-enviar-chat").addEventListener("click", manejarPreguntaIA);
    document.getElementById("chat-pregunta").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') manejarPreguntaIA();
    });

    // Escuchar el botón para escuchar la lectura
    document.getElementById("btn-leer-texto").addEventListener("click", hablarReseñaHistorica);
});

// 2. CONEXIÓN Y FILTRADO: Google Sheets
async function cargarYMostrarMonumento(idBuscado) {
    try {
        const respuesta = await fetch(SHEET_URL);
        const textoFila = await respuesta.text();
        const jsonLimpio = JSON.parse(textoFila.substr(47).slice(0, -2));
        const filas = jsonLimpio.table.rows;

        let monumentoEncontrado = null;

        filas.forEach(fila => {
            if (fila.c[0] && fila.c[0].v === idBuscado) {
                monumentoEncontrado = {
                    id: fila.c[0].v,
                    nombre: fila.c[1] ? fila.c[1].v : "Monumento sin nombre",
                    descripcion: fila.c[2] ? fila.c[2].v : "Sin descripción disponible.",
                    url_imagen: fila.c[3] ? fila.c[3].v : "assets/imagenes/placeholder.jpg",
                    url_audio: fila.c[4] ? fila.c[4].v : ""
                };
            }
        });

        if (monumentoEncontrado) {
            // Pintar los datos en el HTML
            document.getElementById("monumento-titulo").innerText = monumentoEncontrado.nombre;
            document.getElementById("monumento-descripcion").innerText = monumentoEncontrado.descripcion;
            document.getElementById("monumento-imagen").src = monumentoEncontrado.url_imagen;

            // Guardar la historia en una variable global para alimentar a la IA y traducción
            window.historiaMonumentoActual = monumentoEncontrado.descripcion;
            textoOriginalEs = monumentoEncontrado.descripcion;

            // Configurar Audio-guía nativa si existe enlace
            const elementoAudio = document.getElementById("monumento-audio");
            if (monumentoEncontrado.url_audio) {
                elementoAudio.src = monumentoEncontrado.url_audio;
                document.querySelector(".audio-seccion").style.display = "block";
            } else {
                document.querySelector(".audio-seccion").style.display = "none";
            }

            // [NUEVO] Registrar visita en el Pasaporte y actualizar Mapa
            registrarVisitaPasaporte(monumentoEncontrado.id);
            actualizarMapaRuta(monumentoEncontrado.id);

        } else {
            mostrarMensajePantalla("Monumento no encontrado", "El código QR no coincide con ningún lugar registrado.");
            actualizarVisualizacionPasaporte();
        }

    } catch (error) {
        console.error("Error:", error);
        mostrarMensajePantalla("Error de Conexión", "No se pudo conectar a la base de datos.");
        actualizarVisualizacionPasaporte();
    }
}

// 3. CONEXIÓN REAL CON LA IA (OpenAI)
async function manejarPreguntaIA() {
    const inputPregunta = document.getElementById("chat-pregunta");
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

// 4. MÓDULO DE TRADUCCIÓN NATIVA VELOZ
document.getElementById("btn-idioma").addEventListener("click", async () => {
    const descripcionElemento = document.getElementById("monumento-descripcion");
    const btnIdioma = document.getElementById("btn-idioma");

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

// 5. MÓDULO PASAPORTE DIGITAL (Sistema de Recompensas por LocalStorage)
function registrarVisitaPasaporte(idMonumento) {
    // Leemos los sellos guardados o creamos una lista vacía si es la primera vez
    let sellosObtenidos = JSON.parse(localStorage.getItem("sellos_guianauta")) || [];

    // Si el monumento escaneado es válido y no lo teníamos guardado, lo añadimos
    if (RUTA_MONUMENTOS.includes(idMonumento) && !sellosObtenidos.includes(idMonumento)) {
        sellosObtenidos.push(idMonumento);
        localStorage.setItem("sellos_guianauta", JSON.stringify(sellosObtenidos));
    }

    // Dibujamos el progreso actualizado en la pantalla
    actualizarVisualizacionPasaporte();
}

function actualizarVisualizacionPasaporte() {
    const sellosObtenidos = JSON.parse(localStorage.getItem("sellos_guianauta")) || [];
    const contenedor = document.getElementById("contenedor-sellos");
    const textoProgreso = document.getElementById("progreso-texto");
    const cajaPremio = document.getElementById("premio-completo");

    // Limpiamos los círculos anteriores para no duplicar
    contenedor.innerHTML = "";

    // Generamos los círculos dinámicamente según la lista oficial
    RUTA_MONUMENTOS.forEach(monumento => {
        const circuloSello = document.createElement("div");
        
        // Estilos base para el sello circular
        circuloSello.style.width = "45px";
        circuloSello.style.height = "45px";
        circuloSello.style.borderRadius = "50%";
        circuloSello.style.display = "flex";
        circuloSello.style.alignItems = "center";
        circuloSello.style.justifyContent = "center";
        circuloSello.style.fontSize = "18px";
        circuloSello.style.transition = "all 0.3s ease";

        if (sellosObtenidos.includes(monumento)) {
            // Sello Completado (Verde con check)
            circuloSello.style.background = "#D1FAE5";
            circuloSello.style.border = "2px solid #10B981";
            circuloSello.style.color = "#059669";
            circuloSello.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else {
            // Sello Bloqueado (Gris con candado)
            circuloSello.style.background = "#F3F4F6";
            circuloSello.style.border = "2px dashed #D1D5DB";
            circuloSello.style.color = "#9CA3AF";
            circuloSello.innerHTML = '<i class="fas fa-lock"></i>';
        }

        contenedor.appendChild(circuloSello);
    });

    // Actualizamos el contador de texto en pantalla
    textoProgreso.innerText = `Has recolectado ${sellosObtenidos.length} de ${RUTA_MONUMENTOS.length} sellos de la ruta de Nauta.`;

    // Si el turista completó todos los puntos, abrimos el premio secreto
    if (sellosObtenidos.length === RUTA_MONUMENTOS.length) {
        cajaPremio.style.display = "block";
    } else {
        cajaPremio.style.display = "none";
    }
}

// 6. MÓDULO DE MAPAS: Direcciona los iframes según la ubicación
function actualizarMapaRuta(idMonumentoActual) {
    const textoParada = document.getElementById("siguiente-parada-texto");
    const iframeMapa = document.getElementById("mapa-ruta");

    if (MAPAS_RELEVANTES[idMonumentoActual]) {
        const datosRuta = MAPAS_RELEVANTES[idMonumentoActual];
        textoParada.innerText = datosRuta.siguienteNombre;
        iframeMapa.src = datosRuta.embedUrl;
    } else {
        textoParada.innerText = "📍 Explora los encantos de la ciudad de Nauta";
        iframeMapa.src = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15924.779774026362!2d-73.578502!3d-4.50821035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91ea6b6f7902047b%3A0x8efb36511fa35712!2sNauta!5e0!3m2!1ses-419!2spe!4v1710000000000!5m2!1ses-419!2spe";
    }
}

// Funciones Auxiliares de Interfaz
function mostrarMensajePantalla(titulo, mensaje) {
    document.getElementById("monumento-titulo").innerText = titulo;
    document.getElementById("monumento-descripcion").innerText = mensaje;
}

function agregarMensajeAlChat(texto, claseEstilo) {
    const historial = document.getElementById("chat-historial");
    const nuevaBurbuja = document.createElement("p");
    const idUnico = "msg-" + Date.now() + Math.random().toString(36).substr(2, 5);
    
    nuevaBurbuja.id = idUnico;
    nuevaBurbuja.className = claseEstilo;
    nuevaBurbuja.innerText = texto;
    
    historial.appendChild(nuevaBurbuja);
    historial.scrollTop = historial.scrollHeight; 
    
    return idUnico;
}

// 7. MÓDULO TEXT-TO-SPEECH: Lector de pantalla integrado
function hablarReseñaHistorica() {
    const textoParaLeer = document.getElementById("monumento-descripcion").innerText;
    const botonEfecto = document.getElementById("btn-leer-texto");

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        botonEfecto.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar texto';
        botonEfecto.style.backgroundColor = 'var(--verde-selva)';
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
        botonEfecto.style.backgroundColor = 'var(--verde-selva)';
    };

    window.speechSynthesis.speak(lectura);
}
