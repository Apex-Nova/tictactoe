/**
 * LocalSignaling — WebRTC SDP exchange via local API route polling.
 * Works only when both devices are on the same Wi-Fi and the phone
 * accesses the game via the computer's local IP (e.g. http://192.168.1.5:3000).
 * No internet required.
 */

type Room = {
  offer: RTCSessionDescriptionInit | null;
  answer: RTCSessionDescriptionInit | null;
  hostIce: RTCIceCandidateInit[];
  guestIce: RTCIceCandidateInit[];
};

async function getRoom(base: string, code: string): Promise<Room> {
  const res = await fetch(`${base}/api/lan-signal/${code}`);
  return res.json();
}

async function patchRoom(base: string, code: string, body: object) {
  await fetch(`${base}/api/lan-signal/${code}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function poll(fn: () => Promise<boolean>, interval = 600, timeout = 60000): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  const stop = setTimeout(() => { stopped = true; }, timeout);

  const tick = async () => {
    if (stopped) return;
    const done = await fn().catch(() => false);
    if (!done && !stopped) timer = setTimeout(tick, interval);
  };
  timer = setTimeout(tick, 0);

  return () => {
    stopped = true;
    clearTimeout(timer);
    clearTimeout(stop);
  };
}

/** base = origin of the local server, e.g. http://192.168.1.5:3000 */
export async function localHostRoom(
  base: string,
  code: string,
  offer: RTCSessionDescriptionInit,
  onSignal: (msg: { type: 'answer'; sdp: RTCSessionDescriptionInit } | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }) => void,
): Promise<() => void> {
  // Write offer
  await patchRoom(base, code, { offer, answer: null, hostIce: [], guestIce: [] });

  let answerReceived = false;
  let lastGuestIce = 0;
  let icePoll: (() => void) | null = null;

  const stopMain = poll(async () => {
    const room = await getRoom(base, code);
    if (!answerReceived && room.answer) {
      answerReceived = true;
      onSignal({ type: 'answer', sdp: room.answer });
      for (const c of room.guestIce) onSignal({ type: 'ice-candidate', candidate: c });
      lastGuestIce = room.guestIce.length;
      return true;
    }
    return false;
  });

  // After answer, keep draining guest ICE
  const waitForAnswer = new Promise<void>(resolve => {
    const iv = setInterval(() => { if (answerReceived) { clearInterval(iv); resolve(); } }, 200);
  });
  waitForAnswer.then(() => {
    icePoll = poll(async () => {
      const room = await getRoom(base, code);
      const newIce = room.guestIce.slice(lastGuestIce);
      for (const c of newIce) onSignal({ type: 'ice-candidate', candidate: c });
      lastGuestIce = room.guestIce.length;
      return false;
    });
  });

  return () => { stopMain(); icePoll?.(); };
}

export async function localSendHostIce(base: string, code: string, candidate: RTCIceCandidateInit) {
  await patchRoom(base, code, { appendHostIce: candidate });
}

export async function localGuestJoinRoom(
  base: string,
  code: string,
  onSignal: (msg: { type: 'offer'; sdp: RTCSessionDescriptionInit } | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }) => void,
): Promise<{ sendAnswer: (sdp: RTCSessionDescriptionInit) => Promise<void>; sendGuestIce: (c: RTCIceCandidateInit) => Promise<void>; cleanup: () => void }> {
  // Wait for offer
  await new Promise<void>((resolve, reject) => {
    let lastHostIce = 0;
    const stop = poll(async () => {
      const room = await getRoom(base, code);
      if (!room.offer) return false;
      onSignal({ type: 'offer', sdp: room.offer });
      for (const c of room.hostIce) onSignal({ type: 'ice-candidate', candidate: c });
      lastHostIce = room.hostIce.length;
      resolve();
      return true;
    }, 600, 30000);
    setTimeout(() => reject(new Error('Room not found. Make sure you\'re on the same Wi-Fi and the code is correct.')), 31000);
    void stop;
  });

  let lastHostIce = 0;
  let icePoll: (() => void) | null = null;

  const sendAnswer = async (sdp: RTCSessionDescriptionInit) => {
    await patchRoom(base, code, { answer: sdp });
    icePoll = poll(async () => {
      const room = await getRoom(base, code);
      const newIce = (room.hostIce ?? []).slice(lastHostIce);
      for (const c of newIce) onSignal({ type: 'ice-candidate', candidate: c });
      lastHostIce = room.hostIce.length;
      return false;
    });
  };

  const sendGuestIce = async (candidate: RTCIceCandidateInit) => {
    await patchRoom(base, code, { appendGuestIce: candidate });
  };

  return { sendAnswer, sendGuestIce, cleanup: () => icePoll?.() };
}
