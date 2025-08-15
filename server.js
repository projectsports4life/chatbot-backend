console.log("OPENROUTER_API_KEY exists:", !!process.env.OPENROUTER_API_KEY);


import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS: allow any origin (you can lock this down later)
app.use(cors({ origin: "https://projectsports4life.github.io" }));
app.use(express.json());

// Health check (so hitting the root doesn't 404)
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "chatbot-backend" });
});

app.post("/chat", async (req, res) => {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
    }

    const userMessage = req.body?.message || "";
    if (!userMessage) {
      return res.status(400).json({ error: "Missing 'message' in body" });
    }

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // (optional but nice for OpenRouter analytics)
        "HTTP-Referer": "https://your-frontend-domain.example", 
        "X-Title": "Chatbot Demo"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          { role: "system", content: "You are a friendly chatbot." },
          { role: "user", content: userMessage }
        ]
      })
    });

    // If OpenRouter fails, forward a helpful message
    if (!orRes.ok) {
      const errText = await orRes.text().catch(() => "");
      console.error("OpenRouter error:", orRes.status, errText);
      return res.status(502).json({ error: "Upstream AI error", detail: errText });
    }

    const data = await orRes.json();

    const reply =
      data?.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (error) {
    console.error("Server exception:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));





