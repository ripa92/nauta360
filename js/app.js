/* ==========================================================================
   GUIANAUTA - Sistema Integrado: Google Sheets + Lógica QR + IA Real
   ========================================================================== */

// 1. CONFIGURACIÓN DE LLAVES (Reemplaza con tus datos reales)
const SHEET_ID = '1NxsIhqz1W522b_TA51_H4ZP4Ds9KeYtKwI3FkJkTMdU'; 
const OPENAI_API_KEY = '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'; // Tu sk-... de OpenAI

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Esperamos a que todo el HTML esté listo
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const monumentoId = urlParams.get('id'); // Detecta el ?id= de la URL del QR

    if (monumentoId) {
        cargarYMostrarMonumento(monumentoId);
    } else {
        mostrarMensajePantalla("¡Bienvenido Viajero!", "Por favor, escanea un código QR oficial en cualquiera de los monumentos turísticos de la ciudad para conocer su historia.");
    }

    // Escuchar el clic del botón Enviar del Chat
    document.getElementById("btn-enviar-chat").addEventListener("click", manejarPreguntaIA);
    
    // Permitir enviar la pregunta también al presionar la tecla Enter
    document.getElementById("chat-pregunta").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') manejarPreguntaIA();
    });
    // Escuchar el clic del nuevo botón para leer el texto
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

            // Guardar la historia en una variable global para alimentar a la IA
            window.historiaMonumentoActual = monumentoEncontrado.descripcion;

            // Configurar Audio-guía
            const elementoAudio = document.getElementById("monumento-audio");
            if (monumentoEncontrado.url_audio) {
                elementoAudio.src = monumentoEncontrado.url_audio;
            } else {
                document.querySelector(".audio-seccion").style.display = "none";
            }
        } else {
            mostrarMensajePantalla("Monumento no encontrado", "El código QR no coincide con ningún lugar registrado.");
        }

    } catch (error) {
        console.error("Error:", error);
        mostrarMensajePantalla("Error de Conexión", "No se pudo conectar a la base de datos.");
    }
}

// 3. CONEXIÓN REAL CON LA IA (OpenAI)
async function manejarPreguntaIA() {
    const inputPregunta = document.getElementById("chat-pregunta");
    const preguntaTexto = inputPregunta.value.trim();
    
    if (preguntaTexto === "") return;

    // Pintar la pregunta del turista en la pantalla (Burbuja Verde)
    agregarMensajeAlChat(preguntaTexto, "usuario-mensaje");
    inputPregunta.value = ""; // Limpiar el input

    // Colocar una burbuja de espera temporal
    const idMensajeEspera = agregarMensajeAlChat("Escribiendo...", "bot-mensaje");

    try {
        // Obtenemos el contexto del monumento que cargó de Google Sheets
        const contextoHistorico = window.historiaMonumentoActual || "un monumento histórico de Nauta, Loreto.";

        // Llamada fetch a la API de OpenAI (utilizando el modelo súper rápido y económico gpt-4o-mini)
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

        // Reemplazar el "Escribiendo..." con la respuesta real de ChatGPT
        document.getElementById(idMensajeEspera).innerText = respuestaTexto;

    } catch (error) {
        console.error("Error OpenAI API:", error);
        document.getElementById(idMensajeEspera).innerText = "Disculpa, mi señal en la selva falló un momento. ¿Podrías repetirme la pregunta?";
    }
}

// Funciones Auxiliares
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
    historial.scrollTop = historial.scrollHeight; // Auto-scroll hacia abajo
    
    return idUnico;
}
// 7. MÓDULO TEXT-TO-SPEECH: Lee la reseña histórica en voz alta
function hablarReseñaHistorica() {
    const textoParaLeer = document.getElementById("monumento-descripcion").innerText;
    const botonEfecto = document.getElementById("btn-leer-texto");

    // Si el navegador ya está hablando, lo detenemos (sirve como botón de pausa)
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        botonEfecto.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar texto';
        botonEfecto.style.backgroundColor = 'var(--verde-selva)';
        return;
    }

    // Creamos el paquete de lectura
    const lectura = new SpeechSynthesisUtterance(textoParaLeer);
    
    // Configura el idioma en español nativo
    lectura.lang = 'es-ES'; 
    lectura.rate = 1.0; // Velocidad de lectura (1.0 es normal)
    lectura.pitch = 1.0; // Tono de voz

    // Cambiar el aspecto del botón mientras habla
    lectura.onstart = () => {
        botonEfecto.innerHTML = '<i class="fas fa-stop"></i> Detener';
        botonEfecto.style.backgroundColor = '#DC2626'; // Rojo para detener
    };

    // Restaurar el botón cuando termine de hablar
    lectura.onend = () => {
        botonEfecto.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar texto';
        botonEfecto.style.backgroundColor = 'var(--verde-selva)';
    };

    // Ejecutar la voz
    window.speechSynthesis.speak(lectura);
}

// Variable para controlar si el texto está en inglés o español
let enIngles = false;
let textoOriginalEs = ""; // Guardará el texto en español por si el turista quiere regresar

document.getElementById("btn-idioma").addEventListener("click", async () => {
    const descripcionElemento = document.getElementById("monumento-descripcion");
    const btnIdioma = document.getElementById("btn-idioma");

    // Si el texto original está vacío, guardamos lo que vino de Google Sheets
    if (!textoOriginalEs) {
        textoOriginalEs = descripcionElemento.innerText;
    }

    // Cambiamos el estado
    enIngles = !enIngles;

    if (enIngles) {
        btnIdioma.innerText = "🇵🇪 Español";
        descripcionElemento.innerText = "Translating / Traduciendo...";

        try {
            // Usamos un motor de traducción libre, rápido y gratuito en la nube
            const respuesta = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(textoOriginalEs)}`);
            const datos = await respuesta.json();
            
            // Unimos los fragmentos traducidos
            const textoTraducido = datos[0].map(item => item[0]).join("");
            descripcionElemento.innerText = textoTraducido;
        } catch (error) {
            console.error("Error al traducir:", error);
            descripcionElemento.innerText = textoOriginalEs; // Si falla, regresa al español
            enIngles = false;
            btnIdioma.innerText = "🇺🇸 English";
        }
    } else {
        // Si vuelve a presionar, restauramos el texto original en español al instante
        btnIdioma.innerText = "🇺🇸 English";
        descripcionElemento.innerText = textoOriginalEs;
    }
});
