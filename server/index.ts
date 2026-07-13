import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const PORT = Number(process.env.PORT ?? 3001);

type Room = {
  config: unknown;
  hostId: string;
  guestId: string | null;
};

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

// Prune rooms older than 2 hours
setInterval(() => {
  for (const [code, room] of rooms) {
    if (!room.hostId && !room.guestId) rooms.delete(code);
  }
}, 60 * 60 * 1000);

const app  = express();
const http = createServer(app);

app.use(cors());
app.get('/health', (_, res) => res.json({ ok: true, rooms: rooms.size }));

const io = new Server(http, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 20_000,
  pingInterval: 10_000,
});

io.on('connection', (socket) => {
  let myCode: string | null = null;

  // Host creates a room
  socket.on('create-room', ({ config }: { config: unknown }) => {
    const code = generateCode();
    rooms.set(code, { config, hostId: socket.id, guestId: null });
    myCode = code;
    socket.join(code);
    socket.emit('room-created', { code });
  });

  // Guest joins a room
  socket.on('join-room', ({ code }: { code: string }) => {
    const room = rooms.get(code.toUpperCase());
    if (!room) {
      socket.emit('room-error', { message: 'Room not found. Check the code and try again.' });
      return;
    }
    if (room.guestId) {
      socket.emit('room-error', { message: 'This room is already full.' });
      return;
    }
    room.guestId = socket.id;
    myCode = code.toUpperCase();
    socket.join(code.toUpperCase());
    // Send config to guest
    socket.emit('room-joined', { config: room.config });
    // Tell host guest has arrived
    socket.to(code.toUpperCase()).emit('guest-joined');
  });

  // Relay a game move to the other player
  socket.on('game-move', ({ code, move }: { code: string; move: unknown }) => {
    socket.to(code.toUpperCase()).emit('game-move', { move });
  });

  socket.on('disconnect', () => {
    if (!myCode) return;
    socket.to(myCode).emit('opponent-left');
    const room = rooms.get(myCode);
    if (room) {
      if (room.hostId === socket.id) {
        // Host left — delete room
        rooms.delete(myCode);
      } else {
        // Guest left — reset slot so someone else can join
        room.guestId = null;
      }
    }
  });
});

http.listen(PORT, () => {
  console.log(`Tic-tac-toe signaling server running on port ${PORT}`);
});
