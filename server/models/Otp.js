import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  // MongoDB deletes the document automatically 10 minutes after creation
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

export default mongoose.model('Otp', otpSchema);
