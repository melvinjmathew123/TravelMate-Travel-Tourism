import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import generateToken from "../utils/generateToken.js";
import { sendWelcomeEmail, sendOtpEmail } from "../utils/mailer.js";

// Step 1: Send registration OTP
export async function sendRegistrationOtp(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered. Please login instead." });
  }

  // Generate 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store OTP (upsert replaces any existing pending OTP for this email)
  await Otp.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      otp: otpCode,
      name: name.trim(),
      password: hashedPassword,
      createdAt: new Date()
    },
    { upsert: true, new: true }
  );

  // Send OTP Email
  sendOtpEmail(normalizedEmail, otpCode, name.trim()).catch(err =>
    console.error("OTP send error:", err)
  );

  res.json({
    message: `Verification code sent to ${normalizedEmail}`,
    email: normalizedEmail,
    devOtp: process.env.NODE_ENV !== "production" ? otpCode : undefined
  });
}

// Step 2: Verify registration OTP & complete signup
export async function verifyRegistrationOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const record = await Otp.findOne({ email: normalizedEmail });

  if (!record) {
    return res.status(400).json({
      message: "Verification code has expired or was not requested. Please request a new code."
    });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({
      message: "Invalid verification code. Please check and try again."
    });
  }

  // Double check if account was registered concurrently
  if (await User.findOne({ email: normalizedEmail })) {
    await Otp.deleteOne({ _id: record._id });
    return res.status(409).json({ message: "Account already created. Please login." });
  }

  // Create verified user
  const user = await User.create({
    name: record.name,
    email: record.email,
    password: record.password
  });

  // Delete consumed OTP
  await Otp.deleteOne({ _id: record._id });

  // Send welcome email
  sendWelcomeEmail(user).catch(err => console.error("Welcome email error:", err));

  res.status(201).json({
    token: generateToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
}

// Direct registration fallback
export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
  if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  // Trigger welcome email asynchronously
  sendWelcomeEmail(user).catch(err => console.error("Welcome email error:", err));

  res.status(201).json({
    token: generateToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "Invalid email or password" });

  res.json({
    token: generateToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
}

export async function me(req, res) {
  res.json(req.user);
}

export async function getUsers(req, res) {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
}
