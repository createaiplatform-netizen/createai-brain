import { useEffect } from "react";

const SITE        = "https://createai.digital";
const DEFAULT_IMG = `${SITE}/opengraph.jpg`;

interface SEOMetaProps {
  title?:            string;
  description?:      string;
  keywords?:         string;
  ogTitle?:          string;
  ogDescription?:    string;
  ogImage?:          string;
  ogUrl?:            string;
  ogType?:           string;
  canonical?:        string;
  structuredData?:   object | object[];
  noindex?:          boolean;
  twitterTitle?:     string;
  twitterDescription?: string;
}

export function SEOMeta({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage  = DEFAULT_IMG,
  ogUrl,
  ogType   = "website",
  canonical,
  structuredData,
  noindex  = false,
  twitterTitle,
  twitterDescription,
}: SEOMetaProps) {
  useEffect(() => {
    const prevTitle = document.title;

    if (title) document.title = title;

    const setMeta = (selector: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        const isProp = selector.includes("property=");
        const attr   = isProp ? "property" : "name";
        const key    = selector.match(/"([^"]+)"/)?.[1] ?? "";
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    const resolvedUrl   = canonical ?? ogUrl ?? (SITE + window.location.pathname);
    const resolvedTitle = ogTitle ?? title ?? document.title;
    const resolvedDesc  = ogDescription ?? description ?? "";

    if (description)  setMeta('meta[name="description"]', description);
    if (keywords)     setMeta('meta[name="keywords"]', keywords);
    if (noindex)      setMeta('meta[name="robots"]', "noindex,nofollow");

    setMeta('meta[property="og:type"]',        ogType);
    setMeta('meta[property="og:title"]',       resolvedTitle);
    setMeta('meta[property="og:description"]', resolvedDesc);
    setMeta('meta[property="og:image"]',       ogImage);
    setMeta('meta[property="og:url"]',         resolvedUrl);

    setMeta('meta[name="twitter:title"]',       twitterTitle       ?? resolvedTitle);
    setMeta('meta[name="twitter:description"]', twitterDescription ?? resolvedDesc);
    setMeta('meta[name="twitter:image"]',       ogImage);

    setLink("canonical", resolvedUrl);

    if (structuredData) {
      const arr = Array.isArray(structuredData) ? structuredData : [structuredData];
      arr.forEach((sd, i) => {
        const id = `seo-sd-page-${i}`;
        let s = document.getElementById(id) as HTMLScriptElement | null;
        if (!s) {
          s = document.createElement("script");
          s.id   = id;
          s.type = "application/ld+json";
          document.head.appendChild(s);
        }
        s.textContent = JSON.stringify(sd);
      });
    }

    return () => {
      document.title = prevTitle;
      document.querySelectorAll('[id^="seo-sd-page-"]').forEach(s => s.remove());
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, ogType,
      canonical, noindex, twitterTitle, twitterDescription, structuredData]);

  return null;
}
