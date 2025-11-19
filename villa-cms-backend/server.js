// Debug: make sure we see 6543 and sslmode=require in the printed URL
console.log("DATABASE_URL at boot:", process.env.DATABASE_URL);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const prisma = new PrismaClient();

dotenv.config();

// ===== CORS, JSON, Cookies =====
const allowedOrigins = ["http://elysian-villa.vercel.app"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);   // <- express 5 safe
  }

  next();
});

app.use(express.json());
app.use(cookieParser());

// ===== JWT helpers =====
const COOKIE_NAME = "token";
const isProd = process.env.NODE_ENV === "production";

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,         // set true on HTTPS
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

function verifyTokenFromCookie(req) {
  const tok = req.cookies?.[COOKIE_NAME];
  if (!tok) return null;
  try {
    return jwt.verify(tok, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function authRequired(req, res, next) {
  const payload = verifyTokenFromCookie(req);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  req.user = payload;
  next();
}

// ===== AUTH =====
app.post("/api/login", async (req, res) => {
  console.log("[/api/login] hit");

  const { username, password } = req.body || {};
  console.log("[/api/login] body:", { username, password });

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    console.log("[/api/login] user from DB:", user);

    if (!user) {
      console.log("[/api/login] no user with that username");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // plain-text password check, matches your seed data
    if (user.password !== password) {
      console.log("[/api/login] password mismatch");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    setAuthCookie(res, token);
    console.log("[/api/login] success, sending token cookie");

    return res.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error("[/api/login] ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


app.get("/api/auth/me", async (req, res) => {
  const payload = verifyTokenFromCookie(req);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, role: true },
  });
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user });
});

app.post("/api/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

/* -------- DASHBOARD SUMMARY -------- */
app.get("/api/dashboard", async (req, res) => {
  try {
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({
      where: { status: "checked_in" },
    });
    const today = new Date();
    const reservationsToday = await prisma.reservation.findMany({
      where: {
        checkIn: { lte: today },
        checkOut: { gte: today },
      },
      include: { room: true },
    });
    res.json({ totalRooms, occupiedRooms, reservationsToday });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------- VILLAS -------- */
app.get("/api/villas", async (req, res) => {
  try {
    const villas = await prisma.villa.findMany({ include: { rooms: true } });
    res.json(villas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/villas", async (req, res) => {
  try {
    const villa = await prisma.villa.create({ data: req.body });
    res.json(villa);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------- ROOMS -------- */
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({ include: { villa: true } });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/rooms", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.villaId != null) {
      data.villaId = Number(data.villaId);
    }
    const room = await prisma.room.create({ data });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update room
app.put("/api/rooms/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.room.update({
      where: { id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update room" });
  }
});

// Delete room
app.delete("/api/rooms/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.room.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

/* -------- RESERVATIONS -------- */
app.get("/api/reservations", async (req, res) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        room: {
          include: { villa: true },
        },
      },
    });
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/reservations", async (req, res) => {
  try {
    const {
      roomId,
      guestName,
      nationality,
      passportNumber,
      numGuests,
      source,
      phone,
      email,
      checkIn,
      checkOut,
      status = "reserved",
      notes,
      paymentMethod,
    } = req.body;

    // basic validation
    if (!roomId || !guestName || !checkIn || !checkOut) {
      return res.status(422).json({ error: "roomId, guestName, checkIn, checkOut are required" });
    }

    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    if (!(ci instanceof Date) || Number.isNaN(ci.getTime()) || !(co instanceof Date) || Number.isNaN(co.getTime())) {
      return res.status(422).json({ error: "Invalid checkIn or checkOut datetime" });
    }
    if (ci >= co) {
      return res.status(422).json({ error: "checkIn must be before checkOut" });
    }

    // check overlap on the same room
    // overlap logic: NOT (newEnd <= existingStart OR newStart >= existingEnd)
    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId: Number(roomId),
        NOT: {
          OR: [
            { checkOut: { lte: ci } }, // existing ends before new starts
            { checkIn:  { gte: co } }, // existing starts after new ends
          ],
        },
      },
      select: { id: true, guestName: true, checkIn: true, checkOut: true, status: true },
    });

    if (conflict) {
      return res.status(409).json({
        error: "Room is not available for the selected dates",
        conflict,
      });
    }

    // create reservation
    const reservation = await prisma.reservation.create({
      data: {
        roomId: Number(roomId),
        guestName,
        nationality,
        passportNumber,
        numGuests,
        source,
        phone,
        email,
        checkIn: ci,
        checkOut: co,
        status,
        notes,
        paymentMethod,
      },
      include: { room: true },
    });

    // mark room reserved if the new booking is in the future window, leave as is if already checked in elsewhere
    await prisma.room.update({
      where: { id: Number(roomId) },
      data: { status: reservation.status === "checked_in" ? "checked_in" : "reserved" },
    });

    res.json(reservation);
  } catch (err) {
    // if DB exclusion constraint still fires, translate it
    if (String(err.message || "").includes("reservation_no_overlap")) {
      return res.status(409).json({ error: "Room is not available for the selected dates" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------- CHECK IN / CHECK OUT -------- */
app.put("/api/reservations/:id/checkin", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: "checked_in" },
    });
    await prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: "checked_in" },
    });
    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/reservations/:id/checkout", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: "checked_out" },
      include: { room: true },
    });

    // room stays "checked_out" so housekeeping can see it
    await prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: "checked_out" },
    });

    // write history entry
    await prisma.reservationHistory.create({
      data: {
        reservationId: reservation.id,
        roomId: reservation.roomId,
        guestName: reservation.guestName,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        statusAtCheckout: "checked_out",
      },
    });

    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/rooms/:id/clean", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await prisma.room.update({
      where: { id },
      data: { status: "available" },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as cleaned" });
  }
});

// -------- HOUSEKEEPING SUMMARY --------
app.get("/api/housekeeping", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: "checked_out" },
      include: {
        villa: true,
        histories: {
          orderBy: { checkOut: "desc" },
          take: 1,
        },
      },
    });

    const payload = rooms.map((r) => {
      const last = r.histories[0] || null;
      return {
        roomId: r.id,
        roomName: r.name,
        villaName: r.villa?.name || "",
        status: r.status,
        lastGuest: last?.guestName || null,
        lastCheckOut: last?.checkOut || null,
      };
    });

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/reservations?start=2025-11-01&end=2025-11-30
app.get("/api/reservations", async (req, res) => {
  try {
    const { start, end } = req.query;

    const where = {};
    if (start && end) {
      // overlap filter: [checkIn, checkOut] intersects [start, end]
      where.OR = [
        { checkIn: { lte: new Date(end) }, checkOut: { gte: new Date(start) } },
      ];
    }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { checkIn: "asc" },
      include: { room: { include: { villa: true } } },
    });

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin Roles //
function adminRequired(req, res, next) {
  const payload = verifyTokenFromCookie(req);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  req.user = payload;
  next();
}

/* -------- USER ACCOUNTS (ADMIN ONLY) -------- */
app.get('/api/users', adminRequired, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error('[GET /api/users] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', adminRequired, async (req, res) => {
  try {
    const { username, password, role = 'owner' } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // for now plain text (same as your login check)
    const user = await prisma.user.create({
      data: { username, password, role },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('[POST /api/users] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id', adminRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, password, role } = req.body || {};

    const data = {};
    if (username != null) data.username = username;
    if (password != null && password !== '') data.password = password;
    if (role != null) data.role = role;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    });

    res.json(user);
  } catch (err) {
    console.error('[PUT /api/users/:id] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/users/:id', adminRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('[DELETE /api/users/:id] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});


/* -------- SERVER START -------- */
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));