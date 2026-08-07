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

        // Modelo gemini-2.0-flash habilitado para búsquedas web en tiempo real
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;

        const promptSistema = `Eres un guía turístico e historiador experto de la ciudad de Nauta en Loreto, Perú.
Lugar o monumento actual en pantalla: "${contexto || 'Nauta, Loreto'}".

INSTRUCCIONES IMPORTANTES:
1. Usa la BÚSQUEDA WEB para encontrar datos exactos, fechas de creación, origen de nombres, restaurantes cercanos e historia real sobre el lugar por el que pregunta el usuario.
2. Responde de forma muy amable, entusiasta y concisa (máximo 3 o 4 líneas).
3. Da información precisa y real de Nauta y la región Loreto.`;

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
                ],
                tools: [
                    {
                        google_search: {}
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
