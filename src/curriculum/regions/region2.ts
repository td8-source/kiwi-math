/**
 * Region 2 · Kauri Forest · Te Wao Nui · Year 2 (age 6)
 * Te Mātaiaho Phase 1, Year 2: numbers to 100, skip counting, tens and ones, addition and
 * subtraction facts to 20, equal groups and halves/quarters, missing-number equations and
 * patterns, measuring with informal units, o'clock and half past, NZ coins, months,
 * 2D/3D shape properties and symmetry, pictographs/tally/bar charts, and likelihood language.
 */
import type { PatternToken, Region, ShapeName, Trail, Visual } from "../types";
import { chance, pick, randInt, shuffle } from "../rng";
import { COLOURS, DAYS, MONTHS, NZ_COINS, colourHex, itemName, money, numberChoice, numericDistractors, numpad, randomItem, textChoice, timeWords, digitalTime, trueFalse, visualChoice, creatureName } from "../helpers";

const count100: Trail = {
  id: "y2-count100",
  name: "Hundred Tree",
  reoName: "Kotahi Rau",
  blurb: "Climb the giant kauri, one number at a time, up to 100.",
  icon: "grid",
  strand: "number",
  skills: [
    { code: "Y2.N.count100", label: "Count to 100", curriculum: "Year 2 Number: read, say and order numbers to 100; count forwards and backwards from any number" },
    { code: "Y2.N.hundredChart", label: "Hundred chart patterns", curriculum: "Year 2 Number: use the hundreds chart to find numbers and patterns" },
  ],
  generate(tier, rng) {
    if (tier === 1 || (tier === 3 && chance(rng, 0.4))) {
      const backwards = tier === 3 && chance(rng, 0.5);
      const start = backwards ? randInt(rng, 15, 100) : randInt(rng, 5, 95);
      const seq = Array.from({ length: 5 }, (_, i) => (backwards ? start - i : start + i));
      const hiddenIdx = randInt(rng, 1, 4);
      const answer = seq[hiddenIdx] as number;
      const base = { skill: "Y2.N.count100", prompt: backwards ? "Counting backwards. What is missing?" : "What is the missing number?", visual: { kind: "sequence", values: seq.map((v, i) => (i === hiddenIdx ? null : v)) } as Visual, hint: backwards ? "Count down one at a time." : "Count up one at a time." };
      return tier === 1 ? numberChoice(rng, base, answer, { min: 0, max: 100, spread: 3 }) : numpad(base, answer);
    }
    const size = tier === 2 ? 3 : 4;
    const row = randInt(rng, 0, 9 - (size - 1));
    const col = randInt(rng, 0, 9 - (size - 1));
    const start = row * 10 + col + 1;
    const answer = start + randInt(rng, 0, size - 1) * 10 + randInt(rng, 0, size - 1);
    return numpad({ skill: "Y2.N.hundredChart", prompt: "This is part of a hundred chart. What number is hidden?", visual: { kind: "hundredchart", start, hidden: [answer], size }, hint: "Going down a row adds 10. Going right adds 1." }, answer);
  },
};

const skip: Trail = {
  id: "y2-skip",
  name: "Hopping Stones",
  reoName: "Tatau Peke",
  blurb: "Hop across the stream in 2s, 5s and 10s.",
  icon: "hop",
  strand: "number",
  strand2: "algebra",
  skills: [
    { code: "Y2.N.skip", label: "Skip count in 2s, 5s and 10s", curriculum: "Year 2 Number/Algebra: skip count forwards in 2s, 5s and 10s to 100" },
  ],
  generate(tier, rng) {
    const step = pick(rng, tier === 1 ? [2, 10] : [2, 5, 10]);
    const max = tier === 3 ? 100 : step * 10;
    const len = 5;
    const startK = tier === 3 ? randInt(rng, 0, Math.floor(max / step) - len) : 0;
    const backwards = tier === 3 && chance(rng, 0.3);
    const seq = Array.from({ length: len }, (_, i) => (backwards ? startK + len - i : startK + i + 1) * step);
    const hiddenIdx = tier === 1 ? len - 1 : randInt(rng, 1, len - 1);
    const answer = seq[hiddenIdx] as number;
    const base = { skill: "Y2.N.skip", prompt: `Counting in ${step}s. What is the missing number?`, visual: { kind: "sequence", values: seq.map((v, i) => (i === hiddenIdx ? null : v)) } as Visual, hint: `Each hop adds ${step}.` };
    return tier === 1 ? numberChoice(rng, base, answer, { min: 0, max: max + 10, candidates: [answer + step, answer - step, answer + 1] }) : numpad(base, answer);
  },
};

const place: Trail = {
  id: "y2-place",
  name: "Tens & Ones",
  reoName: "Tekau me te Tahi",
  blurb: "Bundles of ten sticks and loose ones.",
  icon: "blocks",
  strand: "number",
  skills: [
    { code: "Y2.N.tensOnes", label: "Tens and ones", curriculum: "Year 2 Number: understand two-digit numbers as tens and ones" },
    { code: "Y2.N.tenMoreLess", label: "10 more, 10 less", curriculum: "Year 2 Number: find 10 more or 10 less than a two-digit number" },
  ],
  generate(tier, rng) {
    const tens = randInt(rng, 1, tier === 1 ? 5 : 9);
    const ones = randInt(rng, 0, 9);
    const n = tens * 10 + ones;
    const variant = tier === 1 ? 0 : randInt(rng, 0, 3);
    if (variant === 0) {
      const base = { skill: "Y2.N.tensOnes", prompt: "What number do the blocks show?", visual: { kind: "blocks", tens, ones } as Visual, hint: "Count the tens: 10, 20, 30… then count on the ones." };
      return tier === 1 ? numberChoice(rng, base, n, { min: 1, max: 99, candidates: [tens + ones, ones * 10 + tens, n + 10] }) : numpad(base, n);
    }
    if (variant === 1) {
      const askTens = chance(rng, 0.5);
      return numberChoice(rng, { skill: "Y2.N.tensOnes", prompt: `How many ${askTens ? "tens" : "ones"} are in ${n}?`, visual: { kind: "text", text: String(n) }, hint: `${n} is ${tens} tens and ${ones} ones.` }, askTens ? tens : ones, { min: 0, max: 9, candidates: askTens ? [ones] : [tens] });
    }
    if (variant === 2) {
      return numberChoice(rng, { skill: "Y2.N.tensOnes", prompt: `Which number is ${tens} tens and ${ones} ones?`, hint: "Tens are the first digit, ones are the last." }, n, { min: 1, max: 99, candidates: [ones * 10 + tens, tens + ones, n + 1] });
    }
    const more = chance(rng, 0.5);
    const safe = more ? Math.min(n, 89) : Math.max(n, 20);
    return numpad({ skill: "Y2.N.tenMoreLess", prompt: `What is 10 ${more ? "more" : "less"} than ${safe}?`, visual: { kind: "blocks", tens: Math.floor(safe / 10), ones: safe % 10 }, hint: `${more ? "Add" : "Take away"} one bundle of ten. The ones stay the same.` }, more ? safe + 10 : safe - 10);
  },
};

const facts: Trail = {
  id: "y2-facts",
  name: "Fast Facts Falls",
  reoName: "Meka Tere",
  blurb: "Quick adding and taking away to 20.",
  icon: "bolt",
  strand: "number",
  skills: [
    { code: "Y2.N.facts10", label: "Facts to 10", curriculum: "Year 2 Number: recall addition and subtraction facts to 10" },
    { code: "Y2.N.facts20", label: "Facts to 20", curriculum: "Year 2 Number: add and subtract to 20 using doubles, near doubles and making ten" },
  ],
  generate(tier, rng) {
    if (tier === 1 || (tier === 2 && chance(rng, 0.4))) {
      const sub = chance(rng, 0.4);
      if (!sub) {
        const a = randInt(rng, 1, 9);
        const b = randInt(rng, 1, 10 - a);
        const base = { skill: "Y2.N.facts10", prompt: `${a} + ${b} = ?`, visual: (tier === 1 ? { kind: "tenframe", count: a, secondColour: b } : { kind: "expression", text: `${a} + ${b}` }) as Visual, hint: `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)}.` };
        return tier === 1 ? numberChoice(rng, base, a + b, { min: 0, max: 10, spread: 2 }) : numpad(base, a + b);
      }
      const a = randInt(rng, 3, 10);
      const b = randInt(rng, 1, a);
      const base = { skill: "Y2.N.facts10", prompt: `${a} − ${b} = ?`, visual: (tier === 1 ? { kind: "objects", item: randomItem(rng), count: a, crossed: b } : { kind: "expression", text: `${a} − ${b}` }) as Visual, hint: `Think: ${b} and what makes ${a}?` };
      return tier === 1 ? numberChoice(rng, base, a - b, { min: 0, max: 10, spread: 2 }) : numpad(base, a - b);
    }
    const variant = randInt(rng, 0, 3);
    if (variant === 0) {
      const a = randInt(rng, 3, 10);
      return numpad({ skill: "Y2.N.facts20", prompt: `Double ${a} = ?`, visual: { kind: "groups", item: randomItem(rng), groups: [a, a], operator: "+" }, hint: `${a} + ${a}.` }, a * 2);
    }
    if (variant === 1) {
      const a = randInt(rng, 3, 9);
      const b = chance(rng, 0.5) ? a + 1 : a - 1;
      return numpad({ skill: "Y2.N.facts20", prompt: `${a} + ${b} = ?`, visual: { kind: "expression", text: `${a} + ${b}` }, hint: `Nearly a double! Double ${Math.min(a, b)} and add 1.` }, a + b);
    }
    if (variant === 2) {
      const a = randInt(rng, 6, 9);
      const b = randInt(rng, 11 - a, 9);
      return numpad({ skill: "Y2.N.facts20", prompt: `${a} + ${b} = ?`, visual: { kind: "tenframe", count: a, frames: 2, secondColour: b }, hint: `Fill the first ten frame: ${a} + ${10 - a} = 10, then add the rest.` }, a + b);
    }
    const a = randInt(rng, 11, 18);
    const b = randInt(rng, a - 9, 9);
    return numpad({ skill: "Y2.N.facts20", prompt: `${a} − ${b} = ?`, visual: { kind: "expression", text: `${a} − ${b}` }, hint: `Take away ${a - 10} to get to 10, then take away the rest.` }, a - b);
  },
};

const groups: Trail = {
  id: "y2-groups",
  name: "Equal Groups & Halves",
  reoName: "Rōpū Ōrite",
  blurb: "Share the berries fairly, and cut things in half.",
  icon: "pie",
  strand: "number",
  skills: [
    { code: "Y2.N.equalGroups", label: "Equal groups and sharing", curriculum: "Year 2 Number: find totals of equal groups and share sets equally" },
    { code: "Y2.N.oddEven", label: "Odd and even", curriculum: "Year 2 Number: identify odd and even numbers" },
    { code: "Y2.N.halves", label: "Halves and quarters", curriculum: "Year 2 Number: find halves and quarters of shapes and sets" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 3);
    const item = randomItem(rng);
    if (variant === 0) {
      const g = randInt(rng, 2, tier === 1 ? 3 : 5);
      const each = pick(rng, tier === 1 ? [2, 5] : [2, 3, 4, 5, 10]);
      const base = { skill: "Y2.N.equalGroups", prompt: `${g} groups of ${each}. How many ${itemName(item, 2)} altogether?`, visual: { kind: "groups", item, groups: Array(g).fill(each) } as Visual, hint: `Count in ${each}s.` };
      return tier === 1 ? numberChoice(rng, base, g * each, { min: 1, max: 30, candidates: [g + each, g * each + each] }) : numpad(base, g * each);
    }
    if (variant === 1) {
      const between = pick(rng, tier === 1 ? [2] : [2, 3, 4]);
      const each = randInt(rng, 1, 5);
      const total = between * each;
      const base = { skill: "Y2.N.equalGroups", prompt: `Share ${total} ${itemName(item, total)} equally between ${between} friends. How many each?`, visual: { kind: "objects", item, count: total } as Visual, hint: `Deal them out one at a time.` };
      return tier === 1 ? numberChoice(rng, base, each, { min: 1, max: 10, candidates: [total, between] }) : numpad(base, each);
    }
    if (variant === 2) {
      const n = randInt(rng, 1, tier === 1 ? 10 : tier === 2 ? 20 : 50);
      return textChoice(rng, { skill: "Y2.N.oddEven", prompt: `Is ${n} odd or even?`, visual: tier < 3 ? { kind: "objects", item, count: n } : { kind: "text", text: String(n) }, hint: "Even numbers make pairs with none left over. They end in 0, 2, 4, 6 or 8." }, n % 2 === 0 ? "Even" : "Odd", [n % 2 === 0 ? "Odd" : "Even"]);
    }
    if (tier === 1) {
      const parts = pick(rng, [2, 4]);
      const shape = pick(rng, ["circle", "bar"] as const);
      const wrongParts = shuffle(rng, [2, 3, 4, 5].filter((p) => p !== parts)).slice(0, 2);
      return visualChoice(rng, { skill: "Y2.N.halves", prompt: `Which shape has one ${parts === 2 ? "half" : "quarter"} shaded?`, hint: `One ${parts === 2 ? "half" : "quarter"} means ${parts} equal parts with 1 coloured.` }, String(parts), [{ value: String(parts), visual: { kind: "fraction", parts, shaded: 1, shape } as Visual }, ...wrongParts.map((p) => ({ value: String(p), visual: { kind: "fraction", parts: p, shaded: 1, shape } as Visual }))]);
    }
    const half = randInt(rng, 1, 10);
    const total = half * 2;
    const quarter = tier === 3 && total % 4 === 0 && chance(rng, 0.5);
    return numpad({ skill: "Y2.N.halves", prompt: `What is ${quarter ? "a quarter" : "half"} of ${total}?`, visual: { kind: "objects", item, count: total }, hint: quarter ? "Halve it, then halve it again." : "Split them into two equal groups." }, quarter ? total / 4 : half);
  },
};

const algebra: Trail = {
  id: "y2-algebra",
  name: "Mystery Ferns",
  reoName: "Ngā Mea Ngaro",
  blurb: "Find the hidden numbers and the next fern in the pattern.",
  icon: "puzzle",
  strand: "algebra",
  skills: [
    { code: "Y2.A.missing", label: "Missing numbers in equations", curriculum: "Year 2 Algebra: find the unknown in addition and subtraction equations" },
    { code: "Y2.A.equals", label: "Equal or not equal", curriculum: "Year 2 Algebra: understand = as 'the same as' (4 + 3 = 5 + 2)" },
    { code: "Y2.A.patterns", label: "Repeating and growing patterns", curriculum: "Year 2 Algebra: continue repeating patterns with 3-4 elements and simple growing number patterns" },
  ],
  generate(tier, rng) {
    const variant = tier === 1 ? randInt(rng, 0, 1) : randInt(rng, 0, 3);
    if (variant === 0) {
      const max = tier === 1 ? 10 : 20;
      const total = randInt(rng, 4, max);
      const a = randInt(rng, 1, total - 1);
      const b = total - a;
      const hideFirst = tier > 1 && chance(rng, 0.4);
      const text = hideFirst ? `☐ + ${b} = ${total}` : `${a} + ☐ = ${total}`;
      const answer = hideFirst ? a : b;
      const base = { skill: "Y2.A.missing", prompt: "What number goes in the box?", visual: { kind: "expression", text } as Visual, hint: `Count on from ${hideFirst ? b : a} up to ${total}.` };
      return tier === 1 ? numberChoice(rng, base, answer, { min: 0, max, spread: 2 }) : numpad(base, answer);
    }
    if (variant === 1) {
      const shapes: PatternToken["shape"][] = ["circle", "square", "triangle", "star", "heart"];
      const colours = ["red", "blue", "green", "yellow", "purple"];
      const unitLen = tier === 1 ? 2 : tier === 2 ? 3 : 4;
      const unit: PatternToken[] = shuffle(rng, shapes).slice(0, unitLen).map((shape, i) => ({ shape, colour: COLOURS[colours[i] as string] as string }));
      const len = unitLen * 2 + 1;
      const tokens = Array.from({ length: len + 1 }, (_, i) => unit[i % unitLen] as PatternToken);
      const missing = tier === 1 ? len : randInt(rng, unitLen, len);
      const answerTok = tokens[missing] as PatternToken;
      const key = (t: PatternToken) => `${t.shape}:${t.colour}`;
      const opts = [answerTok, ...unit.filter((t) => t !== answerTok)].slice(0, 4);
      return visualChoice(rng, { skill: "Y2.A.patterns", prompt: missing === len ? "What comes next in the pattern?" : "Which one is missing?", visual: { kind: "pattern", tokens: tokens.slice(0, len + 1), missing }, hint: "Find the part that repeats, then keep it going." }, key(answerTok), opts.map((t) => ({ value: key(t), visual: { kind: "pattern", tokens: [t] } as Visual })));
    }
    if (variant === 2) {
      const a = randInt(rng, 4, 20);
      const b = randInt(rng, 1, a - 1);
      const hideFirst = chance(rng, 0.4);
      const text = hideFirst ? `☐ − ${b} = ${a - b}` : `${a} − ☐ = ${a - b}`;
      return numpad({ skill: "Y2.A.missing", prompt: "What number goes in the box?", visual: { kind: "expression", text }, hint: hideFirst ? `Add ${b} and ${a - b} back together.` : `What do you take from ${a} to leave ${a - b}?` }, hideFirst ? a : b);
    }
    const a = randInt(rng, 1, 9);
    const b = randInt(rng, 1, 9);
    const c = randInt(rng, 1, 9);
    const isTrue = chance(rng, 0.5);
    const d = isTrue ? a + b - c : a + b - c + (chance(rng, 0.5) ? 1 : -1);
    if (d < 0 || d > 12) return algebra.generate(tier, rng);
    return trueFalse({ skill: "Y2.A.equals", prompt: "Is this true or false?", visual: { kind: "expression", text: `${a} + ${b} = ${c} + ${d}` }, hint: "Work out both sides. Are they the same?" }, isTrue);
  },
};

const units: Trail = {
  id: "y2-units",
  name: "Measuring with Leaves",
  reoName: "Ine ki te Rau",
  blurb: "How many leaves long? How many cups full?",
  icon: "ruler",
  strand: "measurement",
  skills: [
    { code: "Y2.M.informalLength", label: "Measure length with units", curriculum: "Year 2 Measurement: measure and compare length using informal units (hands, leaves, blocks)" },
    { code: "Y2.M.informalMass", label: "Compare mass with a balance", curriculum: "Year 2 Measurement: compare and order mass using a balance and informal units" },
    { code: "Y2.M.informalCapacity", label: "Measure capacity with cups", curriculum: "Year 2 Measurement: measure and compare capacity using informal units (cups, scoops)" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const len = randInt(rng, tier === 1 ? 2 : 3, tier === 1 ? 6 : 10);
      const base = { skill: "Y2.M.informalLength", prompt: "How many leaves long is the stick?", visual: { kind: "ruler", length: len, max: 10, unit: "leaf" } as Visual, hint: "Count the leaves from one end of the stick to the other." };
      return tier === 1 ? numberChoice(rng, base, len, { min: 1, max: 10, spread: 2 }) : numpad(base, len);
    }
    if (variant === 1) {
      const a = randomItem(rng);
      let b = randomItem(rng);
      while (b === a) b = randomItem(rng);
      const left = randInt(rng, 1, 5);
      let right = randInt(rng, 1, 5);
      if (right === left) right = left === 5 ? 4 : left + 1;
      const tilt = left > right ? "left" : "right";
      const wantHeavier = chance(rng, 0.5);
      return visualChoice(rng, { skill: "Y2.M.informalMass", prompt: `Which side is ${wantHeavier ? "heavier" : "lighter"}?`, visual: { kind: "balance", left: { item: a, count: left }, right: { item: b, count: right }, tilt }, hint: "The heavier side of the balance goes down." }, (tilt === "left") === wantHeavier ? "left" : "right", [
        { value: "left", label: "Left side" },
        { value: "right", label: "Right side" },
      ]);
    }
    const cups = randInt(rng, 2, tier === 1 ? 6 : 10);
    const base = { skill: "Y2.M.informalCapacity", prompt: "How many cups of water did it take to fill the bucket?", visual: { kind: "objects", item: "cup" as const, count: cups } as Visual, hint: "Count the cups that were poured in." };
    if (tier === 1) return numberChoice(rng, base, cups, { min: 1, max: 10, spread: 2 });
    const levels = shuffle(rng, [0.25, 0.5, 0.75, 1]).slice(0, 3);
    const order = [...levels].sort((x, y) => y - x);
    const labels = ["A", "B", "C"];
    const answer = order.map((l) => labels[levels.indexOf(l)]).join(", ");
    const wrong = [[...order].reverse().map((l) => labels[levels.indexOf(l)]).join(", "), labels.join(", ")].filter((w) => w !== answer);
    return textChoice(rng, { skill: "Y2.M.informalCapacity", prompt: "Order the containers from most water to least.", visual: { kind: "containers", levels }, hint: "Start with the fullest one." }, answer, wrong);
  },
};

const timeMoney: Trail = {
  id: "y2-timemoney",
  name: "Clocks & Coins",
  reoName: "Karaka me te Moni",
  blurb: "Half past, o'clock, months and New Zealand coins.",
  icon: "clock",
  strand: "measurement",
  skills: [
    { code: "Y2.M.halfPast", label: "O'clock and half past", curriculum: "Year 2 Measurement: read and show o'clock and half past on analogue and digital clocks" },
    { code: "Y2.M.months", label: "Months of the year", curriculum: "Year 2 Measurement: know the days of the week and months of the year in order" },
    { code: "Y2.M.coins", label: "NZ coins", curriculum: "Year 2 Measurement/Number: recognise NZ coins and count small amounts" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const hour = randInt(rng, 1, 12);
      const minute = tier === 1 ? 0 : pick(rng, [0, 30]);
      if (tier === 3 && chance(rng, 0.5)) {
        const wrong = [digitalTime(hour, minute === 0 ? 30 : 0), digitalTime((hour % 12) + 1, minute), digitalTime(minute === 30 ? hour : (hour + 10) % 12 + 1, minute)];
        return textChoice(rng, { skill: "Y2.M.halfPast", prompt: "What time is it on the digital clock?", visual: { kind: "clock", hour, minute }, hint: "Half past means 30 minutes after the hour." }, digitalTime(hour, minute), wrong);
      }
      const wrongHours = numericDistractors(rng, hour, 3, { min: 1, max: 12, spread: 3 });
      const wrong = wrongHours.map((h) => timeWords(h, minute));
      if (minute === 30) wrong[0] = timeWords(hour, 0);
      return textChoice(rng, { skill: "Y2.M.halfPast", prompt: "What time does the clock show?", visual: { kind: "clock", hour, minute }, hint: minute === 30 ? "The long hand on 6 means half past. The short hand is halfway to the next number." : "The long hand on 12 means o'clock." }, timeWords(hour, minute), wrong);
    }
    if (variant === 1) {
      if (tier === 1) {
        const i = randInt(rng, 0, 6);
        const answer = DAYS[(i + 1) % 7] as string;
        return textChoice(rng, { skill: "Y2.M.months", prompt: `What day comes after ${DAYS[i]}?`, hint: "Say the days in order." }, answer, shuffle(rng, DAYS.filter((d) => d !== answer)).slice(0, 3));
      }
      const i = randInt(rng, 0, 11);
      const after = chance(rng, 0.6);
      const answer = MONTHS[(i + (after ? 1 : 11)) % 12] as string;
      return textChoice(rng, { skill: "Y2.M.months", prompt: `Which month comes ${after ? "after" : "before"} ${MONTHS[i]}?`, hint: "January, February, March, April…" }, answer, shuffle(rng, MONTHS.filter((m) => m !== answer)).slice(0, 3));
    }
    if (tier === 1) {
      const coin = pick(rng, NZ_COINS);
      return textChoice(rng, { skill: "Y2.M.coins", prompt: "How much is this coin worth?", visual: { kind: "coins", coins: [coin] }, hint: "The number on the coin tells you its value." }, money(coin), NZ_COINS.filter((c) => c !== coin).map(money));
    }
    const n = tier === 2 ? randInt(rng, 2, 3) : randInt(rng, 3, 5);
    const pool = tier === 2 ? [10, 20, 50, 100] : NZ_COINS;
    const coins = Array.from({ length: n }, () => pick(rng, pool));
    const total = coins.reduce((s, c) => s + c, 0);
    const wrong = [total + 10, total - 10, total + 50, total + 100].filter((w) => w > 0 && w !== total).map(money);
    return textChoice(rng, { skill: "Y2.M.coins", prompt: "How much money is this altogether?", visual: { kind: "coins", coins }, hint: "Start with the biggest coin and count on." }, money(total), wrong);
  },
};

const SHAPES_2D: ShapeName[] = ["triangle", "square", "rectangle", "pentagon", "hexagon", "circle"];
const SIDES: Record<string, number> = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, circle: 0, octagon: 8 };
const SHAPES_3D: ShapeName[] = ["cube", "sphere", "cylinder", "cone", "pyramid", "cuboid"];

const geometry: Trail = {
  id: "y2-geometry",
  name: "Shapes & Symmetry",
  reoName: "Āhua Hangarite",
  blurb: "Count sides, find mirror lines and follow the forest map.",
  icon: "shapes",
  strand: "geometry",
  skills: [
    { code: "Y2.G.properties", label: "Sides and corners", curriculum: "Year 2 Geometry: describe 2D shapes by their sides and corners, including pentagons and hexagons" },
    { code: "Y2.G.solids", label: "3D objects", curriculum: "Year 2 Geometry: identify and describe cubes, cuboids, cylinders, cones, spheres and pyramids" },
    { code: "Y2.G.symmetry", label: "Line symmetry", curriculum: "Year 2 Geometry: identify shapes with a line of symmetry" },
    { code: "Y2.G.directions", label: "Directions and grids", curriculum: "Year 2 Geometry: give and follow directions (left, right, turns) and locate things on a simple grid" },
  ],
  generate(tier, rng) {
    const variant = tier === 1 ? randInt(rng, 0, 1) : randInt(rng, 0, 3);
    if (variant === 0) {
      const shape = pick(rng, SHAPES_2D.filter((s) => s !== "circle"));
      if (chance(rng, 0.5)) {
        const sides = SIDES[shape] as number;
        return numberChoice(rng, { skill: "Y2.G.properties", prompt: "How many sides does this shape have?", visual: { kind: "shape", shape }, hint: "Count each straight edge." }, sides, { min: 3, max: 8, spread: 2 });
      }
      return textChoice(rng, { skill: "Y2.G.properties", prompt: `Which shape has ${SIDES[shape]} sides${shape === "square" ? " all the same length" : shape === "rectangle" ? ", with two long and two short" : ""}?`, hint: "Count the sides of each shape name you know." }, shape, shuffle(rng, SHAPES_2D.filter((s) => s !== shape && SIDES[s] !== SIDES[shape])).slice(0, 3));
    }
    if (variant === 1) {
      const shape = pick(rng, SHAPES_3D);
      const wrong = shuffle(rng, SHAPES_3D.filter((s) => s !== shape)).slice(0, 3);
      return visualChoice(rng, { skill: "Y2.G.solids", prompt: `Which one is a ${shape}?`, hint: shape === "pyramid" ? "A pyramid has a square bottom and triangle sides meeting at a point." : shape === "cuboid" ? "A cuboid is like a box or a brick." : "Think about everyday objects with that shape." }, shape, [shape, ...wrong].map((s) => ({ value: s, visual: { kind: "shape", shape: s } as Visual })));
    }
    if (variant === 2) {
      const shape = pick(rng, ["square", "rectangle", "triangle", "hexagon", "circle"] as ShapeName[]);
      const line = pick(rng, ["vertical", "horizontal", "diagonal"] as const);
      const symmetric = line === "diagonal" ? shape === "square" || shape === "circle" : shape !== "triangle" || line === "vertical";
      return trueFalse({ skill: "Y2.G.symmetry", prompt: "Is the dashed line a line of symmetry?", visual: { kind: "shape", shape, symmetryLine: line }, hint: "Imagine folding along the line. Do both halves match exactly?" }, symmetric);
    }
    const cols = 4;
    const rows = 4;
    const col = randInt(rng, 0, cols - 1);
    const row = randInt(rng, 0, rows - 1);
    const creature = pick(rng, ["kiwi", "tui", "weta", "fantail"] as const);
    const letters = "ABCD";
    const answer = `${letters[col]}${row + 1}`;
    const wrong = new Set<string>();
    while (wrong.size < 3) {
      const w = `${letters[randInt(rng, 0, cols - 1)]}${randInt(rng, 1, rows)}`;
      if (w !== answer) wrong.add(w);
    }
    return textChoice(rng, { skill: "Y2.G.directions", prompt: `Where is the ${creatureName(creature)} on the map?`, visual: { kind: "grid", cols, rows, marks: [{ col, row, creature }], labels: "letters" }, hint: "Read the letter along the bottom first, then the number up the side." }, answer, [...wrong]);
  },
};

const stats: Trail = {
  id: "y2-stats",
  name: "Graphs & Chance",
  reoName: "Kauwhata",
  blurb: "Read tally marks and bar graphs, and say what is likely.",
  icon: "chart",
  strand: "statistics",
  strand2: "probability",
  skills: [
    { code: "Y2.S.displays", label: "Pictographs, tallies and bar graphs", curriculum: "Year 2 Statistics: read and interpret pictographs, tally charts and simple bar graphs" },
    { code: "Y2.P.likelihood", label: "Certain, possible, impossible", curriculum: "Year 2 Probability: describe events as certain, possible or impossible, likely or unlikely" },
  ],
  generate(tier, rng) {
    if (chance(rng, 0.6)) {
      const labels = shuffle(rng, ["Kiwi", "Tūī", "Wētā", "Pūkeko", "Gecko"]).slice(0, tier === 1 ? 3 : 4);
      const counts = labels.map(() => randInt(rng, 1, tier === 1 ? 6 : 10));
      if (new Set(counts).size !== counts.length) return stats.generate(tier, rng);
      const rows = labels.map((label, i) => ({ label, count: counts[i] as number }));
      const visual: Visual = tier === 1 ? { kind: "pictograph", item: "star", rows } : tier === 2 ? { kind: "tally", rows } : { kind: "barchart", bars: rows.map((r) => ({ label: r.label, value: r.count })) };
      const variant = randInt(rng, 0, 2);
      if (variant === 0) {
        const wantMost = chance(rng, 0.5);
        const target = wantMost ? Math.max(...counts) : Math.min(...counts);
        const answer = rows.find((r) => r.count === target)!.label;
        return textChoice(rng, { skill: "Y2.S.displays", prompt: `Which creature was seen the ${wantMost ? "most" : "least"}?`, visual, hint: tier === 2 ? "Each tally group of 5 has a line across." : "Compare the heights or lengths." }, answer, labels.filter((l) => l !== answer));
      }
      if (variant === 1) {
        const row = pick(rng, rows);
        return numberChoice(rng, { skill: "Y2.S.displays", prompt: `How many times was a ${row.label.toLowerCase()} seen?`, visual, hint: "Find that row and count carefully." }, row.count, { min: 0, max: 12, spread: 2 });
      }
      const [x, y] = shuffle(rng, rows).slice(0, 2) as [typeof rows[number], typeof rows[number]];
      return numberChoice(rng, { skill: "Y2.S.displays", prompt: `How many more ${x.count > y.count ? x.label.toLowerCase() : y.label.toLowerCase()} than ${x.count > y.count ? y.label.toLowerCase() : x.label.toLowerCase()} were seen?`, visual, hint: "Find both numbers and take the smaller from the bigger." }, Math.abs(x.count - y.count), { min: 0, max: 10, spread: 2 });
    }
    if (tier === 1 || chance(rng, 0.5)) {
      const events: { text: string; answer: string }[] = [
        { text: "You will roll a 7 on a normal dice.", answer: "impossible" },
        { text: "The sun will set this evening.", answer: "certain" },
        { text: "You will see a fantail on the walk.", answer: "possible" },
        { text: "A kauri tree will grow overnight.", answer: "impossible" },
        { text: "It will get dark tonight.", answer: "certain" },
        { text: "It will snow in the forest today.", answer: "possible" },
        { text: "Monday will come after Sunday.", answer: "certain" },
        { text: "You will pick a red berry from a bag of only blue berries.", answer: "impossible" },
      ];
      const e = pick(rng, events);
      return textChoice(rng, { skill: "Y2.P.likelihood", prompt: e.text, visual: { kind: "text", text: "?" }, hint: "Certain means it must happen. Impossible means it never can." }, e.answer, ["certain", "possible", "impossible"]);
    }
    const colours = shuffle(rng, ["red", "blue", "green", "yellow"]).slice(0, 2) as [string, string];
    const big = randInt(rng, 4, 6);
    const small = randInt(rng, 1, 2);
    const segments = [...Array(big).fill(colours[0]), ...Array(small).fill(colours[1])].map(colourHex);
    const askLikely = chance(rng, 0.5);
    return textChoice(rng, { skill: "Y2.P.likelihood", prompt: `Spin the spinner. Which colour is it ${askLikely ? "more likely" : "less likely"} to land on?`, visual: { kind: "spinner", segments }, hint: "The colour with more of the spinner is more likely." }, askLikely ? colours[0] : colours[1], [askLikely ? colours[1] : colours[0]]);
  },
};

export const region2: Region = {
  id: "kauri-forest",
  index: 1,
  name: "Kauri Forest",
  reoName: "Te Wao Nui",
  yearLabel: "Year 2 · age 6",
  year: 2,
  colour: "#16a34a",
  blurb: "Giant kauri, ferns and birdsong. Numbers grow to one hundred here.",
  trails: [count100, skip, place, facts, groups, algebra, units, timeMoney, geometry, stats],
  rescue: { creature: "kiwi", name: "North Island brown kiwi", reoName: "Kiwi", fact: "Kiwi cannot fly and hunt at night, sniffing out worms with nostrils at the tip of their long beak." },
};
