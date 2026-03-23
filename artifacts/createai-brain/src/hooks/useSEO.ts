import { useEffect } from "react";

const SITE        = "https://createai.digital";
const DEFAULT_IMG = `${SITE}/opengraph.jpg`;

interface SEOProps {
  title:        string;
  description:  string;
  url?:         string;
  ogImage?:     string;
  keywords?:    string;
  noindex?:     boolean;
  jsonLD?:      object | object[];
}

export default function useSEO({
  title,
  description,
  url,
  ogImage  = DEFAULT_IMG,
  keywords,
  noindex  = false,
  jsonLD,
}: SEOProps) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;

    const set = (selector: string, attr: "name" | "property", key: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
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

    const canonical = url ?? (SITE + window.location.pathname);

    set('meta[name="description"]',        "name",     "description",     description);
    set('meta[property="og:title"]',        "property", "og:title",        title);
    set('meta[property="og:description"]',  "property", "og:description",  description);
    set('meta[property="og:image"]',        "property", "og:image",        ogImage);
    set('meta[property="og:url"]',          "property", "og:url",          canonical);
    set('meta[name="twitter:title"]',       "name",     "twitter:title",   title);
    set('meta[name="twitter:description"]', "name",     "twitter:description", description);
    set('meta[name="twitter:image"]',       "name",     "twitter:image",   ogImage);

    if (keywords) set('meta[name="keywords"]', "name", "keywords", keywords);
    if (noindex)  set('meta[name="robots"]',   "name", "robots",   "noindex,nofollow");

    setLink("canonical", canonical);

    const ids: string[] = [];
    if (jsonLD) {
      const arr = Array.isArray(jsonLD) ? jsonLD : [jsonLD];
      arr.forEach((sd, i) => {
        const id = `useseo-ld-${i}`;
        ids.push(id);
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
      document.title = prev;
      if (noindex) {
        const r = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
        if (r) r.setAttribute("content", "index,follow");
      }
      ids.forEach(id => document.getElementById(id)?.remove());
    };
  }, [title, description, url, ogImage, keywords, noindex, jsonLD]);
}
