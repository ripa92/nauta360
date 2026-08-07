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
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Falta configurar OPENAI_API_KEY en Vercel' });
        }

        const promptSistema = `Eres un guía turístico e historiador experto y nativo de la ciudad de Nauta en Loreto, Perú.
El turista está frente al siguiente monumento/lugar: "${contexto || 'Nauta, Loreto'}".

REGLAS DE RESPUESTA:
1. No te limites solo al texto del contexto. Usa todo tu conocimiento histórico general sobre la ciudad de Nauta y la región Loreto.
2. Si te preguntan por orígenes de nombres (ejemplo: Ucamara = Ucayali + Marañón), fechas de creación, historia de la zona o lugares cercanos donde comer, da la respuesta histórica/geográfica exacta de Nauta.
3. Sé muy amable, entusiasta y conciso (máximo 3 o 4 líneas).`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: promptSistema },
                    { role: "user", content: pregunta }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error de OpenAI API:", data);
            return res.status(response.status).json({ error: data.error?.message || "Error en la API de OpenAI" });
        }

        return res.status(200).json({ respuesta: data.choices[0].message.content });

    } catch (error) {
        console.error("Error en servidor:", error);
        return res.status(500).json({ error: error.message });
    }
}
