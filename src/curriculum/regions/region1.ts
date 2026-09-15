/**
 * Region 1 · Golden Beach · Te Tāhuna · Year 1 (age 5)
 * Te Mātaiaho Phase 1, Year 1: counting and subitising to 20, reading and ordering numbers,
 * joining and separating within 10, partitions of 5 and 10, repeating patterns, direct
 * comparison of length/mass/capacity, sequencing time, 2D and 3D shapes, position,
 * sorting and simple data displays, and everyday chance language.
 */
import type { CreatureName, PatternToken, Region, Rng, ShapeName, Trail, Visual } from "../types";
import { chance, pick, randInt, shuffle } from "../rng";
import { COLOURS, DAYS, itemName, numberChoice, numberWord, numericDistractors, numpad, objects, randomItem, textChoice, timeWords, visualChoice, creatureName } from "../helpers";

const counting: Trail = {
  id: "y1-count",
  name: "Counting Shells",
  reoName: "Tatau Anga",
  blurb: "Count the treasures on the sand, and spot how many in a flash.",
  icon: "shell",
  strand: "number",
  skills: [
    { code: "Y1.N.count10", label: "Count objects to 10", curriculum: "Year 1 Number: count one-to-one and say how many, to 10" },
    { code: "Y1.N.count20", label: "Count objects to 20", curriculum: "Year 1 Number: count sets of up to 20 objects" },
    { code: "Y1.N.subitise", label: "Subitise to 5 and patterns to 10", curriculum: "Year 1 Number: instantly recognise groups to 5 and dice/ten-frame patterns to 10" },
  ],
  generate(tier, rng) {
    if (tier >= 2 && chance(rng, 0.4)) {
      const n = tier === 2 ? randInt(rng, 1, 6) : randInt(rng, 3, 10);
      const visual: Visual = tier === 2 ? { kind: "dots", count: n, pattern: chance(rng, 0.6) ? "dice" : "scatter" } : { kind: "tenframe", count: n };
      return numberChoice(rng, { skill: "Y1.N.subitise", prompt: "How many did you see?", visual, flash: tier === 2 ? 2000 : 1800, hint: tier === 2 ? "Look for the shape the dots make." : "A full top row is 5. Count on from 5." }, n, { min: 1, max: 10, spread: 2 });
    }
    const max = tier === 1 ? 5 : tier === 2 ? 10 : 20;
    const n = randInt(rng, tier === 1 ? 1 : tier === 2 ? 4 : 9, max);
    const item = randomItem(rng);
    const base = { skill: n <= 10 ? "Y1.N.count10" : "Y1.N.count20", prompt: `How many ${itemName(item, 2)}?`, visual: objects(item, n), hint: "Touch each one as you count. Say the numbers out loud!" };
    return tier === 1 ? numberChoice(rng, base, n, { min: 1, max: 6, spread: 2 }) : numpad(base, n);
  },
};

const numbers: Trail = {
  id: "y1-numbers",
  name: "Number Rock Pools",
  reoName: "Ngā Tau",
  blurb: "Read numbers, put them in order and find what comes next.",
  icon: "numbers",
  strand: "number",
  skills: [
    { code: "Y1.N.numerals", label: "Read numerals and number words to 20", curriculum: "Year 1 Number: read and match numerals, words and quantities to 20" },
    { code: "Y1.N.sequence", label: "Count forwards and backwards to 20", curriculum: "Year 1 Number: say forwards and backwards sequences to 20; number before and after" },
    { code: "Y1.N.compare", label: "Compare and order to 20", curriculum: "Year 1 Number: compare two sets or numbers and say which is more, fewer or the same" },
  ],
  generate(tier, rng) {
    const max = tier === 1 ? 10 : 20;
    const variant = randInt(rng, 0, 3);
    if (variant === 0) {
      const n = randInt(rng, 1, max);
      const item = randomItem(rng);
      if (chance(rng, 0.5)) {
        const distractors = numericDistractors(rng, n, 2, { min: 1, max, spread: 2 });
        return visualChoice(rng, { skill: "Y1.N.numerals", prompt: `Which group has ${n} ${itemName(item, n)}?`, visual: { kind: "text", text: String(n) }, hint: "Count each group carefully." }, String(n), [n, ...distractors].map((v) => ({ value: String(v), visual: objects(item, v) })));
      }
      return numberChoice(rng, { skill: "Y1.N.numerals", prompt: `Which number is "${numberWord(n)}"?`, visual: { kind: "text", text: numberWord(n) }, hint: "Say the word slowly and think of the number." }, n, { min: 1, max, spread: 3 });
    }
    if (variant === 1) {
      const backwards = tier === 3 && chance(rng, 0.5);
      const start = backwards ? randInt(rng, 5, max) : randInt(rng, 1, max - 4);
      const seq = Array.from({ length: 5 }, (_, i) => (backwards ? start - i : start + i));
      const hiddenIdx = tier === 1 ? 4 : randInt(rng, 1, 4);
      const answer = seq[hiddenIdx] as number;
      const base = { skill: "Y1.N.sequence", prompt: backwards ? "Counting backwards. What is missing?" : "What is the missing number?", visual: { kind: "sequence", values: seq.map((v, i) => (i === hiddenIdx ? null : v)) } as Visual, hint: backwards ? "Say the numbers going down, like a countdown." : "Say the numbers in order from the start." };
      return tier === 1 ? numberChoice(rng, base, answer, { min: 0, max, spread: 2 }) : numpad(base, answer);
    }
    if (variant === 2) {
      const n = randInt(rng, 2, max - 1);
      const before = chance(rng, 0.5);
      return numberChoice(rng, { skill: "Y1.N.sequence", prompt: `What number comes just ${before ? "before" : "after"} ${n}?`, visual: { kind: "numberline", from: Math.max(0, n - 4), to: Math.min(max, n + 4), mark: n }, hint: `Count ${before ? "back" : "on"} one from ${n}.` }, before ? n - 1 : n + 1, { min: 0, max, spread: 2 });
    }
    let left = randInt(rng, 1, max);
    let right = randInt(rng, 1, max);
    if (left === right) right = right === max ? right - 1 : right + 1;
    const wantMore = chance(rng, 0.6);
    if (tier < 3) {
      const item = randomItem(rng);
      return visualChoice(rng, { skill: "Y1.N.compare", prompt: `Which group has ${wantMore ? "more" : "fewer"} ${itemName(item, 2)}?`, hint: "Count both groups and compare." }, (wantMore ? left > right : left < right) ? "left" : "right", [
        { value: "left", visual: objects(item, left) },
        { value: "right", visual: objects(item, right) },
      ]);
    }
    const answer = wantMore ? Math.max(left, right) : Math.min(left, right);
    return textChoice(rng, { skill: "Y1.N.compare", prompt: `Which number is ${wantMore ? "bigger" : "smaller"}?`, hint: "Think about which comes later when you count." }, String(answer), [String(answer === left ? right : left)]);
  },
};

const addSub: Trail = {
  id: "y1-addsub",
  name: "Join & Take Away",
  reoName: "Tāpiri, Tango",
  blurb: "Crabs arrive and crabs scuttle off. How many now?",
  icon: "plusminus",
  strand: "number",
  skills: [
    { code: "Y1.N.add10", label: "Add within 10", curriculum: "Year 1 Number: join two sets and find the total by counting all or counting on, to 10" },
    { code: "Y1.N.sub10", label: "Subtract within 10", curriculum: "Year 1 Number: separate a set and say how many are left, within 10" },
  ],
  generate(tier, rng) {
    const total = tier === 1 ? 5 : 10;
    const item = randomItem(rng);
    if (chance(rng, 0.5)) {
      const a = randInt(rng, 1, total - 1);
      const b = randInt(rng, 1, total - a);
      const visual: Visual = tier === 3 && chance(rng, 0.5) ? { kind: "expression", text: `${a} + ${b}` } : { kind: "groups", item, groups: [a, b], operator: "+" };
      const base = { skill: "Y1.N.add10", prompt: `${a} + ${b} = ?`, visual, hint: `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)} more.`, explain: `${a} and ${b} more makes ${a + b}.` };
      return tier === 1 ? numberChoice(rng, base, a + b, { min: 1, max: 6, spread: 2 }) : numpad(base, a + b);
    }
    const a = randInt(rng, 2, total);
    const b = randInt(rng, 1, a);
    const visual: Visual = tier === 3 && chance(rng, 0.5) ? { kind: "expression", text: `${a} − ${b}` } : objects(item, a, b);
    const base = { skill: "Y1.N.sub10", prompt: `${a} − ${b} = ?`, visual, hint: `Start at ${a} and count back ${b}.`, explain: `${a} take away ${b} leaves ${a - b}.` };
    return tier === 1 ? numberChoice(rng, base, a - b, { min: 0, max: 6, spread: 2 }) : numpad(base, a - b);
  },
};

const pairs: Trail = {
  id: "y1-pairs",
  name: "Pāua Pairs",
  reoName: "Ngā Takirua",
  blurb: "Pairs that make 5 and 10, and doubles.",
  icon: "pair",
  strand: "number",
  skills: [
    { code: "Y1.N.partition", label: "Pairs that make 5 and 10", curriculum: "Year 1 Number: know the number bonds of 5 and 10" },
    { code: "Y1.N.doubles", label: "Doubles to 5 + 5", curriculum: "Year 1 Number: know doubles to 10" },
  ],
  generate(tier, rng) {
    if (tier === 3 && chance(rng, 0.5)) {
      const a = randInt(rng, 1, 5);
      return numpad({ skill: "Y1.N.doubles", prompt: `Double ${a} = ?`, visual: { kind: "groups", item: randomItem(rng), groups: [a, a], operator: "+" }, hint: `Double means the same number twice: ${a} + ${a}.` }, a * 2);
    }
    const total = tier === 1 ? 5 : 10;
    const have = randInt(rng, 0, total - 1);
    const base = { skill: "Y1.N.partition", prompt: `${have} and how many more make ${total}?`, visual: { kind: "tenframe", count: have, frames: 1 } as Visual, hint: "Count the empty spaces on the frame.", explain: `${have} + ${total - have} = ${total}.` };
    return tier === 1 ? numberChoice(rng, base, total - have, { min: 0, max: 5, spread: 2 }) : numpad(base, total - have);
  },
};

const PATTERN_SHAPES: PatternToken["shape"][] = ["circle", "square", "triangle", "star", "heart"];
const PATTERN_COLOURS = ["red", "blue", "green", "yellow", "purple"];

function makePattern(r: Rng, unitLen: number): PatternToken[] {
  const shapes = shuffle(r, PATTERN_SHAPES).slice(0, unitLen);
  const colours = shuffle(r, PATTERN_COLOURS).slice(0, unitLen);
  const sameShape = chance(r, 0.4);
  return shapes.map((s, i) => ({ shape: sameShape ? (shapes[0] as PatternToken["shape"]) : s, colour: COLOURS[colours[i] as string] as string }));
}

const patterns: Trail = {
  id: "y1-patterns",
  name: "Pattern Beach",
  reoName: "Tauira",
  blurb: "Shells, stones and stars in a row. What comes next?",
  icon: "pattern",
  strand: "algebra",
  skills: [
    { code: "Y1.A.repeating", label: "Repeating patterns", curriculum: "Year 1 Algebra: copy, continue and describe repeating patterns (AB, ABC)" },
    { code: "Y1.A.skip", label: "Count in 2s and 10s", curriculum: "Year 1 Algebra/Number: skip count in 2s and 10s to 20" },
  ],
  generate(tier, rng) {
    if (tier === 3 && chance(rng, 0.4)) {
      const step = pick(rng, [2, 10]);
      const len = 5;
      const seq = Array.from({ length: len }, (_, i) => (i + 1) * step);
      const hiddenIdx = randInt(rng, 2, len - 1);
      return numberChoice(rng, { skill: "Y1.A.skip", prompt: `Counting in ${step}s. What is missing?`, visual: { kind: "sequence", values: seq.map((v, i) => (i === hiddenIdx ? null : v)) }, hint: `Each jump adds ${step}.` }, seq[hiddenIdx] as number, { min: 0, max: step * 6, candidates: [seq[hiddenIdx]! + 1, seq[hiddenIdx]! - 1, seq[hiddenIdx]! + step] });
    }
    const unitLen = tier === 1 ? 2 : tier === 2 ? pick(rng, [2, 3]) : pick(rng, [3, 4]);
    const unit = makePattern(rng, unitLen);
    const repeats = tier === 1 ? 3 : 2;
    const tokens: PatternToken[] = [];
    for (let i = 0; i < repeats * unitLen + (tier === 1 ? 0 : 1); i++) tokens.push(unit[i % unitLen] as PatternToken);
    const missing = tier === 1 ? tokens.length : randInt(rng, unitLen, tokens.length - 1);
    const full = [...tokens];
    if (missing === tokens.length) full.push(unit[tokens.length % unitLen] as PatternToken);
    const answerTok = full[missing] as PatternToken;
    const wrong = unit.filter((t) => t !== answerTok);
    const extra: PatternToken = { shape: pick(rng, PATTERN_SHAPES.filter((s) => s !== answerTok.shape)), colour: COLOURS[pick(rng, PATTERN_COLOURS)] as string };
    const opts = [answerTok, ...wrong, extra].slice(0, 4);
    const key = (t: PatternToken) => `${t.shape}:${t.colour}`;
    const uniq = opts.filter((t, i) => opts.findIndex((u) => key(u) === key(t)) === i);
    return visualChoice(
      rng,
      { skill: "Y1.A.repeating", prompt: missing === tokens.length ? "What comes next in the pattern?" : "Which one is missing from the pattern?", visual: { kind: "pattern", tokens: full, missing }, hint: "Say the pattern out loud. Find the part that repeats." },
      key(answerTok),
      uniq.map((t) => ({ value: key(t), visual: { kind: "pattern", tokens: [t] } as Visual })),
    );
  },
};

const measure: Trail = {
  id: "y1-measure",
  name: "Longer & Heavier",
  reoName: "Ine",
  blurb: "Which stick is longer? Which bucket holds more?",
  icon: "ruler",
  strand: "measurement",
  skills: [
    { code: "Y1.M.length", label: "Compare lengths", curriculum: "Year 1 Measurement: compare and order objects by length directly (longer, shorter, tallest)" },
    { code: "Y1.M.mass", label: "Compare mass", curriculum: "Year 1 Measurement: compare objects by mass (heavier, lighter) using a balance" },
    { code: "Y1.M.capacity", label: "Compare capacity", curriculum: "Year 1 Measurement: compare containers by how much they hold (more, less, full, empty)" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const count = tier === 1 ? 2 : 3;
      const lengths = shuffle(rng, [2, 4, 6, 8, 10]).slice(0, count);
      const names = ["A", "B", "C"].slice(0, count);
      const bars = names.map((label, i) => ({ label, length: lengths[i] as number }));
      const wantLong = chance(rng, 0.5);
      const target = wantLong ? Math.max(...lengths) : Math.min(...lengths);
      const answer = bars.find((b) => b.length === target)!.label;
      const word = count === 2 ? (wantLong ? "longer" : "shorter") : wantLong ? "the longest" : "the shortest";
      return textChoice(rng, { skill: "Y1.M.length", prompt: `Which stick is ${word}?`, visual: { kind: "lengths", bars }, hint: "Line them up from the same end and compare." }, answer, names.filter((n) => n !== answer));
    }
    if (variant === 1) {
      const a = randomItem(rng);
      let b = randomItem(rng);
      while (b === a) b = randomItem(rng);
      const heavierLeft = chance(rng, 0.5);
      const wantHeavier = chance(rng, 0.5);
      const answerSide = heavierLeft === wantHeavier ? "left" : "right";
      return visualChoice(
        rng,
        { skill: "Y1.M.mass", prompt: `Which side is ${wantHeavier ? "heavier" : "lighter"}?`, visual: { kind: "balance", left: { item: a, count: tier === 1 ? 1 : randInt(rng, 1, 3) }, right: { item: b, count: tier === 1 ? 1 : randInt(rng, 1, 3) }, tilt: heavierLeft ? "left" : "right" }, hint: "The heavier side of a balance goes down." },
        answerSide,
        [
          { value: "left", label: "Left side" },
          { value: "right", label: "Right side" },
        ],
      );
    }
    const count = tier === 1 ? 2 : 3;
    const levels = shuffle(rng, [0.2, 0.5, 0.8, 1]).slice(0, count);
    const wantMore = chance(rng, 0.5);
    const target = wantMore ? Math.max(...levels) : Math.min(...levels);
    const idx = levels.indexOf(target);
    const labels = ["A", "B", "C"].slice(0, count);
    return textChoice(rng, { skill: "Y1.M.capacity", prompt: `Which container has ${wantMore ? "the most" : "the least"} water?`, visual: { kind: "containers", levels }, hint: "Look at how high the water goes in each one." }, labels[idx] as string, labels.filter((_, i) => i !== idx));
  },
};

const time: Trail = {
  id: "y1-time",
  name: "Sunrise to Starlight",
  reoName: "Te Wā",
  blurb: "Days of the week, times of day and o'clock.",
  icon: "clock",
  strand: "measurement",
  skills: [
    { code: "Y1.M.sequence", label: "Sequence events and days", curriculum: "Year 1 Measurement: order events in a day and know the days of the week" },
    { code: "Y1.M.oclock", label: "O'clock times", curriculum: "Year 1 Measurement: read o'clock times on an analogue clock (introduced)" },
  ],
  generate(tier, rng) {
    if (tier === 1 || (tier === 2 && chance(rng, 0.5))) {
      const i = randInt(rng, 0, 6);
      const after = chance(rng, 0.6);
      const answer = DAYS[(i + (after ? 1 : 6)) % 7] as string;
      const wrong = shuffle(rng, DAYS.filter((d) => d !== answer)).slice(0, 3);
      return textChoice(rng, { skill: "Y1.M.sequence", prompt: `What day comes ${after ? "after" : "before"} ${DAYS[i]}?`, visual: { kind: "text", text: DAYS[i] as string }, hint: "Say the days in order: Monday, Tuesday, Wednesday…" }, answer, wrong);
    }
    if (tier === 2 && chance(rng, 0.5)) {
      const events = [
        ["wake up", "eat breakfast", "go to school"],
        ["eat lunch", "play outside", "eat dinner"],
        ["have a bath", "read a story", "go to sleep"],
      ];
      const trio = pick(rng, events);
      const which = chance(rng, 0.5) ? "first" : "last";
      const answer = which === "first" ? trio[0] : trio[2];
      return textChoice(rng, { skill: "Y1.M.sequence", prompt: `Which of these happens ${which}?`, hint: "Think about the order of your day." }, answer as string, trio.filter((e) => e !== answer));
    }
    const hour = randInt(rng, 1, 12);
    if (chance(rng, 0.5)) {
      const wrongHours = numericDistractors(rng, hour, 3, { min: 1, max: 12, spread: 3 });
      return textChoice(rng, { skill: "Y1.M.oclock", prompt: "What time does the clock show?", visual: { kind: "clock", hour, minute: 0 }, hint: "The short hand points to the hour. The long hand on 12 means o'clock." }, timeWords(hour, 0), wrongHours.map((h) => timeWords(h, 0)));
    }
    const wrongHours = numericDistractors(rng, hour, 2, { min: 1, max: 12, spread: 3 });
    return visualChoice(rng, { skill: "Y1.M.oclock", prompt: `Which clock shows ${timeWords(hour, 0)}?`, hint: "Find the clock whose short hand points to that number." }, String(hour), [hour, ...wrongHours].map((h) => ({ value: String(h), visual: { kind: "clock", hour: h, minute: 0 } as Visual })));
  },
};

const SHAPES_2D: ShapeName[] = ["circle", "triangle", "square", "rectangle"];
const SHAPES_3D: ShapeName[] = ["cube", "sphere", "cylinder", "cone"];
const SHAPE_SIDES: Partial<Record<ShapeName, number>> = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, circle: 0 };
const CREATURES: CreatureName[] = ["kiwi", "tui", "fantail", "weta", "tuatara", "pukeko"];

const shapes: Trail = {
  id: "y1-shapes",
  name: "Shape Hunt",
  reoName: "Ngā Āhua",
  blurb: "Spot shapes in the sand and say where the creatures are.",
  icon: "shapes",
  strand: "geometry",
  skills: [
    { code: "Y1.G.shapes2d", label: "Name 2D shapes", curriculum: "Year 1 Geometry: identify and name circles, triangles, squares and rectangles" },
    { code: "Y1.G.shapes3d", label: "Name 3D objects", curriculum: "Year 1 Geometry: identify cubes, spheres, cylinders and cones" },
    { code: "Y1.G.position", label: "Position words", curriculum: "Year 1 Geometry: describe position using above, below, left, right, inside, on" },
  ],
  generate(tier, rng) {
    const variant = tier === 1 ? randInt(rng, 0, 1) : randInt(rng, 0, 3);
    if (variant === 0) {
      const shape = pick(rng, SHAPES_2D);
      const wrong = SHAPES_2D.filter((s) => s !== shape);
      if (chance(rng, 0.5)) {
        return visualChoice(rng, { skill: "Y1.G.shapes2d", prompt: `Which shape is a ${shape}?`, hint: shape === "circle" ? "A circle is perfectly round." : `Count the sides: a ${shape} has ${SHAPE_SIDES[shape]}.` }, shape, [shape, ...wrong].map((s) => ({ value: s, visual: { kind: "shape", shape: s } as Visual })));
      }
      return textChoice(rng, { skill: "Y1.G.shapes2d", prompt: "What is this shape called?", visual: { kind: "shape", shape }, hint: "Count the sides and corners." }, shape, wrong);
    }
    if (variant === 1) {
      const place = pick(rng, ["above", "below", "left", "right", "inside", "on"] as const);
      const creature = pick(rng, CREATURES);
      const words: Record<typeof place, string> = { above: "above the tree", below: "below the tree", left: "to the left of the tree", right: "to the right of the tree", inside: "inside the nest", on: "on the rock" };
      const wrong = shuffle(rng, (Object.keys(words) as (typeof place)[]).filter((p) => p !== place)).slice(0, 3);
      return textChoice(rng, { skill: "Y1.G.position", prompt: `Where is the ${creatureName(creature)}?`, visual: { kind: "position", creature, place }, hint: "Look carefully at where the creature is sitting." }, words[place], wrong.map((w) => words[w]));
    }
    if (variant === 2) {
      const shape = pick(rng, SHAPES_3D);
      const wrong = SHAPES_3D.filter((s) => s !== shape);
      return visualChoice(rng, { skill: "Y1.G.shapes3d", prompt: `Which one is a ${shape}?`, hint: shape === "sphere" ? "A sphere is round like a ball." : shape === "cube" ? "A cube has square faces, like a dice." : shape === "cylinder" ? "A cylinder is like a can." : "A cone has a point at the top, like an ice-cream cone." }, shape, [shape, ...wrong].map((s) => ({ value: s, visual: { kind: "shape", shape: s } as Visual })));
    }
    const shape = pick(rng, ["triangle", "square", "rectangle"] as ShapeName[]);
    const askSides = chance(rng, 0.5);
    return numberChoice(rng, { skill: "Y1.G.shapes2d", prompt: `How many ${askSides ? "sides" : "corners"} does this shape have?`, visual: { kind: "shape", shape }, hint: askSides ? "Run your finger along each straight edge." : "Touch each pointy corner as you count." }, SHAPE_SIDES[shape] as number, { min: 0, max: 6, spread: 2 });
  },
};

const data: Trail = {
  id: "y1-data",
  name: "Sort & Count",
  reoName: "Raraunga",
  blurb: "Sort the beach finds and read a picture graph.",
  icon: "chart",
  strand: "statistics",
  skills: [
    { code: "Y1.S.sort", label: "Sort into groups", curriculum: "Year 1 Statistics: sort objects into categories and count each group" },
    { code: "Y1.S.pictograph", label: "Read a picture graph", curriculum: "Year 1 Statistics: answer questions about a simple picture graph (one picture per object)" },
  ],
  generate(tier, rng) {
    const item = randomItem(rng);
    const labels = shuffle(rng, ["Kai", "Aroha", "Tom", "Mia"]).slice(0, tier === 1 ? 2 : 3);
    const counts = labels.map(() => randInt(rng, 1, tier === 1 ? 5 : 8));
    if (new Set(counts).size !== counts.length) return data.generate(tier, rng);
    const rows = labels.map((label, i) => ({ label, count: counts[i] as number }));
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const wantMost = chance(rng, 0.5);
      const target = wantMost ? Math.max(...counts) : Math.min(...counts);
      const answer = rows.find((r) => r.count === target)!.label;
      return textChoice(rng, { skill: "Y1.S.pictograph", prompt: `Who collected the ${wantMost ? "most" : "fewest"} ${itemName(item, 2)}?`, visual: { kind: "pictograph", item, rows }, hint: "Count the pictures in each row." }, answer, labels.filter((l) => l !== answer));
    }
    if (variant === 1) {
      const row = pick(rng, rows);
      return numberChoice(rng, { skill: "Y1.S.pictograph", prompt: `How many ${itemName(item, 2)} did ${row.label} collect?`, visual: { kind: "pictograph", item, rows }, hint: `Find ${row.label}'s row and count the pictures.` }, row.count, { min: 0, max: 10, spread: 2 });
    }
    const groups: { name: string; item: typeof item }[] = [{ name: "shells", item: "shell" }, { name: "feathers", item: "feather" }, { name: "stones", item: "stone" }, { name: "leaves", item: "leaf" }];
    const chosen = pick(rng, groups);
    const wrong = groups.filter((g) => g !== chosen).map((g) => g.name);
    return textChoice(rng, { skill: "Y1.S.sort", prompt: "Which group does this belong in?", visual: { kind: "objects", item: chosen.item, count: 1 }, hint: "Look at what kind of thing it is." }, chosen.name, wrong);
  },
};

const chanceTrail: Trail = {
  id: "y1-chance",
  name: "Will It Happen?",
  reoName: "Tūponotanga",
  blurb: "Will, won't or might: talk about what could happen.",
  icon: "dice",
  strand: "probability",
  skills: [
    { code: "Y1.P.language", label: "Chance language", curriculum: "Year 1 Probability: use everyday chance language (will happen, won't happen, might happen)" },
  ],
  generate(tier, rng) {
    const statements: { text: string; answer: "will happen" | "won't happen" | "might happen" }[] = [
      { text: "The sun will come up tomorrow morning.", answer: "will happen" },
      { text: "A kiwi will fly to the moon.", answer: "won't happen" },
      { text: "It will rain at the beach tomorrow.", answer: "might happen" },
      { text: "You will grow older next year.", answer: "will happen" },
      { text: "A fish will walk to school.", answer: "won't happen" },
      { text: "You will find a shell on the beach today.", answer: "might happen" },
      { text: "Tomorrow will come after today.", answer: "will happen" },
      { text: "A rock will turn into a bird.", answer: "won't happen" },
      { text: "A tūī will sing in the garden today.", answer: "might happen" },
      { text: "Night will come after the day.", answer: "will happen" },
      { text: "You will see a whale from the classroom.", answer: "might happen" },
      { text: "The sea will turn into orange juice.", answer: "won't happen" },
    ];
    if (tier === 3 && chance(rng, 0.5)) {
      const colour = pick(rng, ["red", "blue", "green"]);
      const other = pick(rng, ["red", "blue", "green"].filter((c) => c !== colour));
      const kind = randInt(rng, 0, 2);
      const contents = kind === 0 ? [{ colour, count: 5 }] : kind === 1 ? [{ colour: other, count: 5 }] : [{ colour, count: 3 }, { colour: other, count: 2 }];
      const answer = kind === 0 ? "will happen" : kind === 1 ? "won't happen" : "might happen";
      return textChoice(rng, { skill: "Y1.P.language", prompt: `You pick one berry without looking. Picking a ${colour} berry…`, visual: { kind: "bag", contents }, hint: "Look at which colours are in the bag." }, answer, ["will happen", "won't happen", "might happen"]);
    }
    const s = pick(rng, statements);
    return textChoice(rng, { skill: "Y1.P.language", prompt: s.text, visual: { kind: "text", text: "?" }, hint: "Is it certain, impossible, or could it go either way?" }, s.answer, ["will happen", "won't happen", "might happen"]);
  },
};

export const region1: Region = {
  id: "golden-beach",
  index: 0,
  name: "Golden Beach",
  reoName: "Te Tāhuna",
  yearLabel: "Year 1 · age 5",
  year: 1,
  colour: "#f59e0b",
  blurb: "Warm sand, rock pools and the start of every explorer's journey.",
  trails: [counting, numbers, addSub, pairs, patterns, measure, time, shapes, data, chanceTrail],
  rescue: { creature: "penguin", name: "Little blue penguin", reoName: "Kororā", fact: "Kororā are the smallest penguins in the world. They come ashore at night to nest in burrows." },
};
