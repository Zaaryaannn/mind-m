import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService } from "@/utils/OpenAIService";
import * as Meyda from "meyda";

interface Segment { start: number; end: number; speaker: string }

function kmeans(points: number[][], k = 2, iters = 15) {
  const n = points.length;
  if (n === 0) return { labels: [], centers: [] as number[][] };
  const dim = points[0].length;
  // initialize first k centers from spread
  const centers = points.slice(0, k).map((p) => p.slice());
  const labels = new Array(n).fill(0);

  const dist2 = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

  for (let t = 0; t < iters; t++) {
    // assign
    for (let i = 0; i < n; i++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist2(points[i], centers[c]);
        if (d < bd) { bd = d; best = c; }
      }
      labels[i] = best;
    }
    // update
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      counts[labels[i]]++;
      for (let d = 0; d < dim; d++) sums[labels[i]][d] += points[i][d];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      for (let d = 0; d < dim; d++) centers[c][d] = sums[c][d] / counts[c];
    }
  }
  return { labels, centers };
}

async function computeDiarization(file: File): Promise<Segment[]> {
  const ctx = new AudioContext();
  const ab = await file.arrayBuffer();
  const audio = await ctx.decodeAudioData(ab);
  const sr = audio.sampleRate;
  const channel = audio.numberOfChannels > 1 ? audio.getChannelData(0) : audio.getChannelData(0);

  const frameMs = 25; // 25ms window
  const hopMs = 10;   // 10ms hop
  const frameSize = Math.floor((frameMs / 1000) * sr);
  const hopSize = Math.floor((hopMs / 1000) * sr);

  const features: number[][] = [];
  const times: number[] = [];

  for (let i = 0; i + frameSize <= channel.length; i += hopSize) {
    const frame = channel.subarray(i, i + frameSize);
    const arr = Array.from(frame);
    const mfcc = (Meyda as any).extract("mfcc", arr, { sampleRate: sr, bufferSize: frameSize }) as number[] | null;
    if (!mfcc) continue;
    features.push(mfcc);
    times.push(i / sr);
  }

  if (features.length === 0) return [];

  // normalize features
  const dim = features[0].length;
  const means = new Array(dim).fill(0);
  const stds = new Array(dim).fill(0);
  for (const f of features) for (let d = 0; d < dim; d++) means[d] += f[d];
  for (let d = 0; d < dim; d++) means[d] /= features.length;
  for (const f of features) for (let d = 0; d < dim; d++) stds[d] += (f[d] - means[d]) ** 2;
  for (let d = 0; d < dim; d++) stds[d] = Math.sqrt(stds[d] / features.length) || 1;
  const normalized = features.map((f) => f.map((v, d) => (v - means[d]) / stds[d]));

  const { labels } = kmeans(normalized, 2, 20);

  // merge contiguous labels into segments
  const segs: Segment[] = [];
  let curLabel = labels[0];
  let startTime = times[0];
  for (let i = 1; i < labels.length; i++) {
    if (labels[i] !== curLabel) {
      const endTime = times[i] + frameMs / 1000;
      segs.push({ start: startTime, end: endTime, speaker: curLabel === 0 ? "Speaker A" : "Speaker B" });
      curLabel = labels[i];
      startTime = times[i];
    }
  }
  segs.push({ start: startTime, end: times[times.length - 1] + frameMs / 1000, speaker: curLabel === 0 ? "Speaker A" : "Speaker B" });

  return segs;
}

export const AudioAnalyzer = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<any>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAnalyze = async () => {
    try {
      if (!file) return;
      setLoading(true);
      // Diarization first (client-side, vendor-agnostic)
      const diar = await computeDiarization(file);
      setSegments(diar);

      // Transcription
      const res = await OpenAIService.transcribe(file);
      setTranscript(res);

      toast({ title: "Analysis complete", description: "Transcription and diarization ready." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to analyze audio", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const aligned = (() => {
    if (!transcript?.segments || segments.length === 0) return [] as Array<{ speaker: string; start: number; end: number; text: string }>;
    const out: Array<{ speaker: string; start: number; end: number; text: string }> = [];
    for (const s of transcript.segments as Array<{ start: number; end: number; text: string }>) {
      const mid = (s.start + s.end) / 2;
      const sp = segments.find((g) => mid >= g.start && mid <= g.end) || segments[0];
      out.push({ speaker: sp.speaker, start: s.start, end: s.end, text: s.text.trim() });
    }
    return out;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Analysis</CardTitle>
        <CardDescription>Upload an audio file to transcribe and diarize up to two speakers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-foreground hover:file:bg-accent hover:file:text-accent-foreground"
          aria-label="Upload audio file"
        />
        {file && (
          <audio ref={audioRef} controls src={URL.createObjectURL(file)} className="w-full" />
        )}
        <Button onClick={handleAnalyze} disabled={!file || loading} className="shadow-elegant">
          {loading ? "Analyzing..." : "Transcribe & Analyze"}
        </Button>

        {aligned.length > 0 && (
          <div className="mt-4 text-left space-y-2">
            <h3 className="font-semibold">Results</h3>
            <div className="space-y-1">
              {aligned.map((s, i) => (
                <p key={i} className="text-sm">
                  <span className="font-medium">{s.speaker}:</span> {s.text}
                  <span className="text-xs text-muted-foreground"> ({s.start.toFixed(1)}s–{s.end.toFixed(1)}s)</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
