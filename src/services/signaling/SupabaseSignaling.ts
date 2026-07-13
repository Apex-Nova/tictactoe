/**
 * SupabaseSignaling — WebRTC SDP exchange via Supabase database polling.
 *
 * Uses a simple `signaling_rooms` table — no Realtime channels, no RLS complexity.
 * Both sides poll every 500ms until they get what they need.
 *
 * Required SQL (run once in Supabase SQL Editor):
 * ─────────────────────────────────────────────────────────────────────────────
 * create table if not exists signaling_rooms (
 *   code text primary key,
 *   offer jsonb,
 *   answer jsonb,
 *   host_ice jsonb[] default '{}',
 *   guest_ice jsonb[] default '{}',
 *   created_at timestamptz default now()
 * );
 * alter table signaling_rooms enable row level security;
 * create policy "anon full access" on signaling_rooms
 *   for all to anon using (true) with check (true);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

/** Tests Supabase connectivity. Returns null if OK, error string if not. */
export async function testSupabaseConnection(): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured (missing env vars).';
  try {
    const { error } = await supabase.from('signaling_rooms').select('code').limit(1);
    if (error) return `Table error: ${error.message} (code ${error.code})`;
    return null;
  } catch (e) {
    return `Network error: ${String(e)} — Supabase project may be paused.`;
  }
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

type Row = {
  code: string;
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  host_ice: RTCIceCandidateInit[];
  guest_ice: RTCIceCandidateInit[];
};

async function getRow(code: string): Promise<Row | null> {
  const { data } = await supabase!.from('signaling_rooms').select('*').eq('code', code).maybeSingle();
  return data as Row | null;
}

function poll(fn: () => Promise<boolean>, intervalMs = 600, timeoutMs = 60000): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  const tick = async () => {
    if (stopped) return;
    const done = await fn().catch(() => false);
    if (!done && !stopped) timer = setTimeout(tick, intervalMs);
  };

  timer = setTimeout(tick, 0);
  const stopTimer = setTimeout(() => { stopped = true; }, timeoutMs);

  return () => {
    stopped = true;
    clearTimeout(timer);
    clearTimeout(stopTimer);
  };
}

// ── Host ──────────────────────────────────────────────────────────────────────

export async function hostRoom(
  code: string,
  offer: RTCSessionDescriptionInit,
  onSignal: (msg: { type: 'answer'; sdp: RTCSessionDescriptionInit } | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }) => void,
): Promise<() => void> {
  if (!supabase) throw new Error('Supabase not configured');

  // Write the offer
  const { error } = await supabase.from('signaling_rooms').upsert({
    code,
    offer,
    answer: null,
    host_ice: [],
    guest_ice: [],
  });
  if (error) throw new Error(`Failed to create room: ${error.message}`);

  let lastGuestIceLen = 0;

  // Poll for answer + guest ICE candidates
  const stop = poll(async () => {
    const row = await getRow(code);
    if (!row) return false;

    if (row.answer) {
      onSignal({ type: 'answer', sdp: row.answer });

      // Drain any already-arrived guest ICE
      for (const c of row.guest_ice) {
        onSignal({ type: 'ice-candidate', candidate: c });
      }
      lastGuestIceLen = row.guest_ice.length;
      return true; // stop polling for answer; switch to ICE-only poll
    }
    return false;
  });

  // After answer arrives, keep polling for trickle ICE
  let icePollStop: (() => void) | null = null;

  const origStop = stop;
  let answerReceived = false;

  const wrappedOnSignal: typeof onSignal = (msg) => {
    if (msg.type === 'answer') {
      answerReceived = true;
      onSignal(msg);
      // Start ICE-only polling
      icePollStop = poll(async () => {
        const row = await getRow(code);
        if (!row) return false;
        const newCandidates = row.guest_ice.slice(lastGuestIceLen);
        for (const c of newCandidates) {
          onSignal({ type: 'ice-candidate', candidate: c });
        }
        lastGuestIceLen = row.guest_ice.length;
        return false; // keep polling until manually stopped
      });
    } else {
      onSignal(msg);
    }
  };

  // Replace the callback by rebuilding (simpler: just use wrappedOnSignal from the start)
  // We restart with the wrapped version:
  stop(); // cancel original poll

  const stopFinal = poll(async () => {
    const row = await getRow(code);
    if (!row) return false;

    if (!answerReceived && row.answer) {
      answerReceived = true;
      wrappedOnSignal({ type: 'answer', sdp: row.answer });
      for (const c of row.guest_ice) {
        wrappedOnSignal({ type: 'ice-candidate', candidate: c });
      }
      lastGuestIceLen = row.guest_ice.length;
      return true;
    }
    return false;
  });

  return () => {
    stopFinal();
    icePollStop?.();
    // Clean up the room row after a short delay
    setTimeout(() => supabase!.from('signaling_rooms').delete().eq('code', code), 30000);
  };
}

/** Host calls this to send its own ICE candidates to the guest */
export async function sendHostIce(code: string, candidate: RTCIceCandidateInit) {
  if (!supabase) return;
  // Append to host_ice array
  const row = await getRow(code);
  if (!row) return;
  await supabase.from('signaling_rooms').update({
    host_ice: [...(row.host_ice ?? []), candidate],
  }).eq('code', code);
}

// ── Guest ─────────────────────────────────────────────────────────────────────

export async function guestJoinRoom(
  code: string,
  onSignal: (msg: { type: 'offer'; sdp: RTCSessionDescriptionInit } | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }) => void,
): Promise<{ sendAnswer: (sdp: RTCSessionDescriptionInit) => Promise<void>; sendGuestIce: (c: RTCIceCandidateInit) => Promise<void>; cleanup: () => void }> {
  if (!supabase) throw new Error('Supabase not configured');

  let lastHostIceLen = 0;

  // Poll for the offer
  await new Promise<void>((resolve, reject) => {
    const stop = poll(async () => {
      const row = await getRow(code);
      if (!row?.offer) return false;
      onSignal({ type: 'offer', sdp: row.offer });

      // Drain any host ICE that arrived with offer
      for (const c of row.host_ice) {
        onSignal({ type: 'ice-candidate', candidate: c });
      }
      lastHostIceLen = row.host_ice.length;
      resolve();
      return true;
    }, 600, 30000);

    setTimeout(() => reject(new Error('Room not found or timed out. Check the code and try again.')), 31000);
  });

  // Poll for trickle host ICE after answer sent
  let icePollStop: (() => void) | null = null;

  const sendAnswer = async (sdp: RTCSessionDescriptionInit) => {
    await supabase!.from('signaling_rooms').update({ answer: sdp }).eq('code', code);

    // Start polling for host ICE
    icePollStop = poll(async () => {
      const row = await getRow(code);
      if (!row) return false;
      const newCandidates = (row.host_ice ?? []).slice(lastHostIceLen);
      for (const c of newCandidates) {
        onSignal({ type: 'ice-candidate', candidate: c });
      }
      lastHostIceLen = row.host_ice.length;
      return false;
    });
  };

  const sendGuestIce = async (candidate: RTCIceCandidateInit) => {
    const row = await getRow(code);
    if (!row) return;
    await supabase!.from('signaling_rooms').update({
      guest_ice: [...(row.guest_ice ?? []), candidate],
    }).eq('code', code);
  };

  return {
    sendAnswer,
    sendGuestIce,
    cleanup: () => icePollStop?.(),
  };
}
