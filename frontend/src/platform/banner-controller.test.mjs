import assert from "node:assert/strict";
import test from "node:test";
import { createBannerController, inlineBannerMargin } from "./banner-controller.ts";

test("inline banners only occupy a fully visible slot outside safe areas and navigation", () => {
  assert.equal(inlineBannerMargin({top:400,bottom:450,width:320},700,24),376);
  assert.equal(inlineBannerMargin({top:680,bottom:730,width:320},700,24),null);
  assert.equal(inlineBannerMargin({top:10,bottom:60,width:320},700,24),null);
  assert.equal(inlineBannerMargin({top:400,bottom:450,width:300},700,24),null);
  assert.equal(inlineBannerMargin(undefined,700,24),null);
});

test("stale StrictMode cleanup cannot remove the active banner", async () => {
  const calls = [];
  const controller = createBannerController({ prepare: async () => true, show: async ({adId}) => calls.push(adId), remove: async () => calls.push("remove"), onError: error => { throw error; } });
  const first = controller.acquire({adId:"old",margin:72});
  first();
  const second = controller.acquire({adId:"new",margin:72});
  await controller.settled();
  first();
  await controller.settled();
  assert.deepEqual(calls,["new"]);
  second(); await controller.settled();
  assert.deepEqual(calls,["new","remove"]);
});

test("a banner released while consent is pending is never shown", async () => {
  let finishConsent;
  const consent = new Promise(resolve => {finishConsent = resolve;});
  const calls = [];
  const controller = createBannerController({prepare:() => consent,show:async () => calls.push("show"),remove:async () => calls.push("remove"),onError:error => {throw error;}});
  const release = controller.acquire({adId:"test",margin:72});
  await Promise.resolve(); release(); finishConsent(true);
  await controller.settled(); assert.deepEqual(calls,[]);
});

test("consent denial does not request an ad", async () => {
  const controller = createBannerController({prepare:async () => false,show:async () => assert.fail("ad requested"),remove:async () => assert.fail("no banner exists"),onError:error => {throw error;}});
  const release = controller.acquire({adId:"test",margin:72});
  await controller.settled(); release(); await controller.settled();
});
