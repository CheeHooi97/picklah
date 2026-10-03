import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { imageFileSource, validGifSource } from "../features/wheel/media";

export function GifPicker({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const operation = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  useEffect(() => () => { operation.current++; }, []);
  const embedded = value.startsWith("data:");

  function setSource(source: string) {
    if (disabledRef.current) return;
    operation.current++;
    setLoading(false);
    setError("");
    onChange(source.trim());
  }

  async function addFile(file: File) {
    if (disabledRef.current) return;
    const current = ++operation.current;
    setLoading(true);
    setError("");
    try {
      const source = await imageFileSource(file);
      if (current === operation.current && !disabledRef.current) onChange(source);
    } catch (reason) {
      if (current === operation.current) setError(reason instanceof Error ? reason.message : "Could not add this GIF.");
    } finally {
      if (current === operation.current) setLoading(false);
    }
  }

  async function addKeyboardSource(source: string) {
    if (source.startsWith("blob:")) {
      const current = ++operation.current;
      setLoading(true);
      setError("");
      try {
        if (new URL(source).origin !== window.location.origin) throw new Error("Unreadable keyboard image");
        const blob = await (await fetch(source)).blob();
        const image = await imageFileSource(new File([blob], "keyboard-image", { type: blob.type }));
        if (current === operation.current && !disabledRef.current) onChange(image);
      } catch {
        if (current === operation.current) setError("This keyboard's image could not be read. Use Choose GIF instead.");
      } finally {
        if (current === operation.current) setLoading(false);
      }
    } else if (validGifSource(source) && source) setSource(source);
    else setError("This keyboard did not provide a GIF. Try Choose GIF or paste a direct HTTPS image link.");
  }

  function paste(event: ClipboardEvent<HTMLElement>) {
    if (disabled) return;
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"))
      || Array.from(event.clipboardData.items).find((item) => item.kind === "file" && item.type.startsWith("image/"))?.getAsFile();
    event.preventDefault();
    if (file) { void addFile(file); return; }
    const html = event.clipboardData.getData("text/html");
    const image = html ? new DOMParser().parseFromString(html, "text/html").querySelector("img")?.getAttribute("src") : "";
    const source = image || event.clipboardData.getData("text/plain").trim();
    void addKeyboardSource(source);
  }

  return <div className="gif-picker">
    <span className="gif-heading">GIF or image (optional)</span>
    <label className="gif-upload">Choose GIF or image
      <input type="file" accept="image/gif,image/png,image/jpeg,image/webp" disabled={disabled || loading} onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (file) void addFile(file);
      }} />
    </label>
    <div className="gif-keyboard" contentEditable={!disabled && !loading} suppressContentEditableWarning role="textbox" aria-label="Paste a GIF from your keyboard" aria-disabled={disabled || loading} tabIndex={disabled || loading ? -1 : 0} data-placeholder="Tap here, then paste a keyboard GIF" onPaste={paste} onBeforeInput={(event) => {
      const transfer = (event.nativeEvent as InputEvent).dataTransfer;
      const file = transfer && Array.from(transfer.files).find((item) => item.type.startsWith("image/"));
      if (file) { event.preventDefault(); void addFile(file); }
    }} onInput={(event) => {
      const image = event.currentTarget.querySelector("img")?.getAttribute("src");
      if (image) {
        void addKeyboardSource(image);
        event.currentTarget.textContent = "";
      } else if (((event.nativeEvent as InputEvent).data?.length || 0) > 12) {
        const source = event.currentTarget.textContent?.trim() || "";
        if (validGifSource(source) && source) { setSource(source); event.currentTarget.textContent = ""; }
      }
    }} />
    <label>Or paste a GIF link
      <input type="text" inputMode="url" placeholder="https://…/burger.gif" maxLength={2048} value={embedded ? "" : value} disabled={disabled} onPaste={paste} onChange={(event) => setSource(event.target.value)} aria-invalid={!validGifSource(value)} />
    </label>
    {value && validGifSource(value) && <div className="gif-preview">
      <img key={value} src={value} alt="Selected section image" referrerPolicy="no-referrer" onError={() => setError("This image could not be loaded. Choose a file or try another direct image link.")} />
      <button type="button" className="text-action" onClick={() => setSource("")} disabled={disabled}>Remove image</button>
    </div>}
    <p className="appearance-help" role="status">{loading ? "Adding image…" : error || (!validGifSource(value) ? "Use a direct HTTPS image link, or choose an image file." : "GIF, PNG, JPEG, or WebP. Up to 1 MB each, 2 MB per wheel. Keyboard support varies; choosing a file also works.")}</p>
  </div>;
}
