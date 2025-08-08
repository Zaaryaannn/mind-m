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
        <Button onClick={save} className="shadow-elegant w-fit">Save</Button>
      </CardContent>
    </Card>
  );
};
