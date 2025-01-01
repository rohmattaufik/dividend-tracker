import mongoose from 'mongoose';
import type { Dividend } from '$lib/types';

const DividendSchema = new mongoose.Schema({
  id: Number,
  userId: String,
  date: String,
  stock: String,
  amount: Number
}, {
  timestamps: true
});

export default mongoose.models.Dividend || mongoose.model<Dividend>('Dividend', DividendSchema); 