window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", "G-MTT1CLG6NC");
const analyticsScript = document.createElement("script");
analyticsScript.async = true;
analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=G-MTT1CLG6NC";
document.head.appendChild(analyticsScript);
document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest("a") : null;
  if (!link) return;
  const target = new URL(link.href, window.location.href);
  if (target.origin !== window.location.origin || !["/", "/food-wheel/"].includes(target.pathname)) return;
  gtag("event", "guide_to_tool", { page_type: "guide", destination: target.pathname === "/" ? "home" : "food" });
});
