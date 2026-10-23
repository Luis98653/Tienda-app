export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // LLAVE FIJA PARA EVITAR CUALQUIER PROBLEMA CON VERCEL
  const finalApiKey = '5cYaTd7XujeVIH4qpP+Cew==';

  try {
    const { systemPrompt, userPrompt, maxTokens } = req.body;

    const response = await fetch('https://api.thehive.ai/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4.1-flash-1017',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: maxTokens || 1500
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar la API de IA', detalles: error.message });
  }
}