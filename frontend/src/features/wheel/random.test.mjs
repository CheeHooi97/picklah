import assert from "node:assert/strict";
import test from "node:test";
import { randomIndex } from "./random.ts";
import { hasDuplicateOptions } from "./rules.ts";

test("randomIndex maps accepted 32-bit values into the choice range", () => {
  const values = [0, 1, 2, 3, 4, 5];
  const indexes = values.map((value) =>
    randomIndex(3, (target) => {
      target[0] = value;
      return target;
    }),
  );
  assert.deepEqual(indexes, [0, 1, 2, 0, 1, 2]);
});

test("randomIndex rejects the incomplete range tail before reducing modulo", () => {
  const values = [0xffff_ffff, 5];
  const index = randomIndex(3, (target) => {
    target[0] = values.shift();
    return target;
  });
  assert.equal(index, 2);
  assert.equal(values.length, 0);
});

test("randomIndex rejects invalid choice counts", () => {
  assert.throws(() => randomIndex(0), RangeError);
  assert.throws(() => randomIndex(1.5), RangeError);
});

test("duplicate options are detected case-insensitively after trimming", () => {
  assert.equal(hasDuplicateOptions(["Nasi Lemak", " nasi lemak "]), true);
  assert.equal(hasDuplicateOptions(["Pan Mee", "Burger"]), false);
  assert.equal(hasDuplicateOptions(["", "  "]), false);
});
