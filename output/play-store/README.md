# PickLah Google Play artwork

- `app-icon.png`: 512 × 512 RGBA PNG. Existing wheel mascot on a full square background; Play applies its own mask.
- `feature-graphic.png`: 1024 × 500 RGB PNG.
- `01-wheel.png`, `02-choices.png`, `03-customise.png`, `04-templates.png`: 1080 × 1920 RGB PNGs, in recommended upload order.

Screenshots show real mobile web UI captured at 360 × 640 and exported at 3× size. They are not Android device captures and do not show native AdMob banners, Android status bars, or system dialogs. For the sharpest final listing, replace these with captures from the release Android app on a 1080 × 1920 device or emulator.

Suggested feature graphic alt text: “PickLah helps choose food, plans, and who goes first with a colourful spinning wheel.”

Icon source is the existing 256 × 256 `frontend/public/picklah-emoji.png`; it has been enlarged for the listing. The Android launcher icon is maintained separately.

Regenerate using the bundled Python runtime with Pillow: `python output/play-store/build_assets.py`.
