/**
 * Thin wrapper around Supabase for parent accounts and family-code saves.
 * The client is imported lazily so the app never loads it when sync is unused,
 * and every call returns a plain result instead of throwing.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { familyCodeHash } from "./familycode";

/** Accepts the plain project URL or a pasted REST endpoint like https://ref.supabase.co/rest/v1/. */
function projectUrl(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/(rest|auth|storage|realtime|functions)\/v1\/?$/, "").replace(/\/+$/, "");
}

const URL = projectUrl(import.meta.env.VITE_SUPABASE_URL);
const KEY = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "").trim();

export function cloudConfigured(): boolean {
  return /^https:\/\/.+/.test(URL) && KEY.length > 20;
}

let clientPromise: Promise<SupabaseClient> | null = null;

async function client(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }),
    );
  }
  return clientPromise;
}

export type CloudResult<T = void> = { ok: true; value: T } | { ok: false; error: string };

function fail<T>(err: unknown, fallback = "Something went wrong. Check your connection and try again."): CloudResult<T> {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : (err as { message?: string })?.message;
  return { ok: false, error: friendly(msg ?? fallback) };
}

function friendly(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "That email or password is not right.";
  if (m.includes("already registered")) return "There is already an account with that email. Try signing in.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("password should be")) return "Passwords need at least 6 characters.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Could not reach the cloud. Check your internet connection.";
  if (m.includes("rate limit")) return "Too many tries. Please wait a minute and try again.";
  return msg;
}

/* ---------- Parent accounts ---------- */

export interface CloudUser {
  id: string;
  email: string;
}

export async function currentUser(): Promise<CloudUser | null> {
  if (!cloudConfigured()) return null;
  try {
    const { data } = await (await client()).auth.getSession();
    const u = data.session?.user;
    return u ? { id: u.id, email: u.email ?? "" } : null;
  } catch {
    return null;
  }
}

export async function signUp(email: string, password: string): Promise<CloudResult<{ needsConfirmation: boolean; user: CloudUser | null }>> {
  try {
    const { data, error } = await (await client()).auth.signUp({ email, password });
    if (error) return fail(error);
    const user = data.session && data.user ? { id: data.user.id, email: data.user.email ?? email } : null;
    return { ok: true, value: { needsConfirmation: !data.session, user } };
  } catch (err) {
    return fail(err);
  }
}

export async function signIn(email: string, password: string): Promise<CloudResult<CloudUser>> {
  try {
    const { data, error } = await (await client()).auth.signInWithPassword({ email, password });
    if (error || !data.user) return fail(error ?? "Sign in failed");
    return { ok: true, value: { id: data.user.id, email: data.user.email ?? "" } };
  } catch (err) {
    return fail(err);
  }
}

export async function signOut(): Promise<void> {
  try {
    await (await client()).auth.signOut();
  } catch {
    /* ignore */
  }
}

export async function requestPasswordReset(email: string): Promise<CloudResult> {
  try {
    const redirectTo = typeof location !== "undefined" ? location.href.split("#")[0] : undefined;
    const { error } = await (await client()).auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : {});
    if (error) return fail(error);
    return { ok: true, value: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function updatePassword(password: string): Promise<CloudResult> {
  try {
    const { error } = await (await client()).auth.updateUser({ password });
    if (error) return fail(error);
    return { ok: true, value: undefined };
  } catch (err) {
    return fail(err);
  }
}

/** Resolves true once if the app was opened from a password-reset link. */
export async function passwordRecoveryPending(): Promise<boolean> {
  if (!cloudConfigured() || typeof location === "undefined") return false;
  if (!location.hash.includes("type=recovery")) return false;
  try {
    await (await client()).auth.getSession();
    return true;
  } catch {
    return false;
  }
}

export async function pullAccount(): Promise<CloudResult<unknown | null>> {
  try {
    const { data, error } = await (await client()).from("saves").select("state").maybeSingle();
    if (error) return fail(error);
    return { ok: true, value: data?.state ?? null };
  } catch (err) {
    return fail(err);
  }
}

export async function pushAccount(userId: string, state: unknown): Promise<CloudResult> {
  try {
    const { error } = await (await client()).from("saves").upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
    if (error) return fail(error);
    return { ok: true, value: undefined };
  } catch (err) {
    return fail(err);
  }
}

/* ---------- Family codes ---------- */

export async function pullFamily(code: string): Promise<CloudResult<unknown | null>> {
  try {
    const p_hash = await familyCodeHash(code);
    const { data, error } = await (await client()).rpc("family_pull", { p_hash });
    if (error) return fail(error);
    return { ok: true, value: data ?? null };
  } catch (err) {
    return fail(err);
  }
}

export async function pushFamily(code: string, state: unknown): Promise<CloudResult> {
  try {
    const p_hash = await familyCodeHash(code);
    const { error } = await (await client()).rpc("family_push", { p_hash, p_state: state });
    if (error) return fail(error);
    return { ok: true, value: undefined };
  } catch (err) {
    return fail(err);
  }
}
