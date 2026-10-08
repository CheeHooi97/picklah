const HOME_TITLE = "Wheel Picker — Random Names & Decisions | PickLah";
const FOOD_TITLE = "What to Eat Wheel — Malaysian Food Picker | PickLah";

export function isFoodPage(pathname: string): boolean {
  return ["/food-wheel", "/food-wheel/", "/food-wheel/index.html"].includes(pathname);
}

// The server also excludes shared routes using X-Robots-Tag. Keep the DOM
// consistent when the SPA changes routes without requesting another HTML page.
export function updatePageSEO(): void {
  const isHome = window.location.pathname === "/" || window.location.pathname === "/index.html";
  const isFood = isFoodPage(window.location.pathname);
  const isPublic = isHome || isFood;
  const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (robots) robots.content = isPublic ? "index, follow" : "noindex, follow";
  document.title = isFood ? FOOD_TITLE : isHome ? HOME_TITLE : "Shared Decision Wheel — PickLah";
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (isPublic) {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = isFood ? "https://picklah.my/food-wheel/" : "https://picklah.my/";
  } else {
    canonical?.remove();
  }
  const schema = document.getElementById("site-schema") as HTMLScriptElement | null;
  if (schema) schema.type = isPublic ? "application/ld+json" : "application/json";
}
