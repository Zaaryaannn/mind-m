export class OpenAIService {
  private static KEY_STORAGE = "openai_api_key";

  static saveApiKey(key: string) {
    localStorage.setItem(this.KEY_STORAGE, key);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.KEY_STORAGE);
  }

  static ensureKey(): string {
    const key = this.getApiKey();
    if (!key) throw new Error("OpenAI API key not set. Add it in Settings.");
    return key;
  }

  static async transcribe(file: File) {
    const apiKey = this.ensureKey();
    const form = new FormData();
    form.append("file", file);
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        if (j.error?.code === "insufficient_quota") {
          throw new Error("OpenAI quota exceeded. Update billing or use another API key in Settings.");
        }
        if (j.error?.message) throw new Error(j.error.message);
      } catch {
        // not JSON
      }
      throw new Error(text || "Failed to transcribe audio");
    }
    return res.json();
  }

  static async describeImage(imageBase64: string, mime: string) {
    const apiKey = this.ensureKey();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Provide a detailed, structured description of this image." },
              { type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        if (j.error?.code === "insufficient_quota") {
          throw new Error("OpenAI quota exceeded. Update billing or use another API key in Settings.");
        }
        if (j.error?.message) throw new Error(j.error.message);
      } catch {
        // not JSON
      }
      throw new Error(text || "Failed to analyze image");
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  static async summarizeText(text: string) {
    const apiKey = this.ensureKey();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a concise summarizer. Return a 5-7 bullet summary and a 1-sentence takeaway.",
          },
          { role: "user", content: text.slice(0, 12000) },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        if (j.error?.code === "insufficient_quota") {
          throw new Error("OpenAI quota exceeded. Update billing or use another API key in Settings.");
        }
        if (j.error?.message) throw new Error(j.error.message);
      } catch {
        // not JSON
      }
      throw new Error(text || "Failed to summarize text");
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  static async summarizeUrl(url: string) {
    const stripped = url.replace(/^https?:\/\//, "");
    const readerUrl = `https://r.jina.ai/http://${stripped}`;
    const html = await fetch(readerUrl).then((r) => r.text());
    return this.summarizeText(`URL: ${url}\n\nContent:\n${html}`);
  }
}
