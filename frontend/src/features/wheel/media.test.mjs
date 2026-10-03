import assert from "node:assert/strict";
import test from "node:test";
import { embeddedBytes, validGifSource, MAX_IMAGE_BYTES } from "./media.ts";

const gif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
test("keyboard/file GIF sources and secure links are accepted", () => {
  assert.equal(validGifSource(gif), true);
  assert.equal(embeddedBytes(gif), Buffer.from(gif.split(",")[1], "base64").length);
  assert.equal(validGifSource("https://example.com/burger.gif"), true);
});
test("unsupported or oversized keyboard image data is rejected", () => {
  for (const value of [gif.replace("image/gif", "image/png"), "data:image/svg+xml;base64,PHN2Zz4=", "data:image/gif;base64,AAAA", "blob:https://example.com/a", "http://example.com/a.gif", "https://user:secret@example.com/a.gif"]) assert.equal(validGifSource(value), false);
  const large = Buffer.alloc(MAX_IMAGE_BYTES + 1);
  large.write("GIF89a");
  assert.equal(validGifSource("data:image/gif;base64," + large.toString("base64")), false);
});
