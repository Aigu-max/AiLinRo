import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import fetch from "node-fetch";
import createDOMPurify from "dompurify";
import { translate } from "@vitalets/google-translate-api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup DOMPurify with JSDOM window
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as any);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint to parse URL content
  app.get("/api/parse", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
        },
        timeout: 15000
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401 || response.status === 429) {
          return res.status(403).json({ 
            error: "Сайт защищен. Пожалуйста, скопируйте текст вручную и воспользуйтесь кнопкой 'Вставить текст'" 
          });
        }
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html, { url });
      
      // Use Readability to extract main content
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article || !article.textContent || article.textContent.length < 50) {
        return res.status(404).json({ error: "Не удалось извлечь основной текст статьи. Сайт может быть защищен или содержать мало текста. Попробуйте скопировать текст вручную." });
      }

      res.json({
        title: article.title,
        content: article.textContent,
        excerpt: article.excerpt,
        siteName: article.siteName,
      });
    } catch (error: any) {
      console.error("Parsing error:", error);
      
      if (error.name === "FetchError" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        return res.status(500).json({ 
          error: "Сайт защищен или недоступен. Пожалуйста, скопируйте текст вручную и воспользуйтесь кнопкой 'Вставить текст'" 
        });
      }
      
      res.status(500).json({ error: "Ошибка при обработке ссылки. Попробуйте скопировать текст вручную." });
    }
  });

  // API Endpoint for translation (Server-side to avoid CORS and rate limits)
  app.post("/api/translate", async (req, res) => {
    const { text, to, from } = req.body;

    if (!text || !to) {
      return res.status(400).json({ error: "Text and target language (to) are required" });
    }

    try {
      // @ts-ignore - library types might be tricky in ESM
      const result = await translate(text, { to, from: from || 'auto' });
      
      res.json({
        text: result.text,
        // Fallback for from language if not directly available in the expected property
        from: (result as any).from?.language?.iso || (result as any).raw?.src || 'auto',
      });
    } catch (error: any) {
      console.error("Translation error:", error);
      
      // Fallback if the library fails or hits a limit
      res.status(500).json({ 
        error: "Ошибка перевода на сервере. Попробуйте позже.",
        details: error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
