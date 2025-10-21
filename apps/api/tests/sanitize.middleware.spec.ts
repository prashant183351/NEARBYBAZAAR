import express from 'express';
import request from 'supertest';
import { sanitize } from '../src/middleware/sanitize';

const app = express();
app.use(express.json());

app.post('/echo', sanitize({ body: { message: 'plain' } }), (req, res) => {
  res.json({ message: req.body.message });
});

app.post('/rich', sanitize({ body: { content: 'richText' } }), (req, res) => {
  res.json({ content: req.body.content });
});

describe('sanitize middleware', () => {
  it('strips scripts from plain text fields', async () => {
    const payload = { message: '<script>alert(1)</script>Hello <b>World</b>' };
    const res = await request(app).post('/echo').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hello World');
  });

  it('allows limited tags for richText', async () => {
    const payload = { content: '<p>Hello <b>World</b> <img src=x onerror=alert(1)></p>' };
    const res = await request(app).post('/rich').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('<p>Hello <b>World</b> </p>');
  });
});
