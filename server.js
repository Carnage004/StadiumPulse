const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve all static files (index.html, styles.css, js/, json/ etc.) from root
app.use(express.static(__dirname));

// POST proxy endpoint for the Gemini API
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    // Default to gemini-2.0-flash model
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API returned status ${response.status}:`, errText);
      return res.status(response.status).send(errText);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Internal server error connecting to Gemini." });
  }
});

// Serve index.html for any fallback route to support standard SPA routing if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`StadiumPulse backend proxy listening on port ${PORT}`);
});
