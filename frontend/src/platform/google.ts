import { registerPlugin } from "@capacitor/core";

export const NativeGoogle = registerPlugin<{
  signIn(options: { clientId: string; nonce: string }): Promise<{ idToken: string }>;
  signOut(): Promise<void>;
}>("PicklahGoogle");
