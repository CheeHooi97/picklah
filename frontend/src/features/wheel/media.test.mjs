import assert from "node:assert/strict";
import test from "node:test";
import { embeddedBytes, validGifSource, imageFileSource, imageTypeFromHeader, MAX_IMAGE_BYTES, MAX_UPLOAD_BYTES } from "./media.ts";

const gif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
test("keyboard/file GIF sources and secure links are accepted", () => {
  assert.equal(validGifSource(gif), true);
  assert.equal(embeddedBytes(gif), Buffer.from(gif.split(",")[1], "base64").length);
  assert.equal(validGifSource("https://example.com/burger.gif"), true);
});

test("image uploads detect the bytes rather than trusting the picker MIME type", async () => {
  const previousReader = globalThis.FileReader;
  globalThis.FileReader = class {
    async readAsDataURL(blob) {
      this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
      this.onload();
    }
  };
  try {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x00]);
    for (const type of ["image/jpeg", "image/jpg", "", "application/octet-stream"]) {
      const source = await imageFileSource(new File([jpeg], "photo.jpg", { type }));
      assert.equal(source, `data:image/jpeg;base64,${jpeg.toString("base64")}`);
      assert.equal(validGifSource(source), true);
    }
    await assert.rejects(imageFileSource(new File(["not an image"], "fake.txt", { type: "text/plain" })), /Choose an image file/);
    await assert.rejects(imageFileSource(new File([Buffer.alloc(MAX_UPLOAD_BYTES + 1)], "big.jpg", { type: "image/jpeg" })), /smaller than 20 MB/);
    assert.equal(imageTypeFromHeader("RIFF1234WEBP"), "image/webp");
    assert.equal(imageTypeFromHeader("\x89PNG\r\n\x1a\n"), "image/png");
  } finally {
    globalThis.FileReader = previousReader;
  }
});
test("unsupported or oversized keyboard image data is rejected", () => {
  for (const value of [gif.replace("image/gif", "image/png"), "data:image/svg+xml;base64,PHN2Zz4=", "data:image/gif;base64,AAAA", "blob:https://example.com/a", "http://example.com/a.gif", "https://user:secret@example.com/a.gif"]) assert.equal(validGifSource(value), false);
  const large = Buffer.alloc(MAX_IMAGE_BYTES + 1);
  large.write("GIF89a");
  assert.equal(validGifSource("data:image/gif;base64," + large.toString("base64")), false);
});
