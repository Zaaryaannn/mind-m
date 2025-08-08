import Navbar from "@/components/layout/Navbar";
import { SEO } from "@/components/Seo";
import { AudioAnalyzer } from "@/components/playground/AudioAnalyzer";
import { ImageAnalyzer } from "@/components/playground/ImageAnalyzer";
import { Summarizer } from "@/components/playground/Summarizer";
import { Settings } from "@/components/playground/Settings";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="AI Playground – Multi‑Modal Analysis"
        description="Try conversation transcription with diarization, image description, and document/URL summarization."
        canonical="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "AI Playground",
          applicationCategory: "AIApplication",
          description: "Audio transcription with diarization, image analysis, and summarization",
        }}
      />
      <Navbar />
      <main className="container mx-auto flex-1 py-10">
        <section className="relative overflow-hidden rounded-2xl border bg-gradient-primary text-primary-foreground p-8 shadow-elegant">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-background/20 blur-2xl animate-float-slow" aria-hidden />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">AI Playground – Multi‑Modal Analysis</h1>
          <p className="mt-2 max-w-2xl text-sm/6 md:text-base/7 opacity-90">
            Explore agent skills: conversation transcription with two-speaker diarization, image description, and document/URL summaries.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <AudioAnalyzer />
            <ImageAnalyzer />
          </div>
          <div className="space-y-6">
            <Summarizer />
            <Settings />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
