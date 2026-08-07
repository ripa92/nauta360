export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { pregunta, contexto } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel' });
        }

        // Modelo actual vigente en la API de Google Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;

        const promptSistema = `Eres un guía turístico e historiador experto de la ciudad de Nauta en Loreto, Perú.
Lugar o monumento actual que el usuario está viendo en pantalla: "${contexto || 'Nauta, Loreto'}".

INSTRUCCIONES IMPORTANTES:
1. Responde a la pregunta del usuario utilizando todo tu conocimiento sobre la historia real de Nauta, la región Loreto y sus monumentos (fechas de creación, origen de nombres como Ucamara = Ucayali + Marañón, referencias geográficas y locales).
2. Si el dato no está en la pantalla, utiliza tu conocimiento general de Loreto para dar respuestas precisas de fechas, nombres y lugares cercanos.
3. Sé muy amable, entusiasta y conciso (máximo 3 o 4 líneas).`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: promptSistema },
                            { text: `Pregunta del usuario: ${pregunta}` }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error de Gemini API:", data);
            return res.status(response.status).json({ error: data.error?.message || "Error en la API de Gemini" });
        }

        const candidato = data.candidates && data.candidates[0];
        if (candidato && candidato.content && candidato.content.parts && candidato.content.parts[0]) {
            const respuestaTexto = candidato.content.parts[0].text;
            return res.status(200).json({ respuesta: respuestaTexto });
        } else {
            return res.status(500).json({ error: "No se pudo obtener una respuesta válida." });
        }

    } catch (error) {
        console.error("Error en servidor:", error);
        return res.status(500).json({ error: error.message });
    }
}
