/**
 * In-memory LAN signaling — only works on the local dev server.
 * Phone and computer must be on the same Wi-Fi.
 * State is lost on server restart, which is fine for a single game session.
 */

import { NextRequest, NextResponse } from 'next/server';

type Room = {
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  hostIce: RTCIceCandidateInit[];
  guestIce: RTCIceCandidateInit[];
  updatedAt: number;
};

// Module-level Map — persists across requests in the same Node.js process
const rooms = new Map<string, Room>();

// Clean up rooms older than 10 minutes
function pruneOld() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [k, v] of rooms) {
    if (v.updatedAt < cutoff) rooms.delete(k);
  }
}

function getRoom(code: string): Room {
  return rooms.get(code) ?? { offer: null, answer: null, hostIce: [], guestIce: [], updatedAt: Date.now() };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = getRoom(code.toUpperCase());
  return NextResponse.json(room);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  pruneOld();
  const { code } = await params;
  const key = code.toUpperCase();
  const body = await req.json() as Partial<Room> & {
    appendHostIce?: RTCIceCandidateInit;
    appendGuestIce?: RTCIceCandidateInit;
  };

  const room = getRoom(key);

  if (body.offer !== undefined) room.offer = body.offer;
  if (body.answer !== undefined) room.answer = body.answer;
  if (body.appendHostIce) room.hostIce = [...room.hostIce, body.appendHostIce];
  if (body.appendGuestIce) room.guestIce = [...room.guestIce, body.appendGuestIce];
  room.updatedAt = Date.now();

  rooms.set(key, room);
  return NextResponse.json({ ok: true });
}
