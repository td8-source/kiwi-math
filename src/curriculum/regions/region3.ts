/**
 * Region 3 · Southern Alps · Kā Tiritiri o te Moana · Year 3 (age 7)
 * Te Mātaiaho Year 3: numbers to 1000, multi-digit addition and subtraction, 2/5/10 times
 * tables (3s and 4s introduced), division and unit fractions, rounding, patterns and unknowns,
 * centimetres and metres, quarter-hours and calendars, money to $10, polygons and 3D properties,
 * grid references and turns, bar graphs, and ordering likelihood.
 */
import type { Region, ShapeName, Trail, Visual } from "../types";
import { chance, pick, randInt, shuffle } from "../rng";
import { DAYS, MONTHS, NZ_COINS, colourHex, itemName, money, numberChoice, numpad, randomItem, textChoice, timeWords, digitalTime, visualChoice, creatureName } from "../helpers";

const place1000: Trail = {
  id: "y3-place",
  name: "Thousand Peaks",
  reoName: "Kotahi Mano",
  blurb: "Hundreds, tens and ones up the mountain.",
  icon: "blocks",
  strand: "number",
  skills: [
    { code: "Y3.N.place1000", label: "Place value to 1000", curriculum: "Year 3 Number: read, write and represent numbers to 1000 as hundreds, tens and ones" },
    { code: "Y3.N.compare1000", label: "Compare and order to 1000", curriculum: "Year 3 Number: compare and order numbers to 1000; find 100 more or less" },
  ],
  generate(tier, rng) {
    const h = randInt(rng, 1, tier === 1 ? 4 : 9);
    const t = randInt(rng, 0, 9);
    const o = randInt(rng, 0, 9);
    const n = h * 100 + t * 10 + o;
    const variant = tier === 1 ? randInt(rng, 0, 1) : randInt(rng, 0, 4);
    if (variant === 0) {
      const base = { skill: "Y3.N.place1000", prompt: "What number do the blocks show?", visual: { kind: "blocks", hundreds: h, tens: t, ones: o } as Visual, hint: "Count hundreds, then tens, then ones." };
      return tier === 1 ? numberChoice(rng, base, n, { min: 100, max: 999, candidates: [h * 100 + o * 10 + t, n + 100, n + 10] }) : numpad(base, n);
    }
    if (variant === 1) {
      const which = pick(rng, ["hundreds", "tens", "ones"] as const);
      const answer = which === "hundreds" ? h : which === "tens" ? t : o;
      return numberChoice(rng, { skill: "Y3.N.place1000", prompt: `What is the ${which} digit in ${n}?`, visual: { kind: "text", text: String(n) }, hint: "Hundreds, tens, ones: read the digits from left to right." }, answer, { min: 0, max: 9, candidates: [h, t, o].filter((d) => d !== answer) });
    }
    if (variant === 2) {
      return textChoice(rng, { skill: "Y3.N.place1000", prompt: `Which shows ${n} in expanded form?`, hint: "Each digit has a place value." }, `${h * 100} + ${t * 10} + ${o}`, [`${h} + ${t} + ${o}`, `${h * 100} + ${t} + ${o}`, `${h * 10} + ${t * 10} + ${o}`, `${h * 1000} + ${t * 10} + ${o}`]);
    }
    if (variant === 3) {
      let m = randInt(rng, 100, 999);
      if (m === n) m = n + 1;
      const wantBigger = chance(rng, 0.5);
      const answer = wantBigger ? Math.max(n, m) : Math.min(n, m);
      return textChoice(rng, { skill: "Y3.N.compare1000", prompt: `Which number is ${wantBigger ? "bigger" : "smaller"}?`, hint: "Compare the hundreds digit first." }, String(answer), [String(answer === n ? m : n)]);
    }
    const more = chance(rng, 0.5);
    const safe = more ? Math.min(n, 899) : Math.max(n, 100);
    return numpad({ skill: "Y3.N.compare1000", prompt: `What is 100 ${more ? "more" : "less"} than ${safe}?`, visual: { kind: "text", text: String(safe) }, hint: "Only the hundreds digit changes." }, more ? safe + 100 : safe - 100);
  },
};

const addSub: Trail = {
  id: "y3-addsub",
  name: "Glacier Sums",
  reoName: "Tāpiri Nui",
  blurb: "Add and subtract bigger numbers across the ice.",
  icon: "plusminus",
  strand: "number",
  skills: [
    { code: "Y3.N.add", label: "Add two- and three-digit numbers", curriculum: "Year 3 Number: add two-digit and three-digit numbers using place value and mental strategies" },
    { code: "Y3.N.sub", label: "Subtract two- and three-digit numbers", curriculum: "Year 3 Number: subtract two-digit numbers, including from three-digit numbers" },
  ],
  generate(tier, rng) {
    const sub = chance(rng, 0.5);
    if (!sub) {
      const a = tier === 1 ? randInt(rng, 11, 89) : tier === 2 ? randInt(rng, 11, 79) : randInt(rng, 100, 899);
      const b = tier === 1 ? randInt(rng, 1, 9) : tier === 2 ? randInt(rng, 11, 99 - a) : randInt(rng, 11, Math.min(99, 999 - a));
      return numpad({ skill: "Y3.N.add", prompt: `${a} + ${b} = ?`, visual: { kind: "expression", text: `${a} + ${b}` }, hint: tier === 1 ? `Add the ones: ${a % 10} + ${b}.` : `Add the tens first, then the ones. Regroup if the ones make 10 or more.` }, a + b);
    }
    const a = tier === 1 ? randInt(rng, 11, 99) : tier === 2 ? randInt(rng, 30, 99) : randInt(rng, 120, 999);
    const b = tier === 1 ? randInt(rng, 1, 9) : tier === 2 ? randInt(rng, 11, a - 1) : randInt(rng, 11, 99);
    return numpad({ skill: "Y3.N.sub", prompt: `${a} − ${b} = ?`, visual: { kind: "expression", text: `${a} − ${b}` }, hint: tier === 1 ? `Count back ${b} from ${a}.` : `Take away the tens, then the ones. Or count up from ${b}.` }, a - b);
  },
};

const tables: Trail = {
  id: "y3-tables",
  name: "Times Tables Track",
  reoName: "Whakarea",
  blurb: "2s, 5s and 10s, then 3s and 4s.",
  icon: "times",
  strand: "number",
  skills: [
    { code: "Y3.N.x2x5x10", label: "2, 5 and 10 times tables", curriculum: "Year 3 Number: recall multiplication facts for 2, 5 and 10" },
    { code: "Y3.N.x3x4", label: "3 and 4 times tables", curriculum: "Year 3 Number: use skip counting and arrays for the 3 and 4 times tables" },
  ],
  generate(tier, rng) {
    const table = pick(rng, tier === 1 ? [2, 10] : tier === 2 ? [2, 5, 10] : [2, 3, 4, 5, 10]);
    const k = randInt(rng, 1, 10);
    const skill = table === 3 || table === 4 ? "Y3.N.x3x4" : "Y3.N.x2x5x10";
    const text = tier === 3 && chance(rng, 0.5) ? `${k} × ${table}` : `${table} × ${k}`;
    const base = { skill, prompt: `${text} = ?`, visual: (tier === 1 || (table >= 3 && table <= 4 && chance(rng, 0.5)) ? { kind: "array", rows: table, cols: k } : { kind: "expression", text }) as Visual, hint: `Count in ${table}s, ${k} times.` };
    return tier === 1 ? numberChoice(rng, base, table * k, { min: 0, max: 100, candidates: [table * (k + 1), table * (k - 1), table + k] }) : numpad(base, table * k);
  },
};

const divFrac: Trail = {
  id: "y3-divfrac",
  name: "Share & Fraction",
  reoName: "Wehewehe",
  blurb: "Share the kai and cut the cake into equal parts.",
  icon: "pie",
  strand: "number",
  skills: [
    { code: "Y3.N.division", label: "Division as sharing and grouping", curriculum: "Year 3 Number: divide by sharing and by making equal groups; link to multiplication facts" },
    { code: "Y3.N.unitFractions", label: "Unit fractions", curriculum: "Year 3 Number: identify and find unit fractions (1/2, 1/3, 1/4, 1/5) of shapes and sets" },
  ],
  generate(tier, rng) {
    const item = randomItem(rng);
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const divisor = pick(rng, tier === 1 ? [2, 5, 10] : [2, 3, 4, 5, 10]);
      const q = randInt(rng, 1, tier === 1 ? 5 : 10);
      const total = divisor * q;
      const grouping = tier === 3 && chance(rng, 0.5);
      const base = grouping
        ? { skill: "Y3.N.division", prompt: `${total} ${itemName(item, total)} in groups of ${divisor}. How many groups?`, visual: { kind: "expression", text: `${total} ÷ ${divisor}` } as Visual, hint: `Think ${divisor} × ? = ${total}.` }
        : { skill: "Y3.N.division", prompt: `${total} ÷ ${divisor} = ?`, visual: (tier === 1 ? { kind: "array", rows: divisor, cols: q, item } : { kind: "expression", text: `${total} ÷ ${divisor}` }) as Visual, hint: `Share ${total} between ${divisor}. Think ${divisor} × ? = ${total}.` };
      return tier === 1 ? numberChoice(rng, base, q, { min: 1, max: 12, candidates: [divisor, q + 1, q - 1] }) : numpad(base, q);
    }
    if (variant === 1) {
      const parts = pick(rng, [2, 3, 4, 5, 6, 8]);
      const shaded = tier === 1 ? 1 : randInt(rng, 1, parts - 1);
      const answer = `${shaded}/${parts}`;
      return textChoice(rng, { skill: "Y3.N.unitFractions", prompt: "What fraction is shaded?", visual: { kind: "fraction", parts, shaded, shape: pick(rng, ["circle", "bar"] as const) }, hint: "Top number: shaded parts. Bottom number: all the parts." }, answer, [`${shaded}/${parts + 1}`, `${parts - shaded}/${parts}`, `${shaded + 1}/${parts}`]);
    }
    const denom = pick(rng, tier === 1 ? [2] : tier === 2 ? [2, 4] : [2, 3, 4, 5]);
    const each = randInt(rng, 1, tier === 3 ? 6 : 5);
    const total = denom * each;
    const base = { skill: "Y3.N.unitFractions", prompt: `What is 1/${denom} of ${total}?`, visual: { kind: "objects", item, count: total } as Visual, hint: `Share ${total} into ${denom} equal groups. How many in one group?` };
    return tier === 1 ? numberChoice(rng, base, each, { min: 1, max: 12, candidates: [total, denom] }) : numpad(base, each);
  },
};

const rounding: Trail = {
  id: "y3-round",
  name: "Rounding Ridge",
  reoName: "Whakaawhiwhi",
  blurb: "Round to the nearest ten or hundred and estimate.",
  icon: "target",
  strand: "number",
  skills: [
    { code: "Y3.N.round", label: "Round to nearest 10 and 100", curriculum: "Year 3 Number: round numbers to the nearest 10 and 100" },
    { code: "Y3.N.estimate", label: "Estimate sums", curriculum: "Year 3 Number: estimate answers by rounding before calculating" },
  ],
  generate(tier, rng) {
    if (tier === 1 || (tier === 2 && chance(rng, 0.5))) {
      let n = randInt(rng, 11, 99);
      if (n % 10 === 5 && tier === 1) n += 1;
      const answer = Math.round(n / 10) * 10;
      const base = { skill: "Y3.N.round", prompt: `Round ${n} to the nearest 10.`, visual: { kind: "numberline", from: Math.floor(n / 10) * 10, to: Math.floor(n / 10) * 10 + 10, mark: n } as Visual, hint: "Which ten is it closest to? 5 or more rounds up." };
      return tier === 1 ? numberChoice(rng, base, answer, { min: 0, max: 110, candidates: [Math.floor(n / 10) * 10, Math.ceil(n / 10) * 10, n] }) : numpad(base, answer);
    }
    if (tier === 2 || chance(rng, 0.4)) {
      const n = randInt(rng, 101, 949);
      const answer = Math.round(n / 100) * 100;
      return numberChoice(rng, { skill: "Y3.N.round", prompt: `Round ${n} to the nearest 100.`, visual: { kind: "text", text: String(n) }, hint: "Look at the tens digit. 50 or more rounds up." }, answer, { min: 0, max: 1000, candidates: [Math.floor(n / 100) * 100, Math.ceil(n / 100) * 100, Math.round(n / 10) * 10] });
    }
    const a = randInt(rng, 11, 89);
    const b = randInt(rng, 11, 89);
    const est = Math.round(a / 10) * 10 + Math.round(b / 10) * 10;
    return numberChoice(rng, { skill: "Y3.N.estimate", prompt: `Estimate ${a} + ${b} by rounding each number to the nearest 10.`, visual: { kind: "expression", text: `${a} + ${b} ≈ ?` }, hint: `${a} rounds to ${Math.round(a / 10) * 10} and ${b} rounds to ${Math.round(b / 10) * 10}.` }, est, { min: 20, max: 200, candidates: [est + 10, est - 10, a + b] });
  },
};

const algebra: Trail = {
  id: "y3-algebra",
  name: "Pattern Peaks",
  reoName: "Tauira Maunga",
  blurb: "Spot the rule, find the unknown, build the fact family.",
  icon: "puzzle",
  strand: "algebra",
  skills: [
    { code: "Y3.A.patterns", label: "Number patterns with a rule", curriculum: "Year 3 Algebra: continue and describe number patterns with a constant rule" },
    { code: "Y3.A.unknowns", label: "Unknowns and fact families", curriculum: "Year 3 Algebra: find unknowns in equations and use related facts (fact families)" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const step = pick(rng, tier === 1 ? [2, 3, 5, 10] : tier === 2 ? [3, 4, 5, 10, 25] : [3, 4, 6, 7, 9, 25, 50]);
      const start = randInt(rng, 1, tier === 1 ? 10 : 30);
      const down = tier === 3 && chance(rng, 0.4);
      const seq = Array.from({ length: 5 }, (_, i) => (down ? start + step * 5 - i * step : start + i * step));
      const hiddenIdx = tier === 1 ? 4 : randInt(rng, 1, 4);
      const answer = seq[hiddenIdx] as number;
      const base = { skill: "Y3.A.patterns", prompt: "What is the missing number in the pattern?", visual: { kind: "sequence", values: seq.map((v, i) => (i === hiddenIdx ? null : v)) } as Visual, hint: `Find the jump between neighbours. It goes ${down ? "down" : "up"} by ${step}.` };
      return tier === 1 ? numberChoice(rng, base, answer, { min: 0, max: 400, candidates: [answer + step, answer - step, answer + 1] }) : numpad(base, answer);
    }
    if (variant === 1) {
      const kind = pick(rng, tier === 1 ? ["add", "sub"] : ["add", "sub", "mul"]);
      if (kind === "mul") {
        const table = pick(rng, [2, 3, 4, 5, 10]);
        const k = randInt(rng, 2, 10);
        return numpad({ skill: "Y3.A.unknowns", prompt: "What number goes in the box?", visual: { kind: "expression", text: `${table} × ☐ = ${table * k}` }, hint: `Count in ${table}s until you reach ${table * k}.` }, k);
      }
      const max = tier === 1 ? 20 : tier === 2 ? 50 : 100;
      const a = randInt(rng, 5, max - 5);
      const b = randInt(rng, 1, kind === "add" ? max - a : a - 1);
      const text = kind === "add" ? `${a} + ☐ = ${a + b}` : `${a} − ☐ = ${a - b}`;
      return numpad({ skill: "Y3.A.unknowns", prompt: "What number goes in the box?", visual: { kind: "expression", text }, hint: kind === "add" ? `Count up from ${a} to ${a + b}.` : `What is the difference between ${a} and ${a - b}?` }, b);
    }
    const a = randInt(rng, 2, 9);
    const b = randInt(rng, 2, 9);
    const family = [`${a} + ${b} = ${a + b}`, `${b} + ${a} = ${a + b}`, `${a + b} − ${a} = ${b}`, `${a + b} − ${b} = ${a}`];
    const wrong = [`${a} − ${b} = ${a + b}`, `${a + b} + ${a} = ${b}`, `${a} + ${a} = ${a + b}`];
    const answer = pick(rng, family);
    return textChoice(rng, { skill: "Y3.A.unknowns", prompt: `Which fact is in the same family as ${family[0]}?`, visual: { kind: "expression", text: family[0] as string }, hint: "A fact family uses the same three numbers." }, answer === family[0] ? (family[2] as string) : answer, wrong);
  },
};

const length: Trail = {
  id: "y3-length",
  name: "Centimetres & Metres",
  reoName: "Mita",
  blurb: "Read the ruler, pick the right unit, walk the perimeter.",
  icon: "ruler",
  strand: "measurement",
  skills: [
    { code: "Y3.M.ruler", label: "Measure in centimetres", curriculum: "Year 3 Measurement: measure length in centimetres using a ruler" },
    { code: "Y3.M.units", label: "Choose standard units", curriculum: "Year 3 Measurement: choose appropriate units (cm, m, kg, L) for everyday measurements" },
    { code: "Y3.M.perimeter", label: "Perimeter", curriculum: "Year 3 Measurement: find the perimeter of simple shapes by adding side lengths" },
    { code: "Y3.M.temperature", label: "Read a thermometer", curriculum: "Year 3 Measurement: read temperatures on a thermometer" },
  ],
  generate(tier, rng) {
    const variant = tier === 1 ? randInt(rng, 0, 1) : randInt(rng, 0, 3);
    if (variant === 0) {
      const len = randInt(rng, 2, tier === 1 ? 8 : 12);
      const base = { skill: "Y3.M.ruler", prompt: "How long is the feather in centimetres?", visual: { kind: "ruler", length: len, max: 12, unit: "cm" } as Visual, hint: "Start at 0 and read the number at the end of the feather." };
      return tier === 1 ? numberChoice(rng, base, len, { min: 1, max: 12, spread: 2 }) : numpad(base, len);
    }
    if (variant === 1) {
      const items: { thing: string; unit: string }[] = [
        { thing: "the length of a pencil", unit: "cm" },
        { thing: "the height of a door", unit: "m" },
        { thing: "the length of a rugby field", unit: "m" },
        { thing: "the mass of a bag of potatoes", unit: "kg" },
        { thing: "the water in a bath", unit: "L" },
        { thing: "the length of your finger", unit: "cm" },
        { thing: "the distance between two towns", unit: "km" },
        { thing: "the mass of an adult kiwi", unit: "kg" },
      ];
      const it = pick(rng, items);
      return textChoice(rng, { skill: "Y3.M.units", prompt: `Which unit would you use to measure ${it.thing}?`, hint: "cm for small lengths, m for big lengths, km for distances, kg for mass, L for liquids." }, it.unit, ["cm", "m", "km", "kg", "L"].filter((u) => u !== it.unit));
    }
    if (variant === 2) {
      const w = randInt(rng, 2, 9);
      const h = randInt(rng, 2, 9);
      const square = chance(rng, 0.3);
      const side = square ? w : undefined;
      const perimeter = square ? w * 4 : 2 * (w + h);
      return numpad({ skill: "Y3.M.perimeter", prompt: square ? `A square has sides of ${w} cm. What is its perimeter in cm?` : `A rectangle is ${w} cm long and ${h} cm wide. What is its perimeter in cm?`, visual: { kind: "shape", shape: square ? "square" : "rectangle" }, hint: square ? `Add all four sides: ${side} + ${side} + ${side} + ${side}.` : `Add all four sides: ${w} + ${h} + ${w} + ${h}.` }, perimeter);
    }
    const temp = randInt(rng, 0, 30);
    const base = { skill: "Y3.M.temperature", prompt: "What temperature does the thermometer show?", visual: { kind: "thermometer", value: temp, max: 40 } as Visual, hint: "Read the number level with the top of the red line." };
    return numberChoice(rng, base, temp, { min: 0, max: 40, spread: 4, candidates: [temp + 5, temp - 5, temp + 10] });
  },
};

const timeMoney: Trail = {
  id: "y3-timemoney",
  name: "Time & Money",
  reoName: "Wā me te Moni",
  blurb: "Quarter past, quarter to, calendars and dollars.",
  icon: "clock",
  strand: "measurement",
  skills: [
    { code: "Y3.M.quarterHours", label: "Quarter past and quarter to", curriculum: "Year 3 Measurement: read analogue and digital time to the quarter hour and five minutes" },
    { code: "Y3.M.calendar", label: "Calendars", curriculum: "Year 3 Measurement: read a calendar and find dates and days" },
    { code: "Y3.M.money", label: "Money to $10", curriculum: "Year 3 Measurement/Number: count amounts of money to $10 and work out simple change" },
  ],
  generate(tier, rng) {
    const variant = randInt(rng, 0, 2);
    if (variant === 0) {
      const hour = randInt(rng, 1, 12);
      const minute = tier === 1 ? pick(rng, [0, 30, 15, 45]) : tier === 2 ? pick(rng, [15, 45, 30]) : pick(rng, [5, 10, 20, 25, 35, 40, 50, 55]);
      const asDigital = tier === 3 || chance(rng, 0.4);
      if (asDigital) {
        const wrong = [digitalTime(hour, (minute + 15) % 60), digitalTime((hour % 12) + 1, minute), digitalTime(hour, (minute + 30) % 60)];
        return textChoice(rng, { skill: "Y3.M.quarterHours", prompt: "What time is it? Pick the digital time.", visual: { kind: "clock", hour, minute }, hint: "Count the minutes in 5s around from the 12." }, digitalTime(hour, minute), wrong);
      }
      const wrong = [timeWords(hour, minute === 15 ? 45 : 15), timeWords((hour % 12) + 1, minute), timeWords(hour, minute === 30 ? 0 : 30)];
      return textChoice(rng, { skill: "Y3.M.quarterHours", prompt: "What time does the clock show?", visual: { kind: "clock", hour, minute }, hint: "Long hand on 3 is quarter past, on 9 is quarter to the next hour." }, timeWords(hour, minute), wrong);
    }
    if (variant === 1) {
      const monthIdx = randInt(rng, 0, 11);
      const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIdx] as number;
      const startDay = randInt(rng, 0, 6);
      const date = randInt(rng, 1, days);
      const dayName = DAYS[(startDay + date - 1) % 7] as string;
      if (tier === 1 || chance(rng, 0.5)) {
        return textChoice(rng, { skill: "Y3.M.calendar", prompt: `What day of the week is the ${date}${ordinal(date)} of ${MONTHS[monthIdx]}?`, visual: { kind: "calendar", month: MONTHS[monthIdx] as string, days, startDay, mark: date }, hint: "Find the date, then look at the column heading." }, dayName, shuffle(rng, DAYS.filter((d) => d !== dayName)).slice(0, 3));
      }
      const ahead = pick(rng, [7, 14]);
      if (date + ahead > days) return timeMoney.generate(tier, rng);
      return numpad({ skill: "Y3.M.calendar", prompt: `Today is the ${date}${ordinal(date)}. What date is it in ${ahead === 7 ? "one week" : "two weeks"}?`, visual: { kind: "calendar", month: MONTHS[monthIdx] as string, days, startDay, mark: date }, hint: "One week is 7 days: go down one row on the calendar." }, date + ahead);
    }
    if (tier === 1) {
      const coins = Array.from({ length: randInt(rng, 2, 4) }, () => pick(rng, NZ_COINS));
      const total = coins.reduce((s, c) => s + c, 0);
      return textChoice(rng, { skill: "Y3.M.money", prompt: "How much money is this altogether?", visual: { kind: "coins", coins }, hint: "Start with the biggest coin and count on." }, money(total), [total + 10, total - 10, total + 100].filter((w) => w > 0).map(money));
    }
    if (tier === 2) {
      const price = pick(rng, [150, 250, 350, 450, 550, 650]);
      const extra = pick(rng, [50, 100, 200]);
      return textChoice(rng, { skill: "Y3.M.money", prompt: `A pie costs ${money(price)}. A juice costs ${money(extra)}. How much altogether?`, visual: { kind: "expression", text: `${money(price)} + ${money(extra)}` }, hint: "Add the dollars, then the cents." }, money(price + extra), [money(price + extra + 50), money(price + extra - 50), money(price + extra + 100)]);
    }
    const price = pick(rng, [150, 250, 350, 450, 320, 480, 270]);
    const paid = 500;
    return textChoice(rng, { skill: "Y3.M.money", prompt: `Something costs ${money(price)}. You pay with $5. How much change do you get?`, visual: { kind: "expression", text: `$5 − ${money(price)}` }, hint: `Count up from ${money(price)} to $5.` }, money(paid - price), [money(paid - price + 50), money(paid - price - 50), money(paid - price + 100)]);
  },
};

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10] as string;
}

const SIDES: Record<string, number> = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, octagon: 8 };
const SOLIDS: { shape: ShapeName; faces: number; edges: number; vertices: number }[] = [
  { shape: "cube", faces: 6, edges: 12, vertices: 8 },
  { shape: "cuboid", faces: 6, edges: 12, vertices: 8 },
  { shape: "pyramid", faces: 5, edges: 8, vertices: 5 },
  { shape: "cylinder", faces: 3, edges: 2, vertices: 0 },
  { shape: "cone", faces: 2, edges: 1, vertices: 1 },
  { shape: "sphere", faces: 1, edges: 0, vertices: 0 },
];

const geometry: Trail = {
  id: "y3-geometry",
  name: "Shapes, Grids & Turns",
  reoName: "Āhua me te Huri",
  blurb: "Polygons, faces and edges, map squares and turns.",
  icon: "shapes",
  strand: "geometry",
  skills: [
    { code: "Y3.G.polygons", label: "Name and classify polygons", curriculum: "Year 3 Geometry: name polygons by their number of sides (to octagons) and identify lines of symmetry" },
    { code: "Y3.G.solids", label: "Faces, edges and vertices", curriculum: "Year 3 Geometry: describe 3D objects by faces, edges and vertices" },
    { code: "Y3.G.grid", label: "Grid references", curriculum: "Year 3 Geometry: locate positions on a grid using letter-number references" },
    { code: "Y3.G.turns", label: "Turns", curriculum: "Year 3 Geometry: describe quarter, half and full turns, clockwise and anticlockwise" },
  ],
  generate(tier, rng) {
    const variant = tier === 1 ? randInt(rng, 0, 2) : randInt(rng, 0, 3);
    if (variant === 0) {
      const shape = pick(rng, ["triangle", "square", "rectangle", "pentagon", "hexagon", "octagon"] as ShapeName[]);
      if (chance(rng, 0.5)) {
        return textChoice(rng, { skill: "Y3.G.polygons", prompt: "What is this shape called?", visual: { kind: "shape", shape }, hint: `Count the sides: ${SIDES[shape]}.` }, shape, shuffle(rng, ["triangle", "square", "rectangle", "pentagon", "hexagon", "octagon"].filter((s) => s !== shape)).slice(0, 3));
      }
      return numberChoice(rng, { skill: "Y3.G.polygons", prompt: `How many sides does a ${shape} have?`, visual: { kind: "shape", shape }, hint: "Count each straight edge." }, SIDES[shape] as number, { min: 3, max: 10, spread: 2 });
    }
    if (variant === 1) {
      const s = pick(rng, tier === 1 ? SOLIDS.slice(0, 3) : SOLIDS);
      const which = pick(rng, tier === 1 ? (["faces"] as const) : (["faces", "edges", "vertices"] as const));
      const answer = s[which];
      return numberChoice(rng, { skill: "Y3.G.solids", prompt: `How many ${which} does a ${s.shape} have?`, visual: { kind: "shape", shape: s.shape }, hint: which === "faces" ? "Faces are the flat or curved surfaces." : which === "edges" ? "Edges are where two faces meet." : "Vertices are the pointy corners." }, answer, { min: 0, max: 12, spread: 3 });
    }
    if (variant === 2) {
      const cols = tier === 1 ? 4 : 5;
      const rows = tier === 1 ? 4 : 5;
      const creature = pick(rng, ["kea", "kiwi", "tuatara", "weta"] as const);
      const col = randInt(rng, 0, cols - 1);
      const row = randInt(rng, 0, rows - 1);
      const letters = "ABCDE";
      const answer = `${letters[col]}${row + 1}`;
      if (tier === 3 && chance(rng, 0.5)) {
        const wrongCells = new Set<string>();
        while (wrongCells.size < 3) {
          const w = `${letters[randInt(rng, 0, cols - 1)]}${randInt(rng, 1, rows)}`;
          if (w !== answer) wrongCells.add(w);
        }
        const opts = [answer, ...wrongCells].map((cell) => {
          const c = letters.indexOf(cell[0] as string);
          const r = Number(cell.slice(1)) - 1;
          return { value: cell, visual: { kind: "grid", cols, rows, marks: [{ col: c, row: r, creature }], labels: "letters" } as Visual };
        });
        return visualChoice(rng, { skill: "Y3.G.grid", prompt: `Which map shows the ${creatureName(creature)} at ${answer}?`, hint: "Letter along the bottom, number up the side." }, answer, opts);
      }
      const wrong = new Set<string>();
      while (wrong.size < 3) {
        const w = `${letters[randInt(rng, 0, cols - 1)]}${randInt(rng, 1, rows)}`;
        if (w !== answer) wrong.add(w);
      }
      return textChoice(rng, { skill: "Y3.G.grid", prompt: `Where is the ${creatureName(creature)} on the map?`, visual: { kind: "grid", cols, rows, marks: [{ col, row, creature }], labels: "letters" }, hint: "Read the letter along the bottom first, then the number up the side." }, answer, [...wrong]);
    }
    const from = pick(rng, [0, 90, 180, 270]);
    const amount = pick(rng, [90, 180, 270, 360]);
    const direction = chance(rng, 0.5) ? "clockwise" : "anticlockwise";
    const to = ((from + (direction === "clockwise" ? amount : 360 - amount)) % 360 + 360) % 360;
    const name = amount === 90 ? "quarter turn" : amount === 180 ? "half turn" : amount === 270 ? "three-quarter turn" : "full turn";
    return textChoice(rng, { skill: "Y3.G.turns", prompt: "The arrow turned. What kind of turn was it?", visual: { kind: "turn", from, to, direction }, hint: "A quarter turn is a right angle. A half turn faces the opposite way." }, `${name} ${direction}`, [`${amount === 90 ? "half turn" : "quarter turn"} ${direction}`, `${name} ${direction === "clockwise" ? "anticlockwise" : "clockwise"}`, `${amount === 180 ? "quarter turn" : "half turn"} ${direction === "clockwise" ? "anticlockwise" : "clockwise"}`]);
  },
};

const stats: Trail = {
  id: "y3-stats",
  name: "Data & Chance",
  reoName: "Raraunga",
  blurb: "Read bar graphs and order how likely things are.",
  icon: "chart",
  strand: "statistics",
  strand2: "probability",
  skills: [
    { code: "Y3.S.graphs", label: "Bar graphs and tallies", curriculum: "Year 3 Statistics: read and compare data in bar graphs, dot plots and tally charts" },
    { code: "Y3.P.likelihood", label: "Order likelihood", curriculum: "Year 3 Probability: compare and order the likelihood of events; identify equally likely outcomes" },
  ],
  generate(tier, rng) {
    if (chance(rng, 0.6)) {
      const labels = shuffle(rng, ["Kea", "Kiwi", "Tūī", "Wētā", "Ruru"]).slice(0, 4);
      const step = tier === 3 ? 2 : 1;
      const counts = labels.map(() => randInt(rng, 1, tier === 1 ? 8 : 10) * step);
      if (new Set(counts).size !== counts.length) return stats.generate(tier, rng);
      const rows = labels.map((label, i) => ({ label, value: counts[i] as number }));
      const visual: Visual = tier === 2 && chance(rng, 0.4) ? { kind: "tally", rows: rows.map((r) => ({ label: r.label, count: r.value })) } : { kind: "barchart", bars: rows, step };
      const variant = randInt(rng, 0, 2);
      if (variant === 0) {
        const row = pick(rng, rows);
        return numberChoice(rng, { skill: "Y3.S.graphs", prompt: `How many ${row.label.toLowerCase()} were counted?`, visual, hint: step === 2 ? "The scale goes up in 2s." : "Read the height of the bar against the scale." }, row.value, { min: 0, max: 22, spread: 2 });
      }
      if (variant === 1) {
        const total = counts.reduce((s, c) => s + c, 0);
        return numpad({ skill: "Y3.S.graphs", prompt: "How many creatures were counted altogether?", visual, hint: "Add up every bar." }, total);
      }
      const [x, y] = shuffle(rng, rows).slice(0, 2) as [typeof rows[number], typeof rows[number]];
      const big = x.value > y.value ? x : y;
      const small = x.value > y.value ? y : x;
      return numberChoice(rng, { skill: "Y3.S.graphs", prompt: `How many more ${big.label.toLowerCase()} than ${small.label.toLowerCase()}?`, visual, hint: "Take the smaller number from the bigger one." }, big.value - small.value, { min: 0, max: 20, spread: 2 });
    }
    if (tier === 1 || chance(rng, 0.5)) {
      const colours = shuffle(rng, ["red", "blue", "green", "yellow"]).slice(0, tier === 1 ? 2 : 3);
      const weights = tier === 1 ? [5, 1] : shuffle(rng, [4, 2, 1]);
      const segments = colours.flatMap((c, i) => Array(weights[i]).fill(colourHex(c)) as string[]);
      const most = colours[weights.indexOf(Math.max(...weights))] as string;
      const least = colours[weights.indexOf(Math.min(...weights))] as string;
      const askMost = chance(rng, 0.5);
      return textChoice(rng, { skill: "Y3.P.likelihood", prompt: `Which colour is the spinner ${askMost ? "most" : "least"} likely to land on?`, visual: { kind: "spinner", segments }, hint: "Bigger part of the spinner means more likely." }, askMost ? most : least, colours.filter((c) => c !== (askMost ? most : least)));
    }
    const a = randInt(rng, 1, 4);
    const equal = chance(rng, 0.5);
    const contents = [{ colour: "red", count: a }, { colour: "blue", count: equal ? a : a + randInt(rng, 1, 3) }];
    return textChoice(rng, { skill: "Y3.P.likelihood", prompt: "You pick one berry without looking. Which is true?", visual: { kind: "bag", contents }, hint: "Compare how many of each colour are in the bag." }, equal ? "Red and blue are equally likely" : "Blue is more likely than red", ["Red and blue are equally likely", "Blue is more likely than red", "Red is more likely than blue"]);
  },
};

export const region3: Region = {
  id: "southern-alps",
  index: 2,
  name: "Southern Alps",
  reoName: "Kā Tiritiri o te Moana",
  yearLabel: "Year 3 · age 7",
  year: 3,
  colour: "#0ea5e9",
  blurb: "Snowy peaks, glaciers and cheeky kea. Bigger numbers live up high.",
  trails: [place1000, addSub, tables, divFrac, rounding, algebra, length, timeMoney, geometry, stats],
  rescue: { creature: "kea", name: "Kea", reoName: "Kea", fact: "Kea are the world's only alpine parrots. They are clever, curious and love to investigate anything new." },
};
