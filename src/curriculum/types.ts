/**
 * Core curriculum types for Nature Maths.
 *
 * The world is made of regions (one per NZ curriculum year level, Years 1-4).
 * Each region has trails (topics) that together cover every strand of
 * Te Mātaiaho Mathematics and Statistics: Number, Algebra, Measurement,
 * Geometry, Statistics and Probability. Each trail has three tiers of
 * difficulty (Bronze, Silver, Gold). Each region ends with a creature rescue
 * that mixes every trail in the region.
 */

export type Tier = 1 | 2 | 3;

export type Strand = "number" | "algebra" | "measurement" | "geometry" | "statistics" | "probability";

export const STRAND_NAMES: Record<Strand, string> = {
  number: "Number",
  algebra: "Algebra",
  measurement: "Measurement",
  geometry: "Geometry",
  statistics: "Statistics",
  probability: "Probability",
};

/** Countable things found on the trails. */
export type ItemKind = "shell" | "feather" | "berry" | "leaf" | "stone" | "flower" | "egg" | "star" | "fish" | "acorn" | "cup";

export type ShapeName =
  | "circle" | "triangle" | "square" | "rectangle" | "pentagon" | "hexagon" | "oval" | "rhombus" | "trapezium" | "octagon"
  | "cube" | "sphere" | "cylinder" | "cone" | "pyramid" | "cuboid";

export type CreatureName = "kiwi" | "tui" | "fantail" | "weta" | "tuatara" | "kea" | "penguin" | "pukeko" | "kakapo" | "dolphin" | "morepork" | "gecko";

export type PatternToken = { shape: "circle" | "square" | "triangle" | "star" | "heart"; colour: string };

/**
 * Visual shown above the question prompt (or inside an answer option when small).
 *
 * `counted` on the countable visuals marks how many have been counted so far. Questions
 * never set it; the worked examples in app/showme.ts use it to count along with a child.
 */
export type Visual =
  | { kind: "objects"; item: ItemKind; count: number; crossed?: number; counted?: number }
  | { kind: "groups"; item: ItemKind; groups: readonly number[]; operator?: "+" | "-" | "×" }
  | { kind: "tenframe"; count: number; frames?: number; secondColour?: number }
  | { kind: "dots"; count: number; pattern: "dice" | "scatter" | "line" }
  | { kind: "numberline"; from: number; to: number; step?: number; mark?: number; hidden?: readonly number[] }
  | { kind: "blocks"; hundreds?: number; tens: number; ones: number }
  | { kind: "expression"; text: string }
  | { kind: "fraction"; parts: number; shaded: number; shape: "circle" | "bar" }
  | { kind: "array"; rows: number; cols: number; item?: ItemKind; counted?: number }
  | { kind: "sequence"; values: readonly (number | null)[] }
  | { kind: "hundredchart"; start: number; hidden: readonly number[]; size?: number }
  | { kind: "text"; text: string }
  // Measurement
  | { kind: "clock"; hour: number; minute: number }
  | { kind: "coins"; coins: readonly number[] } // NZ coins in cents: 10, 20, 50, 100, 200
  | { kind: "lengths"; bars: readonly { label: string; length: number; colour?: string }[] } // relative lengths 1-10
  | { kind: "ruler"; length: number; max?: number; unit?: string } // object measured against a ruler
  | { kind: "balance"; left: { item: ItemKind; count: number }; right: { item: ItemKind; count: number }; tilt: "left" | "right" | "level" }
  | { kind: "containers"; levels: readonly number[] } // fill levels 0-1
  | { kind: "areagrid"; rows: number; cols: number; shaded: readonly (readonly [number, number])[] }
  | { kind: "thermometer"; value: number; max?: number }
  | { kind: "calendar"; month: string; days: number; startDay: number; mark?: number }
  // Geometry
  | { kind: "shape"; shape: ShapeName; colour?: string; symmetryLine?: "vertical" | "horizontal" | "diagonal" | "none" }
  | { kind: "shapes"; shapes: readonly { shape: ShapeName; colour?: string }[] }
  | { kind: "grid"; cols: number; rows: number; marks: readonly { col: number; row: number; creature: CreatureName }[]; labels: "letters" | "numbers" }
  | { kind: "angle"; degrees: number }
  | { kind: "position"; creature: CreatureName; place: "above" | "below" | "left" | "right" | "inside" | "on" }
  | { kind: "turn"; from: number; to: number; direction: "clockwise" | "anticlockwise" }
  | { kind: "transform"; shape: "L" | "arrow" | "flag"; type: "reflection" | "rotation" | "translation" }
  | { kind: "pattern"; tokens: readonly PatternToken[]; missing?: number }
  // Statistics & probability
  | { kind: "pictograph"; item: ItemKind; rows: readonly { label: string; count: number }[]; scale?: number }
  | { kind: "barchart"; bars: readonly { label: string; value: number; colour?: string }[]; step?: number }
  | { kind: "tally"; rows: readonly { label: string; count: number }[] }
  | { kind: "spinner"; segments: readonly string[] } // colours per equal segment
  | { kind: "bag"; contents: readonly { colour: string; count: number }[] }
  | { kind: "creature"; creature: CreatureName };

export interface Option {
  value: string;
  label?: string;
  /** Te reo Māori sub-label, filled automatically for small numbers. */
  reo?: string;
  visual?: Visual;
}

export type InputMode = "choice" | "numpad" | "truefalse";

export interface Question {
  /** Curriculum skill code, e.g. "Y1.M.compareLength". */
  skill: string;
  prompt: string;
  /** Optional spoken version of the prompt (defaults to prompt). */
  say?: string;
  visual?: Visual;
  mode: InputMode;
  options?: Option[];
  answer: string;
  hint?: string;
  flash?: number;
  explain?: string;
}

export type Rng = () => number;
export type Generator = (tier: Tier, rng: Rng) => Question;

export interface Skill {
  code: string;
  label: string;
  /** NZ curriculum alignment (Te Mātaiaho, Mathematics and Statistics). */
  curriculum: string;
}

export interface Trail {
  id: string;
  name: string;
  /** Optional te reo Māori name. */
  reoName?: string;
  blurb: string;
  icon: string;
  strand: Strand;
  /** Secondary strand for combined trails. */
  strand2?: Strand;
  skills: Skill[];
  generate: Generator;
}

export interface Region {
  id: string;
  index: number;
  name: string;
  reoName: string;
  yearLabel: string;
  year: 1 | 2 | 3 | 4;
  colour: string;
  blurb: string;
  trails: Trail[];
  /** The creature rescued by completing this region's final challenge. */
  rescue: { creature: CreatureName; name: string; reoName: string; fact: string };
}
