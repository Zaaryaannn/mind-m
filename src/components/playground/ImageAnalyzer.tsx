import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService } from "@/utils/OpenAIService";

export const ImageAnalyzer = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onFile = (f: File | null) => {
    setFile(f);
    setResult("");
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleDescribe = async () => {
    try {
      if (!file) return;
      setLoading(true);
      // Use FileReader to avoid spreading large arrays causing stack overflow
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const result = reader.result as string;
            const commaIndex = result.indexOf(",");
            resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const text = await OpenAIService.describeImage(b64, file.type || "image/png");
      setResult(text);
      toast({ title: "Analysis complete", description: "Image description generated." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to analyze image", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Analysis</CardTitle>
        <CardDescription>Upload an image to generate a detailed description.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground"
          aria-label="Upload image"
        />
        {preview && (
          <img src={preview} alt="Uploaded for analysis" className="max-h-64 w-auto rounded-md border" loading="lazy" />
        )}
        <Button onClick={handleDescribe} disabled={!file || loading} className="shadow-elegant">
          {loading ? "Analyzing..." : "Describe Image"}
        </Button>

        {result && (
          <div className="mt-4 text-left">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
