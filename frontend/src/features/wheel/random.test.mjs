import assert from "node:assert/strict";
import test from "node:test";
import { randomIndex, winnerRotation } from "./random.ts";
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

test("every stopping angle puts the pointer inside its selected section, away from gaps", () => {
  for (const count of [1, 2, 3, 4, 7, 8, 13, 31, 100, 512]) {
    for (let index = 0; index < count; index++) {
      for (const previous of [0, 45, -90, 359.999, 123456.789]) {
        const end = winnerRotation(previous, count, index);
        const pointer = ((-end % 360) + 360) % 360;
        const section = pointer / (360 / count);
        assert.equal(Math.floor(section), index);
        assert.ok(Math.abs(section - index - 0.5) < 0.000001);
        assert.ok(end >= previous + 2160);
      }
    }
  }
});

test("stopping angles remain valid through successive elimination rounds", () => {
  let rotation = 0;
  for (let count = 100; count > 0; count--) {
    const index = count - 1;
    rotation = winnerRotation(rotation, count, index) % 360;
    assert.equal(Math.floor((((-rotation % 360) + 360) % 360) / (360 / count)), index);
  }
});

test("varied stopping points stay within the winning section", () => {
  for (const count of [1, 2, 3, 8, 31, 100, 512]) {
    for (let index = 0; index < count; index++) {
      for (const fraction of [0.1, 0.23, 0.68, 0.9]) {
        const rotation = winnerRotation(359.999, count, index, fraction);
        const section = (((-rotation % 360) + 360) % 360) / (360 / count);
        assert.equal(Math.floor(section), index);
        assert.ok(section - index > 0.09 && section - index < 0.91);
      }
    }
  }
  for (const fraction of [0, 1, NaN, -0.1]) assert.throws(() => winnerRotation(0, 8, 0, fraction), RangeError);
});
