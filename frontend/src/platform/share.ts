import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Could not copy the share link.");
  }
}

export async function shareLink(title: string, url: string): Promise<"shared" | "copied" | "cancelled"> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title, text: "Pick a choice with me on PickLah", url, dialogTitle: "Share this wheel" });
      return "shared";
    } catch {
      return "cancelled";
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text: "Pick a choice with me on PickLah", url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }

  await copyText(url);
  return "copied";
}

export async function onAppURL(callback: (url: string) => void): Promise<() => void> {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  const listener = await App.addListener("appUrlOpen", ({ url }) => callback(url));
  const launch = await App.getLaunchUrl();
  if (launch?.url) callback(launch.url);
  return () => void listener.remove();
}
