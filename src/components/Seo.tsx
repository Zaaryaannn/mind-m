import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: Record<string, any>;
}

export const SEO = ({ title, description, canonical = "/", jsonLd }: SEOProps) => {
  useEffect(() => {
    document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", description);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    if (jsonLd) {
      let script = document.getElementById("structured-data") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = "structured-data";
        (script as HTMLScriptElement).type = "application/ld+json";
        document.head.appendChild(script);
      }
      (script as HTMLScriptElement).textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, canonical, jsonLd]);

  return null;
};
