import { Schema, model } from 'mongoose';

// Define a schema for Q&A
const QASchema = new Schema({
  productId: { type: String, required: true },
  question: { type: String, required: true },
  answers: [
    {
      answer: { type: String, required: true },
      userId: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const QA = model('QA', QASchema);

// Function to post a question
export const postQuestion = async (productId: string, question: string, userId: string) => {
  const newQuestion = new QA({ productId, question, userId });
  return newQuestion.save();
};

// Function to post an answer
export const postAnswer = async (qaId: string, answer: string, userId: string) => {
  return QA.findByIdAndUpdate(qaId, { $push: { answers: { answer, userId } } }, { new: true });
};

// Function to fetch Q&A for a product
export const getProductQA = async (productId: string) => {
  return QA.find({ productId });
};
