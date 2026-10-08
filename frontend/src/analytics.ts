// Only fixed product events are sent. Never include wheel names, choices,
// imported contents, account information or shared IDs in event parameters.
export function trackWheelEvent(event: "first_spin" | "guide_to_tool", page: "home" | "food" | "guide" | "shared"): void {
  const analyticsWindow = window as Window & { gtag?: (...args: unknown[]) => void };
  try {
    analyticsWindow.gtag?.("event", event, { page_type: page });
  } catch {
    // Analytics availability must not prevent a visitor from spinning.
  }
}
