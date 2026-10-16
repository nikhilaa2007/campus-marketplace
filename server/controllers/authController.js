import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { sendEmail } from '../utils/sendEmail.js';
import { signToken } from '../utils/token.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  branch: z.string().min(1, 'Enter your branch'),
  year: z.coerce.number().int().min(1).max(6),
  college: z.string().min(2, 'Enter your college'),
});

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  branch: u.branch,
  year: u.year,
  college: u.college,
  isVerified: u.isVerified,
});

async function createAndSendOtp(email) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await Otp.deleteMany({ email });
  await Otp.create({ email, codeHash: await bcrypt.hash(code, 8) });
  await sendEmail({
    to: email,
    subject: 'Your Campus Marketplace verification code',
    text: `Your code is ${code}. It expires in 10 minutes.`,
  });
}

// POST /api/auth/register
export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { name, email, password, branch, year, college } = parsed.data;
  const lowerEmail = email.toLowerCase();

  const domain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (domain && !lowerEmail.endsWith(`@${domain}`)) {
    return res.status(400).json({ message: `Use your college email (@${domain})` });
  }

  const existing = await User.findOne({ email: lowerEmail });
  if (existing?.isVerified) {
    return res.status(409).json({ message: 'This email is already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  if (existing) {
    // Registered earlier but never verified: update details and resend the code
    Object.assign(existing, { name, passwordHash, branch, year, college });
    await existing.save();
  } else {
    await User.create({ name, email: lowerEmail, passwordHash, branch, year, college });
  }

  await createAndSendOtp(lowerEmail);
  res.status(201).json({ message: 'Verification code sent to your email', email: lowerEmail });
}

// POST /api/auth/verify-otp
export async function verifyOtp(req, res) {
  const email = String(req.body.email || '').toLowerCase();
  const code = String(req.body.code || '');

  const otp = await Otp.findOne({ email });
  if (!otp) return res.status(400).json({ message: 'Code expired. Please request a new one' });

  if (otp.attempts >= 5) {
    await otp.deleteOne();
    return res.status(429).json({ message: 'Too many wrong attempts. Request a new code' });
  }

  const ok = await bcrypt.compare(code, otp.codeHash);
  if (!ok) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ message: 'Wrong code' });
  }

  const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
  await otp.deleteOne();
  res.json({ token: signToken(user._id), user: publicUser(user) });
}

// POST /api/auth/resend-otp
export async function resendOtp(req, res) {
  const email = String(req.body.email || '').toLowerCase();
  const user = await User.findOne({ email });
  if (!user || user.isVerified) {
    return res.status(400).json({ message: 'Nothing to verify for this email' });
  }
  await createAndSendOtp(email);
  res.json({ message: 'New code sent' });
}

// POST /api/auth/login
export async function login(req, res) {
  const email = String(req.body.email || '').toLowerCase();
  const user = await User.findOne({ email });
  const valid = user && (await bcrypt.compare(String(req.body.password || ''), user.passwordHash));
  if (!valid) return res.status(401).json({ message: 'Wrong email or password' });

  if (!user.isVerified) {
    return res.status(403).json({ message: 'Please verify your email first', needsVerification: true, email });
  }
  res.json({ token: signToken(user._id), user: publicUser(user) });
}

// GET /api/auth/me
export const me = (req, res) => res.json({ user: publicUser(req.user) });
