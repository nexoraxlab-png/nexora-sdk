const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const N8N_WEBHOOK_URL = process.env.n8n_webhook_url;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nexora-sdk-core',
    timestamp: new Date().toISOString(),
  });
});

// صفحة رئيسية بسيطة
app.get('/', (req, res) => {
  res.send('Nexora SDK Core is running on Render!');
});

// API يرسل مباشرة إلى n8n
app.post('/api/generate-video', async (req, res) => {
  try {
    if (!N8N_WEBHOOK_URL) {
      return res.status(500).json({
        success: false,
        error: 'n8n_webhook_url is not set in environment variables',
      });
    }

    const payload = {
      ...req.body,
      source: 'nexora-sdk-core',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    res.json({
      success: true,
      n8n_status: response.status,
      n8n_response: text,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Nexora SDK Core running on port ${PORT}`);
});
