import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService } from "@/utils/OpenAIService";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - Vite will resolve this worker URL
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
// @ts-ignore - mammoth browser build
import * as mammoth from "mammoth/mammoth.browser";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

async function extractTextFromPDF(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return text;
}

async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await (mammoth as any).extractRawText({ arrayBuffer });
  return result.value as string;
}

export const Summarizer = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileSummarize = async () => {
    try {
      if (!file) return;
      setLoading(true);
      let text = "";
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractTextFromPDF(file);
      } else if (file.name.toLowerCase().endsWith(".docx")) {
        text = await extractTextFromDocx(file);
      } else {
        const content = await file.text();
        text = content;
      }
      const summary = await OpenAIService.summarizeText(text);
      setResult(summary);
      toast({ title: "Summary ready", description: "Document summarized." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to summarize document", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSummarize = async () => {
    try {
      if (!url) return;
      setLoading(true);
      const summary = await OpenAIService.summarizeUrl(url);
      setResult(summary);
      toast({ title: "Summary ready", description: "URL summarized." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to summarize URL", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document / URL Summarization</CardTitle>
        <CardDescription>Upload PDF/DOCX or enter a URL to get a concise summary.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="url" className="w-full">
          <TabsList>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="file">File</TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
              <Button onClick={handleUrlSummarize} disabled={!url || loading} className="shadow-elegant">
                {loading ? "Summarizing..." : "Summarize"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="file" className="space-y-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground"
              aria-label="Upload document"
            />
            <Button onClick={handleFileSummarize} disabled={!file || loading} className="shadow-elegant">
              {loading ? "Summarizing..." : "Summarize"}
            </Button>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="mt-4 text-left">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-sm whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
