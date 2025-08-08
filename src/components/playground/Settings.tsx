import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService } from "@/utils/OpenAIService";

export const Settings = () => {
  const { toast } = useToast();
  const [key, setKey] = useState<string>(OpenAIService.getApiKey() || "");

  const save = () => {
    OpenAIService.saveApiKey(key.trim());
    toast({ title: "Saved", description: "OpenAI API key stored locally." });
  };

  const test = async () => {
    try {
      const k = (key || "").trim() || OpenAIService.getApiKey() || "";
      if (!k) {
        toast({ title: "Missing key", description: "Enter an API key first.", variant: "destructive" });
        return;
      }
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${k}` },
      });
      const text = await res.text();
      if (res.ok) {
        toast({ title: "Key works", description: "The API key is valid." });
      } else {
        try {
          const j = JSON.parse(text);
          if (j.error?.code === "insufficient_quota") {
            toast({ title: "Out of credits", description: "Key is valid but quota is exceeded. Update OpenAI billing or use another key.", variant: "destructive" });
          } else {
            toast({ title: "Key issue", description: j.error?.message || text, variant: "destructive" });
          }
        } catch {
          toast({ title: "Key issue", description: text || "Failed to verify key", variant: "destructive" });
        }
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to verify key", variant: "destructive" });
    }
  };
  return (
    <Card id="settings">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Provide your OpenAI API key to enable all features.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="password"
          placeholder="sk-..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          aria-label="OpenAI API key"
        />
        <div className="text-xs text-muted-foreground">
          Stored in your browser only. For production, use a backend proxy.
        </div>
        <div className="flex gap-2">
          <Button onClick={save} className="shadow-elegant w-fit">Save</Button>
          <Button variant="outline" onClick={test} className="w-fit">Test Key</Button>
        </div>
      </CardContent>
    </Card>
  );
};
