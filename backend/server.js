import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Booking from "./models/Booking.js";
import adminAuth from "./middleware/adminAuth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// ES module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Middlewares ----------
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// ---------- Nodemailer transporter ----------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// In-memory OTP store: email -> { otp, expiresAt }
const adminOtps = new Map();

// Helper to generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---------- Public route: create booking ----------
app.post("/api/bookings", async (req, res) => {
  try {
    const { fullName, email, bookingDate, roomType } = req.body;

    if (!fullName || !email || !bookingDate || !roomType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const booking = await Booking.create({
      fullName,
      email,
      bookingDate,
      roomType,
    });

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- Admin: request OTP ----------
app.post("/api/admin/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ message: "Not allowed" });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    adminOtps.set(email, { otp, expiresAt });

    await transporter.sendMail({
      from: `"UrbanStay Admin Login" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your UrbanStay Admin Login OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      html: `<p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ---------- Admin: verify OTP & login ----------
app.post("/api/admin/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ message: "Not allowed" });
    }

    const data = adminOtps.get(email);
    if (!data) {
      return res.status(400).json({ message: "OTP not found. Request again." });
    }

    if (Date.now() > data.expiresAt) {
      adminOtps.delete(email);
      return res.status(400).json({ message: "OTP expired. Request again." });
    }

    if (data.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    adminOtps.delete(email);

    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "8h" });

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- Admin protected routes ----------
app.get("/api/admin/bookings", adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/admin/bookings/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Booking.findByIdAndDelete(id);
    res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- Start ----------
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
