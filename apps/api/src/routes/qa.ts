import express from 'express';
import { postQuestion, postAnswer, getProductQA } from '../services/qa';

const router = express.Router();

// Endpoint to post a question
router.post('/qa/question', async (req, res) => {
  const { productId, question, userId } = req.body;

  try {
    const result = await postQuestion(productId, question, userId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error posting question:', error);
    res.status(500).json({ error: 'Failed to post question' });
  }
});

// Endpoint to post an answer
router.post('/qa/answer', async (req, res) => {
  const { qaId, answer, userId } = req.body;

  try {
    const result = await postAnswer(qaId, answer, userId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error posting answer:', error);
    res.status(500).json({ error: 'Failed to post answer' });
  }
});

// Endpoint to fetch Q&A for a product
router.get('/qa/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await getProductQA(productId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching Q&A:', error);
    res.status(500).json({ error: 'Failed to fetch Q&A' });
  }
});

export default router;
