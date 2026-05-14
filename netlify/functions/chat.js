exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: { message: "API kulcs nincs beállítva a szerveren." } })
        };
    }

    try {
        const body = JSON.parse(event.body);

        // Gemini format (contents/parts) -> OpenAI format (messages/content)
        const messages = (body.contents || []).map(msg => ({
            role: msg.role === "model" ? "assistant" : "user",
            content: msg.parts.map(p => p.text).join("")
        }));

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: messages,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (data.error) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: data.error })
            };
        }

        // OpenAI format -> Gemini format (hogy a frontend ne változzon)
        const aiText = data.choices[0].message.content;
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                candidates: [{ content: { parts: [{ text: aiText }] } }]
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: { message: "Szerverhiba: " + err.message } })
        };
    }
};

