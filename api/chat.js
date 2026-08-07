export default async function handler(req, res) {
    // Permitir solicitudes CORS desde cualquier origen
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
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Falta configurar OPENAI_API_KEY en Vercel' });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `Eres un guía turístico e historiador experto de la ciudad de Nauta en Loreto, Perú. 
El usuario está viendo un monumento con este contexto: "${contexto || 'Monumento en Nauta'}". 

Instrucciones:
1. Responde a la pregunta del usuario usando el contexto proporcionado Y TAMBIÉN todo tu conocimiento histórico general sobre Nauta, Loreto y sus monumentos.
2. Si el usuario pregunta por años de creación, fechas, datos históricos o detalles que no están en el contexto, recurre a tu conocimiento general para darle la fecha o dato exacto.
3. Sé amable, entusiasta y conciso (máximo 3 o 4 líneas).`
                    },
                    { role: "user", content: pregunta }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
