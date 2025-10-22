import mongoose, { Schema, Document } from 'mongoose';

interface ITransaction {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  description: string;
  timestamp: Date;
}

export interface IWallet extends Document {
  userId: string;
  balance: number;
  transactions: ITransaction[];
  createdAt: Date;
  updatedAt: Date;
  deposit(amount: number, description: string): Promise<IWallet>;
}

const TransactionSchema: Schema = new Schema({
  type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL', 'REFUND', 'ADJUSTMENT'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const WalletSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  transactions: [TransactionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

WalletSchema.methods.deposit = async function (amount: number, description: string) {
  if (amount <= 0) {
    throw new Error('Deposit amount must be greater than zero.');
  }

  this.balance += amount;
  this.transactions.push({
    type: 'DEPOSIT',
    amount,
    description,
    timestamp: new Date(),
  });

  await this.save();
  return this;
};

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);
