export type WheelAppearance = { color: string; emoji: string; gifUrl: string };

export type WheelDraft = {
  title: string;
  templateKey: string;
  options: string[];
  appearances?: WheelAppearance[];
};

export type WheelTemplate = {
  key: string;
  title: string;
  description: string;
  options: string[];
};

export type WheelResponse = {
  publicId: string;
  schemaVersion: number;
  title: string;
  templateKey?: string;
  options: ({ position: number; label: string } & Partial<WheelAppearance>)[];
  createdAt: string;
};
