import { useState } from "react";
import type { WheelAppearance } from "../features/wheel/types";

export const PICKLAH_EMOJI = "/picklah-emoji.png";

export function ChoiceIcon({ appearance }: { appearance: WheelAppearance }) {
  const [failedURL, setFailedURL] = useState("");
  if (appearance.gifUrl && failedURL !== appearance.gifUrl) {
    return <img className="choice-media" key={appearance.gifUrl} src={appearance.gifUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailedURL(appearance.gifUrl)} />;
  }
  return appearance.emoji || <img src={PICKLAH_EMOJI} alt="" />;
}
