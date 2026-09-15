/**
 * Family codes: a memorable secret that links devices without an email address.
 * Four nature words from a 256-word list plus six digits gives roughly 52 bits of
 * entropy, which is comparable to a strong password. Only a SHA-256 hash ever leaves
 * the device, and the cloud stores saves keyed by that hash.
 */
const WORDS = (
  "kiwi tui kea weta ruru moa fern kauri rimu totara nikau flax manuka koru pohutukawa kowhai rata beech tawa matai " +
  "river lake beach bay cove reef dune tide wave surf foam mist rain cloud storm frost snow ice glacier peak " +
  "ridge valley gorge cliff cave rock stone sand shell pearl coral kelp moss lichen leaf seed root bark twig branch " +
  "trail track path bridge hut camp fire ember spark star moon sun dawn dusk night sky wind breeze gale calm " +
  "sparrow finch heron gull tern petrel gannet shag duck swan goose plover oyster mussel paua crab shrimp squid ray " +
  "eel trout salmon seal whale orca dolphin penguin gecko skink frog snail beetle moth bee wasp ant spider worm " +
  "apple pear plum peach berry grape lemon lime melon kumara corn bean pea carrot pumpkin honey bread cake tea milk " +
  "red blue green gold silver amber jade pearl ruby coral ivory copper bronze rose lilac indigo violet olive teal cream " +
  "north south east west summer autumn winter spring monday friday sunday morning midday evening tahi rua toru wha rima " +
  "ono whitu waru iwa tekau aroha mana wai maunga awa moana rangi papa whenua ngahere manu ika kai waka marae kapa haka " +
  "little big quick slow bright brave happy gentle kind clever lucky sunny cosy tidy merry jolly wild free bold calm " +
  "hop skip jump run swim climb dive fly glide roll spin drift float sail row paddle wander roam explore seek find " +
  "meadow orchard garden harbour island lagoon marsh delta creek brook pond spring canyon summit plateau tundra " +
  "harakeke ponga karaka puriri kahikatea horopito pikopiko kawakawa tawhai miro hinau rewarewa mahoe kanuka tanekaha " +
  "lantern compass kettle blanket basket bucket rope canoe kayak tent torch map trail boot jacket scarf mitten"
).split(/\s+/).filter((w, i, arr) => w.length >= 3 && arr.indexOf(w) === i);

const WORD_COUNT = 256;
const LIST = WORDS.slice(0, WORD_COUNT);
if (LIST.length < WORD_COUNT) throw new Error(`family code word list has only ${LIST.length} words`);

function randomInts(count: number, max: number): number[] {
  const out = new Uint32Array(count);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(out);
  else for (let i = 0; i < count; i++) out[i] = Math.floor(Math.random() * 0xffffffff);
  return [...out].map((n) => n % max);
}

export function generateFamilyCode(): string {
  const words = randomInts(4, WORD_COUNT).map((i) => LIST[i] as string);
  const digits = String(randomInts(1, 1_000_000)[0]).padStart(6, "0");
  return `${words.join("-")}-${digits}`;
}

export function normaliseFamilyCode(input: string): string {
  return input.trim().toLowerCase().replace(/[\s_.,/]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function isValidFamilyCode(code: string): boolean {
  return /^[a-z]+(-[a-z]+){3}-\d{6}$/.test(code);
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hash used as the cloud key. Salted with the app name so hashes are not reusable elsewhere. */
export function familyCodeHash(code: string): Promise<string> {
  return sha256Hex(`nature-maths:family:${normaliseFamilyCode(code)}`);
}
