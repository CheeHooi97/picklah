const HOME_TITLE = "Wheel Picker — Random Names & Decisions | PickLah";

// The server also excludes shared routes using X-Robots-Tag. Keep the DOM
// consistent when the SPA changes routes without requesting another HTML page.
export function updatePageSEO(): void {
  const isHome = window.location.pathname === "/" || window.location.pathname === "/index.html";
  const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (robots) robots.content = isHome ? "index, follow" : "noindex, follow";
  document.title = isHome ? HOME_TITLE : "Shared Decision Wheel — PickLah";
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (isHome) {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://picklah.my/";
  } else {
    canonical?.remove();
  }
  const schema = document.getElementById("site-schema") as HTMLScriptElement | null;
  if (schema) schema.type = isHome ? "application/ld+json" : "application/json";
}
