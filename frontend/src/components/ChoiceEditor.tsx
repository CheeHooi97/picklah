import { useEffect, useRef, useState } from "react";
import { hasDuplicateOptions } from "../features/wheel/rules";
import type { WheelAppearance, WheelDraft } from "../features/wheel/types";
import { appearanceFor } from "../features/wheel/appearance";
import { GifPicker } from "./GifPicker";
import { ChoiceIcon, PICKLAH_EMOJI } from "./ChoiceIcon";
import { readChoiceFile } from "../features/wheel/import";

type ChoiceEditorProps = {
  draft: WheelDraft;
  disabled?: boolean;
  readOnly?: boolean;
  onTitleChange: (title: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onImportOptions: (values: string[]) => void;
  onAppearanceChange: (index: number, update: Partial<WheelAppearance>) => void;
};

export function ChoiceEditor({
  draft,
  disabled = false,
  readOnly = false,
  onTitleChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onImportOptions,
  onAppearanceChange,
}: ChoiceEditorProps) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customizing, setCustomizing] = useState<number | null>(null);
  const appearanceEditorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (customizing !== null) appearanceEditorRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [customizing]);
  const duplicateOptions = hasDuplicateOptions(draft.options);

  function importList() {
    const values = pasted.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (values.some((value) => value.length > 80)) {
      setImportNotice("Keep each choice within 80 characters.");
      return;
    }
    if (values.length > 0) onImportOptions(values);
    setImportNotice("");
    setPasted("");
    setPasteOpen(false);
  }

  async function importFile(file: File) {
    setImporting(true);
    setImportNotice("");
    try {
      const choices = await readChoiceFile(file);
      setPasted(choices.join("\n"));
      setPasteOpen(true);
      setImportNotice(`Loaded ${choices.length} choices from ${file.name}. Review the list and remove any header before adding.`);
    } catch (error) {
      setImportNotice(error instanceof Error ? error.message : "Could not read this file. Try another file.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="editor-panel" aria-labelledby="choices-title">
      <div className="editor-heading">
        <h2 id="choices-title">Choices</h2>
        <span className="choice-count">{draft.options.length} choices</span>
      </div>
      <label className="title-label" htmlFor="wheel-title">Wheel title</label>
      <input
        id="wheel-title"
        className="title-input"
        type="text"
        maxLength={100}
        value={draft.title}
        onChange={(event) => onTitleChange(event.target.value)}
        disabled={disabled}
      />
      <ol className={"choice-list" + (customizing !== null ? " choice-list-expanded" : "")}>
        {draft.options.map((option, index) => (
          <li className="choice-row" key={index}>
            <button className="choice-customize" type="button" aria-label={`Customize choice ${index + 1}`} aria-expanded={customizing === index} aria-controls={`appearance-${index}`} onClick={() => setCustomizing(customizing === index ? null : index)} disabled={disabled}>
              <span className="choice-dot" style={{ background: appearanceFor(draft, index).color }}><ChoiceIcon appearance={appearanceFor(draft, index)} /></span>
            </button>
            <label className="visually-hidden" htmlFor={`choice-${index}`}>Choice {index + 1}</label>
            <input
              id={`choice-${index}`}
              className="choice-input"
              type="text"
              maxLength={80}
              value={option}
              placeholder={`Choice ${index + 1}`}
              onChange={(event) => onOptionChange(index, event.target.value)}
              disabled={disabled}
            />
            <button
              className="remove-choice"
              type="button"
              aria-label={`Remove choice ${index + 1}`}
              onClick={() => { setCustomizing(null); onRemoveOption(index); }}
              disabled={disabled}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
            </button>
            {customizing === index && (
              <div className="appearance-editor" id={`appearance-${index}`} ref={appearanceEditorRef}>
                <label className="color-control">Section color
                  <input type="color" value={appearanceFor(draft, index).color} onInput={(event) => onAppearanceChange(index, { color: event.currentTarget.value })} onChange={(event) => onAppearanceChange(index, { color: event.target.value })} disabled={disabled} />
                </label>
                <label>Emoji
                  <input type="text" placeholder="🍔" maxLength={64} value={appearanceFor(draft, index).emoji} onChange={(event) => onAppearanceChange(index, { emoji: event.target.value })} disabled={disabled} />
                </label>
                {!appearanceFor(draft, index).emoji && !appearanceFor(draft, index).gifUrl && <p className="default-icon-note"><img src={PICKLAH_EMOJI} alt="PickLah mascot" /> PickLah’s icon is used when no emoji or image is added.</p>}
                <GifPicker value={appearanceFor(draft, index).gifUrl} disabled={disabled} onChange={(gifUrl) => onAppearanceChange(index, { gifUrl })} />
                <button className="text-action" type="button" onClick={() => setCustomizing(null)}>Done</button>
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="editor-note">Tap a color dot to customize its section.</p>
      {draft.options.length === 0 && (
        <p className="empty-choices">Add names or options to get started.</p>
      )}
      {duplicateOptions && (
        <p className="duplicate-note" role="status">
          Repeated choices are separate entries, so each gets its own chance to win.
        </p>
      )}
      <button className="text-action add-another" type="button" onClick={onAddOption} disabled={disabled}>
        <span aria-hidden="true">+</span> Add a choice
      </button>
      <div className="paste-tools">
        <input ref={fileInputRef} type="file" accept=".txt,.csv,.xlsx,.xls" hidden onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void importFile(file);
        }} />
        <button className="text-action" type="button" disabled={disabled || importing} onClick={() => fileInputRef.current?.click()}>
          {importing ? "Reading file…" : "Import a file"}
        </button>
        <p className="editor-note">TXT: one choice per line. CSV or Excel: first column of the first sheet. Up to 5 MB. Files stay on your device.</p>
        <button className="text-action paste-toggle" type="button" onClick={() => setPasteOpen((open) => !open)} aria-expanded={pasteOpen} aria-controls="paste-box" disabled={disabled}>
          {pasteOpen ? "Close paste list" : "Paste a list"}
        </button>
        {pasteOpen && (
          <div id="paste-box" className="paste-box">
            <label htmlFor="paste-choices">One choice per line</label>
            <textarea id="paste-choices" rows={4} value={pasted} onChange={(event) => setPasted(event.target.value)} disabled={disabled} />
            <button className="small-button" type="button" onClick={importList} disabled={disabled || importing || !pasted.trim()}>Add choices</button>
          </div>
        )}
        {importNotice && <p className="editor-note" role="status">{importNotice}</p>}
      </div>
      {readOnly && <p className="editor-note">This is a shared wheel. Choose “Make your own copy” below the wheel to edit it.</p>}
    </section>
  );
}
