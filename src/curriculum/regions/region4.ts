/**
 * Region 4 · Starry Skies · Te Rangi Whetū · Year 4 (age 8)
 * Te Mātaiaho Year 4: numbers to 10 000, addition and subtraction to 1000, times tables to
 * 10 × 10, division with remainders, multiplying by 10/100 and 2-digit × 1-digit, fractions of
 * sets, equivalent fractions and tenths, growing patterns and balanced equations, unit
 * conversions, perimeter and area, time to the minute and elapsed time, money with decimals,
 * angles, coordinates and transformations, scaled bar graphs, and listing outcomes.
 */
import type { Region, ShapeName, Trail, Visual } from "../types";
import { chance, pick, randInt, shuffle } from "../rng";
import { colourHex, itemName, money, numberChoice, numpad, randomItem, textChoice, digitalTime, trueFalse, creatureName } from "../helpers";

const place10000: Trail = {
  id: "y4-place",
  name: "Ten Thousand Stars",
  reoName: "Tekau Mano",
  blurb: "Thousands, hundreds, tens and ones across the night sky.",
  icon: "blocks",
  strand: "number",
  skills: [
    { code: "Y4.N.place10000", label: "Place value to 10 000", curriculum: "Year 4 Number: read, write and represent numbers to 10 000 using place value" },
    { code: "Y4.N.compare10000", label: "Compare and order to 10 000", curriculum: "Year 4 Number: compare, order and find 1000 more or less" },
  ],
  generate(tier, rng) {
    const n = randInt(rng, tier === 1 ? 1000 : 1001, tier === 1 ? 4999 : 9999);
    const digits = String(n).split("").map(Number) as [number, number, number, number];
    const variant = tier === 1 ? randInt(rng, 0, 1) : randInt(rng, 0, 3);
    if (variant === 0) {
      const which = pick(rng, ["thousands", "hundreds", "tens", "ones"] as const);
      const idx = { thousands: 0, hundreds: 1, tens: 2, ones: 3 }[which];
      const answer = digits[idx] as number;
      return numberChoice(rng, { skill: "Y4.N.place10000", prompt: `What is the ${which} digit in ${n}?`, visual: { kind: "text", text: String(n) }, hint: "Thousands, hundreds, tens, ones: read left to right." }, answer, { min: 0, max: 9, candidates: digits.filter((d) => d !== answer) });
    }
    if (variant === 1) {
      const [th, h, t, o] = digits;
      return textChoice(rng, { skill: "Y4.N.place10000", prompt: `Which shows ${n} in expanded form?`, hint: "Each digit is worth its place." }, `${th * 1000} + ${h * 100} + ${t * 10} + ${o}`, [`${th * 100} + ${h * 100} + ${t * 10} + ${o}`, `${th} + ${h} + ${t} + ${o}`, `${th * 1000} + ${h * 10} + ${t} + ${o}`, `${th * 100} + ${h * 10} + ${t} + ${o}`]);
    }
    if (variant === 2) {
      const uniq = [...new Set([n, randInt(rng, 1000, 9999), randInt(rng, 1000, 9999)])];
      while (uniq.length < 3) uniq.push(randInt(rng, 1000, 9999));
      const sorted = [...uniq].sort((a, b) => a - b);
      const answer = sorted.join(", ");
      return textChoice(rng, { skill: "Y4.N.compare10000", prompt: "Order these from smallest to largest.", visual: { kind: "text", text: shuffle(rng, uniq).join("   ") }, hint: "Compare the thousands digit first." }, answer, [[...sorted].reverse().join(", "), [sorted[1], sorted[0], sorted[2]].join(", ")]);
    }
    const more = chance(rng, 0.5);
    const safe = more ? Math.min(n, 8999) : Math.max(n, 1000);
    return numpad({ skill: "Y4.N.compare10000", prompt: `What is 1000 ${more ? "more" : "less"} than ${safe}?`, visual: { kind: "text", text: String(safe) }, hint: "Only the thousands digit changes." }, more ? safe + 1000 : safe - 1000);
  },
};

const addSub: Trail = {
  id: "y4-addsub",
  name: "Comet Calculations",
  reoName: "Tātai Auahitūroa",
  blurb: "Add and subtract to 1000 at comet speed.",
  icon: "plusminus",
  strand: "number",
  skills: [
    { code: "Y4.N.add1000", label: "Add to 1000", curriculum: "Year 4 Number: add three-digit numbers using place value, with regrouping" },
    { code: "Y4.N.sub1000", label: "Subtract within 1000", curriculum: "Year 4 Number: subtract three-digit numbers using place value and compensation" },
  ],
  generate(tier, rng) {
    if (chance(rng, 0.5)) {
      const a = randInt(rng, tier === 1 ? 100 : 150, tier === 1 ? 500 : 849);
      const b = tier === 1 ? randInt(rng, 10, 99) : randInt(rng, 100, 999 - a);
      return numpad({ skill: "Y4.N.add1000", prompt: `${a} + ${b} = ?`, visual: { kind: "expression", text: `${a} + ${b}` }, hint: tier === 1 ? "Add the tens, then the ones." : "Add hundreds, then tens, then ones." }, a + b);
    }
    const a = randInt(rng, tier === 1 ? 110 : 300, 999);
    const b = tier === 1 ? randInt(rng, 10, 99) : randInt(rng, 100, a - 1);
    return numpad({ skill: "Y4.N.sub1000", prompt: `${a} − ${b} = ?`, visual: { kind: "expression", text: `${a} − ${b}` }, hint: b % 100 >= 90 ? `${b} is close to ${Math.ceil(b / 100) * 100}. Subtract that, then add back ${Math.ceil(b / 100) * 100 - b}.` : `Subtract hundreds, then tens, then ones. Or count up from ${b}.` }, a - b);
  },
};

const tables: Trail = {
  id: "y4-tables",
  name: "Constellation Tables",
  reoName: "Whakarea Whetū",
  blurb: "Times tables all the way to 10 × 10.",
  icon: "times",
  strand: "number",
  skills: [
    { code: "Y4.N.tables", label: "Times tables to 10 × 10", curriculum: "Year 4 Number: recall multiplication facts to 10 × 10" },
  ],
  generate(tier, rng) {
    const table = pick(rng, tier === 1 ? [3, 4, 6] : tier === 2 ? [3, 4, 6, 8, 9] : [3, 4, 6, 7, 8, 9]);
    const k = randInt(rng, 2, 10);
    const text = chance(rng, 0.5) ? `${k} × ${table}` : `${table} × ${k}`;
    const hint = table === 6 ? `6 × ${k} is double 3 × ${k}.` : table === 8 ? `8 × ${k} is double 4 × ${k}.` : table === 9 ? `9 × ${k} is 10 × ${k} take away ${k}.` : `Count in ${table}s ${k} times.`;
    const base = { skill: "Y4.N.tables", prompt: `${text} = ?`, visual: (tier === 1 && chance(rng, 0.5) ? { kind: "array", rows: table, cols: k } : { kind: "expression", text }) as Visual, hint };
    return tier === 1 ? numberChoice(rng, base, table * k, { min: 0, max: 100, candidates: [table * (k + 1), table * (k - 1), table + k] }) : numpad(base, table * k);
  },
};

const divide: Trail = {
  id: "y4-divide",
  name: "Meteor Remainders",
  reoName: "Whakawehe",
  blurb: "Division facts, leftovers, and multiplying bigger numbers.",
  icon: "divide",
  strand: "number",
  skills: [
    { code: "Y4.N.divFacts", label: "Division facts and remainders", curriculum: "Year 4 Number: recall division facts and divide with remainders in context" },
    { code: "Y4.N.multiply", label: "Multiply by 10, 100 and two-digit × one-digit", curriculum: "Year 4 Number: multiply by 10 and 100, and multiply two-digit numbers by one-digit numbers" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      if (tier === 3 && chance(rng, 0.5)) {
        const divisor = pick(rng, [2, 3, 4, 5, 6]);
        const q = randInt(rng, 2, 9);
        const r = randInt(rng, 1, divisor - 1);
        const total = divisor * q + r;
        const item = randomItem(rng);
        const askR = chance(rng, 0.5);
        return numpad({ skill: "Y4.N.divFacts", prompt: askR ? `${total} ${itemName(item, total)} shared between ${divisor} explorers. How many are left over?` : `${total} ${itemName(item, total)} shared between ${divisor} explorers. How many each?`, visual: { kind: "expression", text: `${total} ÷ ${divisor}` }, hint: `${divisor} × ${q} = ${divisor * q}, so ${total} ÷ ${divisor} = ${q} remainder ${r}.` }, askR ? r : q);
      }
      const divisor = pick(rng, tier === 1 ? [2, 3, 4, 5, 10] : [3, 4, 6, 7, 8, 9]);
      const q = randInt(rng, 2, 10);
      const base = { skill: "Y4.N.divFacts", prompt: `${divisor * q} ÷ ${divisor} = ?`, visual: { kind: "expression", text: `${divisor * q} ÷ ${divisor}` } as Visual, hint: `Think ${divisor} × ? = ${divisor * q}.` };
      return tier === 1 ? numberChoice(rng, base, q, { min: 1, max: 12, candidates: [q + 1, q - 1, divisor] }) : numpad(base, q);
    }
    if (variant === 1) {
      const a = randInt(rng, 2, tier === 1 ? 20 : 99);
      const by = tier === 1 ? 10 : pick(rng, [10, 100]);
      const base = { skill: "Y4.N.multiply", prompt: `${a} × ${by} = ?`, visual: { kind: "expression", text: `${a} × ${by}` } as Visual, hint: by === 10 ? "Every digit moves one place bigger: add a zero." : "Every digit moves two places bigger: add two zeros." };
      return tier === 1 ? numberChoice(rng, base, a * by, { min: 0, max: 10000, candidates: [a * by * 10, a + by, a * by + 10] }) : numpad(base, a * by);
    }
    const a = randInt(rng, 11, tier === 1 ? 15 : tier === 2 ? 25 : 49);
    const b = pick(rng, tier === 1 ? [2, 3] : tier === 2 ? [2, 3, 4, 5] : [3, 4, 5, 6, 7, 8]);
    const tens = Math.floor(a / 10) * 10;
    const ones = a % 10;
    return numpad({ skill: "Y4.N.multiply", prompt: `${a} × ${b} = ?`, visual: { kind: "expression", text: `${a} × ${b}` }, hint: `Split it: ${tens} × ${b} = ${tens * b} and ${ones} × ${b} = ${ones * b}. Add them.` }, a * b);
  },
};

const fractions: Trail = {
  id: "y4-fractions",
  name: "Moon Fractions",
  reoName: "Hautau Marama",
  blurb: "Fractions of sets, equal fractions and tenths.",
  icon: "pie",
  strand: "number",
  skills: [
    { code: "Y4.N.fractionOfSet", label: "Fractions of sets", curriculum: "Year 4 Number: find non-unit fractions of sets (3/4 of 12)" },
    { code: "Y4.N.equivalent", label: "Equivalent fractions", curriculum: "Year 4 Number: identify equivalent fractions (1/2 = 2/4)" },
    { code: "Y4.N.tenths", label: "Tenths as decimals", curriculum: "Year 4 Number: represent tenths as fractions and decimals" },
  ],
  generate(tier, rng) {
    const variant = tier === 1 ? 0 : tier === 2 ? randInt(rng, 0, 1) : randInt(rng, 0, 2);
    if (variant === 0) {
      const denom = pick(rng, tier === 1 ? [2, 3, 4] : [3, 4, 5, 6, 8]);
      const numer = tier === 1 ? 1 : randInt(rng, 1, denom - 1);
      const each = randInt(rng, 1, tier === 3 ? 6 : 4);
      const total = denom * each;
      return numpad({ skill: "Y4.N.fractionOfSet", prompt: `What is ${numer}/${denom} of ${total}?`, visual: { kind: "objects", item: randomItem(rng), count: total }, hint: `1/${denom} of ${total} is ${each}. Then multiply by ${numer}.` }, each * numer);
    }
    if (variant === 1) {
      const [n, d] = pick(rng, [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 5]]) as [number, number];
      const k = pick(rng, [2, 3, 4]);
      return textChoice(rng, { skill: "Y4.N.equivalent", prompt: `Which fraction is equal to ${n}/${d}?`, visual: { kind: "fraction", parts: d, shaded: n, shape: "bar" }, hint: "Multiply the top and bottom by the same number." }, `${n * k}/${d * k}`, [`${n * k}/${d * k + 1}`, `${n + 1}/${d + 1}`, `${n}/${d * k}`]);
    }
    const tenths = randInt(rng, 1, 9);
    if (chance(rng, 0.5)) return textChoice(rng, { skill: "Y4.N.tenths", prompt: `Write ${tenths}/10 as a decimal.`, visual: { kind: "fraction", parts: 10, shaded: tenths, shape: "bar" }, hint: "One tenth is 0.1." }, `0.${tenths}`, [`${tenths}.0`, `0.0${tenths}`, `${tenths}`]);
    return textChoice(rng, { skill: "Y4.N.tenths", prompt: `What fraction is 0.${tenths}?`, visual: { kind: "text", text: `0.${tenths}` }, hint: "The first place after the point is tenths." }, `${tenths}/10`, [`${tenths}/100`, `${tenths + 1}/10`, `${tenths}/1`]);
  },
};

const algebra: Trail = {
  id: "y4-algebra",
  name: "Orbit Patterns",
  reoName: "Tauira Amionga",
  blurb: "Growing patterns, mystery boxes and balanced equations.",
  icon: "puzzle",
  strand: "algebra",
  skills: [
    { code: "Y4.A.unknowns", label: "Unknowns with × and ÷", curriculum: "Year 4 Algebra: find unknowns in multiplication and division equations" },
    { code: "Y4.A.patterns", label: "Growing patterns", curriculum: "Year 4 Algebra: continue patterns and describe the rule, including doubling" },
    { code: "Y4.A.balance", label: "Balanced equations", curriculum: "Year 4 Algebra: understand equality with operations on both sides" },
  ],
  generate(tier, rng) {
    const variant = tier === 1 ? randInt(rng, 0, 1) : randInt(rng, 0, 2);
    if (variant === 0) {
      const table = pick(rng, tier === 1 ? [2, 3, 4, 5, 10] : [3, 4, 6, 7, 8, 9]);
      const k = randInt(rng, 2, 10);
      const div = tier > 1 && chance(rng, 0.5);
      const text = div ? (chance(rng, 0.5) ? `☐ ÷ ${table} = ${k}` : `${table * k} ÷ ☐ = ${k}`) : chance(rng, 0.5) ? `${table} × ☐ = ${table * k}` : `☐ × ${k} = ${table * k}`;
      const answer = text.startsWith("☐ ÷") ? table * k : text.includes("÷ ☐") ? table : text.startsWith("☐ ×") ? table : k;
      return numpad({ skill: "Y4.A.unknowns", prompt: "What number goes in the box?", visual: { kind: "expression", text }, hint: `Use the fact family: ${table} × ${k} = ${table * k}.` }, answer);
    }
    if (variant === 1) {
      if (tier === 3 && chance(rng, 0.5)) {
        const start = pick(rng, [1, 2, 3, 5]);
        const seq = Array.from({ length: 5 }, (_, i) => start * 2 ** i);
        const hiddenIdx = randInt(rng, 2, 4);
        return numpad({ skill: "Y4.A.patterns", prompt: "What is the missing number in the pattern?", visual: { kind: "sequence", values: seq.map((v, i) => (i === hiddenIdx ? null : v)) }, hint: "Each number is double the one before." }, seq[hiddenIdx] as number);
      }
      const step = pick(rng, tier === 1 ? [3, 4, 5, 10] : [6, 7, 8, 9, 15, 25, 50, 100]);
      const start = randInt(rng, 1, tier === 1 ? 20 : 200);
      const seq = Array.from({ length: 5 }, (_, i) => start + i * step);
      const hiddenIdx = randInt(rng, 1, 4);
      const answer = seq[hiddenIdx] as number;
      const base = { skill: "Y4.A.patterns", prompt: "What is the missing number in the pattern?", visual: { kind: "sequence", values: seq.map((v, i) => (i === hiddenIdx ? null : v)) } as Visual, hint: `The pattern goes up by ${step} each time.` };
      return tier === 1 ? numberChoice(rng, base, answer, { min: 0, max: 1000, candidates: [answer + step, answer - step, answer + 1] }) : numpad(base, answer);
    }
    const a = pick(rng, [2, 3, 4, 5, 6]);
    const b = randInt(rng, 2, 9);
    const c = pick(rng, [2, 3, 4, 5, 6].filter((x) => x !== a));
    const isTrue = (a * b) % c === 0 ? chance(rng, 0.6) : false;
    const d = isTrue ? (a * b) / c : Math.floor((a * b) / c) + 1;
    return trueFalse({ skill: "Y4.A.balance", prompt: "Is this true or false?", visual: { kind: "expression", text: `${a} × ${b} = ${c} × ${d}` }, hint: "Work out both sides. The equals sign means both sides are the same." }, isTrue);
  },
};

const measure: Trail = {
  id: "y4-measure",
  name: "Measure the Universe",
  reoName: "Ine te Ao",
  blurb: "Convert units, walk perimeters and count squares of area.",
  icon: "ruler",
  strand: "measurement",
  skills: [
    { code: "Y4.M.convert", label: "Convert units", curriculum: "Year 4 Measurement: convert between mm, cm, m and km; g and kg; mL and L" },
    { code: "Y4.M.perimeter", label: "Perimeter of rectangles", curriculum: "Year 4 Measurement: calculate the perimeter of rectangles and squares" },
    { code: "Y4.M.area", label: "Area by counting squares", curriculum: "Year 4 Measurement: find area by counting square units" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const conv: { from: string; to: string; factor: number; range: [number, number] }[] = [
        { from: "cm", to: "mm", factor: 10, range: [1, 20] },
        { from: "m", to: "cm", factor: 100, range: [1, 9] },
        { from: "km", to: "m", factor: 1000, range: [1, 9] },
        { from: "kg", to: "g", factor: 1000, range: [1, 9] },
        { from: "L", to: "mL", factor: 1000, range: [1, 9] },
      ];
      const c = pick(rng, tier === 1 ? conv.slice(0, 2) : conv);
      const n = randInt(rng, c.range[0], c.range[1]);
      const reverse = tier === 3 && chance(rng, 0.5);
      if (reverse) return numpad({ skill: "Y4.M.convert", prompt: `${n * c.factor} ${c.to} = ? ${c.from}`, visual: { kind: "expression", text: `${n * c.factor} ${c.to}` }, hint: `There are ${c.factor} ${c.to} in 1 ${c.from}. Divide by ${c.factor}.` }, n);
      const base = { skill: "Y4.M.convert", prompt: `${n} ${c.from} = ? ${c.to}`, visual: { kind: "expression", text: `${n} ${c.from}` } as Visual, hint: `There are ${c.factor} ${c.to} in 1 ${c.from}. Multiply by ${c.factor}.` };
      return tier === 1 ? numberChoice(rng, base, n * c.factor, { min: 0, max: 10000, candidates: [n * c.factor * 10, n * c.factor / 10, n + c.factor] }) : numpad(base, n * c.factor);
    }
    if (variant === 1) {
      const w = randInt(rng, 2, tier === 1 ? 9 : 15);
      const h = randInt(rng, 2, tier === 1 ? 9 : 15);
      const square = chance(rng, 0.3);
      const p = square ? w * 4 : 2 * (w + h);
      return numpad({ skill: "Y4.M.perimeter", prompt: square ? `A square has sides of ${w} m. What is its perimeter in m?` : `A rectangle is ${w} m long and ${h} m wide. What is its perimeter in m?`, visual: { kind: "shape", shape: square ? "square" : "rectangle" }, hint: square ? `4 × ${w}.` : `Two lengths and two widths: ${w} + ${w} + ${h} + ${h}.` }, p);
    }
    const cols = tier === 1 ? randInt(rng, 2, 4) : randInt(rng, 3, 6);
    const rows = tier === 1 ? randInt(rng, 2, 3) : randInt(rng, 2, 5);
    const shaded: [number, number][] = [];
    if (tier === 3 && chance(rng, 0.5)) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (chance(rng, 0.6)) shaded.push([r, c]);
      if (shaded.length === 0) shaded.push([0, 0]);
    } else {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) shaded.push([r, c]);
    }
    const base = { skill: "Y4.M.area", prompt: "What is the area of the shaded shape in square units?", visual: { kind: "areagrid", rows, cols, shaded } as Visual, hint: shaded.length === rows * cols ? `It is ${rows} rows of ${cols}: multiply.` : "Count every shaded square." };
    return tier === 1 ? numberChoice(rng, base, shaded.length, { min: 1, max: 30, candidates: [rows + cols, 2 * (rows + cols), shaded.length + 1] }) : numpad(base, shaded.length);
  },
};

const timeMoney: Trail = {
  id: "y4-timemoney",
  name: "Midnight Money",
  reoName: "Wā Moni",
  blurb: "Time to the minute, how long things take, and dollars and cents.",
  icon: "clock",
  strand: "measurement",
  skills: [
    { code: "Y4.M.minutes", label: "Time to the minute", curriculum: "Year 4 Measurement: read analogue and digital time to the minute; use am and pm" },
    { code: "Y4.M.elapsed", label: "Elapsed time", curriculum: "Year 4 Measurement: work out durations and finishing times in hours and minutes" },
    { code: "Y4.M.money", label: "Money with decimals", curriculum: "Year 4 Measurement/Number: add and subtract amounts of money written as decimals" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const hour = randInt(rng, 1, 12);
      const minute = tier === 1 ? randInt(rng, 0, 11) * 5 : randInt(rng, 0, 59);
      const wrong = [digitalTime(hour, (minute + 5) % 60), digitalTime((hour % 12) + 1, minute), digitalTime(hour, (minute + 30) % 60)];
      return textChoice(rng, { skill: "Y4.M.minutes", prompt: "What time does the clock show?", visual: { kind: "clock", hour, minute }, hint: "Count in 5s for each number the long hand passes, then add the extra minutes." }, digitalTime(hour, minute), wrong);
    }
    if (variant === 1) {
      const startH = randInt(rng, 1, 9);
      const startM = tier === 1 ? 0 : pick(rng, [0, 15, 30, 45]);
      const durH = randInt(rng, 0, 2);
      const durM = tier === 1 ? pick(rng, [30, 0]) : pick(rng, [15, 30, 45]);
      if (durH === 0 && durM === 0) return timeMoney.generate(tier, rng);
      const endTotal = startH * 60 + startM + durH * 60 + durM;
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;
      const dur = durH ? `${durH} hour${durH > 1 ? "s" : ""}${durM ? ` and ${durM} minutes` : ""}` : `${durM} minutes`;
      return textChoice(rng, { skill: "Y4.M.elapsed", prompt: `A walk starts at ${digitalTime(startH, startM)} and takes ${dur}. When does it finish?`, visual: { kind: "clock", hour: startH, minute: startM }, hint: "Add the hours first, then the minutes." }, digitalTime(endH, endM), [digitalTime(endH + 1, endM), digitalTime(endH, (endM + 15) % 60), digitalTime(endH - 1 || 12, endM)]);
    }
    const a = randInt(rng, 1, 9) * 100 + pick(rng, [0, 25, 50, 75]);
    const b = randInt(rng, 1, 5) * 100 + pick(rng, [0, 25, 50, 75]);
    if (tier === 1 || chance(rng, 0.5)) {
      return textChoice(rng, { skill: "Y4.M.money", prompt: `${money(a)} + ${money(b)} = ?`, visual: { kind: "expression", text: `${money(a)} + ${money(b)}` }, hint: "Add the dollars, then the cents. 100 cents makes a dollar." }, money(a + b), [money(a + b + 25), money(a + b - 25), money(a + b + 100)]);
    }
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    if (big === small) return timeMoney.generate(tier, rng);
    return textChoice(rng, { skill: "Y4.M.money", prompt: `${money(big)} − ${money(small)} = ?`, visual: { kind: "expression", text: `${money(big)} − ${money(small)}` }, hint: `Count up from ${money(small)} to ${money(big)}.` }, money(big - small), [money(big - small + 25), money(big - small + 100), money(Math.abs(big - small - 25))]);
  },
};

const geometry: Trail = {
  id: "y4-geometry",
  name: "Angles & Coordinates",
  reoName: "Koki",
  blurb: "Right angles, map coordinates, flips, slides and turns.",
  icon: "shapes",
  strand: "geometry",
  skills: [
    { code: "Y4.G.angles", label: "Compare angles", curriculum: "Year 4 Geometry: identify right angles and compare angles as smaller or larger than a right angle" },
    { code: "Y4.G.coordinates", label: "Coordinates", curriculum: "Year 4 Geometry: locate points on a grid using number coordinates" },
    { code: "Y4.G.transform", label: "Transformations", curriculum: "Year 4 Geometry: identify reflections (flips), rotations (turns) and translations (slides)" },
    { code: "Y4.G.properties", label: "Shape properties", curriculum: "Year 4 Geometry: classify shapes by sides, angles and symmetry" },
  ],
  generate(tier, rng) {
    const variant = tier === 1 ? randInt(rng, 0, 1) : randInt(rng, 0, 3);
    if (variant === 0) {
      const deg = pick(rng, tier === 1 ? [90, 45, 135] : [30, 45, 60, 90, 120, 135, 150]);
      const answer = deg === 90 ? "a right angle" : deg < 90 ? "smaller than a right angle" : "bigger than a right angle";
      return textChoice(rng, { skill: "Y4.G.angles", prompt: "What kind of angle is this?", visual: { kind: "angle", degrees: deg }, hint: "A right angle is a square corner, like the corner of a book." }, answer, ["a right angle", "smaller than a right angle", "bigger than a right angle"]);
    }
    if (variant === 1) {
      const cols = 6;
      const rows = 6;
      const col = randInt(rng, 0, cols - 1);
      const row = randInt(rng, 0, rows - 1);
      const creature = pick(rng, ["kakapo", "morepork", "gecko", "tui"] as const);
      const answer = `(${col}, ${row})`;
      const wrong = new Set<string>([`(${row}, ${col})`]);
      while (wrong.size < 3) {
        const w = `(${randInt(rng, 0, cols - 1)}, ${randInt(rng, 0, rows - 1)})`;
        if (w !== answer) wrong.add(w);
      }
      return textChoice(rng, { skill: "Y4.G.coordinates", prompt: `What are the coordinates of the ${creatureName(creature)}?`, visual: { kind: "grid", cols, rows, marks: [{ col, row, creature }], labels: "numbers" }, hint: "Along the bottom first (x), then up the side (y)." }, answer, [...wrong].filter((w) => w !== answer));
    }
    if (variant === 2) {
      const type = pick(rng, ["reflection", "rotation", "translation"] as const);
      const names = { reflection: "reflection (flip)", rotation: "rotation (turn)", translation: "translation (slide)" };
      return textChoice(rng, { skill: "Y4.G.transform", prompt: "How was the shape moved?", visual: { kind: "transform", shape: pick(rng, ["L", "arrow", "flag"] as const), type }, hint: "A slide keeps it facing the same way. A flip mirrors it. A turn rotates it." }, names[type], Object.values(names).filter((n) => n !== names[type]));
    }
    const facts: { shape: ShapeName; text: string; answer: boolean }[] = [
      { shape: "square", text: "A square has 4 right angles.", answer: true },
      { shape: "rectangle", text: "A rectangle has 4 equal sides.", answer: false },
      { shape: "triangle", text: "A triangle has 3 sides.", answer: true },
      { shape: "hexagon", text: "A hexagon has 8 sides.", answer: false },
      { shape: "rectangle", text: "A rectangle has 2 pairs of parallel sides.", answer: true },
      { shape: "pentagon", text: "A pentagon has 5 corners.", answer: true },
      { shape: "circle", text: "A circle has 4 lines of symmetry only.", answer: false },
      { shape: "octagon", text: "An octagon has 6 sides.", answer: false },
    ];
    const f = pick(rng, facts);
    return trueFalse({ skill: "Y4.G.properties", prompt: f.text, visual: { kind: "shape", shape: f.shape }, hint: "Check the sides, corners and angles carefully." }, f.answer);
  },
};

const stats: Trail = {
  id: "y4-stats",
  name: "Star Charts",
  reoName: "Kauwhata Whetū",
  blurb: "Graphs with scales, tables, and all the ways things can turn out.",
  icon: "chart",
  strand: "statistics",
  strand2: "probability",
  skills: [
    { code: "Y4.S.graphs", label: "Scaled bar graphs and tables", curriculum: "Year 4 Statistics: read and interpret bar graphs with scales and data tables; compare categories" },
    { code: "Y4.P.outcomes", label: "Outcomes and chance", curriculum: "Year 4 Probability: list possible outcomes and describe chance as a fraction of outcomes (1 in 4)" },
  ],
  generate(tier, rng) {
    if (chance(rng, 0.6)) {
      const labels = shuffle(rng, ["Kākāpō", "Ruru", "Gecko", "Tūī", "Kea"]).slice(0, 4);
      const step = tier === 1 ? 2 : pick(rng, [2, 5, 10]);
      const counts = labels.map(() => randInt(rng, 1, 8) * step);
      if (new Set(counts).size !== counts.length) return stats.generate(tier, rng);
      const bars = labels.map((label, i) => ({ label, value: counts[i] as number }));
      const visual: Visual = { kind: "barchart", bars, step };
      const variant = randInt(rng, 0, 2);
      if (variant === 0) {
        const b = pick(rng, bars);
        return numberChoice(rng, { skill: "Y4.S.graphs", prompt: `How many ${b.label.toLowerCase()} were seen?`, visual, hint: `The scale goes up in ${step}s.` }, b.value, { min: 0, max: 90, candidates: [b.value + step, b.value - step, b.value + 1] });
      }
      if (variant === 1) return numpad({ skill: "Y4.S.graphs", prompt: "How many creatures were seen altogether?", visual, hint: "Read each bar, then add them up." }, counts.reduce((s, c) => s + c, 0));
      const [x, y] = shuffle(rng, bars).slice(0, 2) as [typeof bars[number], typeof bars[number]];
      const big = x.value > y.value ? x : y;
      const small = x.value > y.value ? y : x;
      return numpad({ skill: "Y4.S.graphs", prompt: `How many more ${big.label.toLowerCase()} than ${small.label.toLowerCase()}?`, visual, hint: "Find both values, then subtract." }, big.value - small.value);
    }
    const variant = tier === 1 ? 0 : randInt(rng, 0, 2);
    if (variant === 0) {
      const colours = shuffle(rng, ["red", "blue", "green", "yellow"]).slice(0, tier === 1 ? 2 : 4);
      const segments = colours.map(colourHex);
      const target = pick(rng, colours);
      const answer = `1 in ${colours.length}`;
      return textChoice(rng, { skill: "Y4.P.outcomes", prompt: `The spinner has equal parts. What is the chance of landing on ${target}?`, visual: { kind: "spinner", segments }, hint: `Count the parts: 1 ${target} part out of ${colours.length}.` }, answer, ["1 in 2", "1 in 3", "1 in 4", "1 in 5"].filter((w) => w !== answer));
    }
    if (variant === 1) {
      const items = pick(rng, [
        { text: "flipping a coin", n: 2 },
        { text: "rolling a normal dice", n: 6 },
        { text: "spinning a spinner with 4 equal colours", n: 4 },
        { text: "picking one of 3 different feathers", n: 3 },
      ]);
      return numberChoice(rng, { skill: "Y4.P.outcomes", prompt: `How many different outcomes are possible when ${items.text}?`, visual: { kind: "text", text: "?" }, hint: "List every result that could happen." }, items.n, { min: 1, max: 8, spread: 2 });
    }
    const red = randInt(rng, 1, 5);
    const blue = randInt(rng, 1, 5);
    const total = red + blue;
    const contents = [{ colour: "red", count: red }, { colour: "blue", count: blue }];
    return textChoice(rng, { skill: "Y4.P.outcomes", prompt: "You pick one berry without looking. What is the chance it is red?", visual: { kind: "bag", contents }, hint: `There are ${red} red out of ${total} berries.` }, `${red} in ${total}`, [`${blue} in ${total}`, `${red} in ${blue}`, `1 in ${total}`]);
  },
};

export const region4: Region = {
  id: "starry-skies",
  index: 3,
  name: "Starry Skies",
  reoName: "Te Rangi Whetū",
  yearLabel: "Year 4 · age 8",
  year: 4,
  colour: "#6366f1",
  blurb: "A dark-sky night above the mountains, where the biggest numbers shine.",
  trails: [place10000, addSub, tables, divide, fractions, algebra, measure, timeMoney, geometry, stats],
  rescue: { creature: "kakapo", name: "Kākāpō", reoName: "Kākāpō", fact: "Kākāpō are the world's heaviest parrots. They cannot fly, smell like honey, and every one has a name." },
};
