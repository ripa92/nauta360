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
        const openAiKey = process.env.OPENAI_API_KEY;
        const tavilyKey = process.env.TAVILY_API_KEY;

        if (!openAiKey) {
            return res.status(500).json({ error: 'Falta OPENAI_API_KEY en Vercel' });
        }

        let resultadosBusqueda = "";

        // 1. Si agregaste TAVILY_API_KEY en Vercel, realiza la búsqueda web en vivo
        if (tavilyKey) {
            try {
                const busquedaRes = await fetch("https://api.tavily.com/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        api_key: tavilyKey,
                        query: `${pregunta} ${contexto || ''} Nauta Loreto Peru`,
                        search_depth: "basic",
                        max_results: 3
                    })
                });
                const busquedaData = await busquedaRes.json();
                if (busquedaData.results && busquedaData.results.length > 0) {
                    resultadosBusqueda = busquedaData.results.map(r => r.content).join("\n\n");
                }
            } catch (err) {
                console.warn("Error consultando Tavily, continuando solo con OpenAI:", err);
            }
        }

        // 2. Le pasamos los datos frescos encontrados a GPT-4o-Mini
        const promptSistema = `Eres un guía turístico e historiador experto de la ciudad de Nauta en Loreto, Perú.
Lugar actual en pantalla: "${contexto || 'Nauta, Loreto'}".

INFORMACIÓN FRESCA DE INTERNET:
${resultadosBusqueda || 'No se encontraron datos extra de internet, utiliza tu conocimiento general sobre Nauta.'}

INSTRUCCIONES:
1. Responde a la pregunta del usuario utilizando la INFORMACIÓN FRESCA DE INTERNET recuperada arriba.
2. Si preguntan por orígenes de nombres (ejemplo: Ucamara = Ucayali + Marañón), fechas de creación o lugares cercanos para comer/almorzar, usa los datos exactos.
3. Sé muy amable, entusiasta y conciso (máximo 3 o 4 líneas).`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openAiKey.trim()}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: promptSistema },
                    { role: "user", content: pregunta }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error de OpenAI API:", data);
            return res.status(response.status).json({ error: data.error?.message || "Error en la API de OpenAI" });
        }

        return res.status(200).json({ respuesta: data.choices[0].message.content });

    } catch (error) {
        console.error("Error en el servidor:", error);
        return res.status(500).json({ error: error.message });
    }
}
