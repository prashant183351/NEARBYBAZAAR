import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { validate } from '@middleware/validate';

const app = express();
app.use(express.json()); // Ensure JSON body parsing middleware is applied

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

app.use((req, _res, next) => {
  console.log('Request body:', req.body); // Debugging log
  next();
});

// Add debugging middleware to inspect request body and headers
app.use((req, _res, next) => {
  console.log('Request headers:', req.headers);
  console.log('Raw request body:', req.body);
  next();
});

// Add a middleware to confirm express.json() is applied
app.use((req, _res, next) => {
  console.log('Middleware check: express.json() applied');
  console.log('Parsed body after express.json():', req.body);
  next();
});

app.post('/test', validate(schema), (req, res) => {
  res.json({ ok: true, body: req.body });
});

describe('validate middleware', () => {
  it('returns 400 and issues on invalid body', async () => {
    const res = await request(app).post('/test').send({ name: '', age: 'not-a-number' });
    console.log('Invalid test response:', res.body); // Debugging log
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'name' }),
        expect.objectContaining({ path: 'age' }),
      ])
    );
  });

  it('passes through on valid body and coerces types', async () => {
    // Explicitly set Content-Type header to application/json
    // Add debugging log to inspect the request body in the test
    console.log('Test request body:', { name: 'Alice', age: 30 });

    const res = await request(app)
      .post('/test')
      .set('Content-Type', 'application/json')
      .send({ name: 'Alice', age: 30 });

    console.log('Valid test response:', res.body); // Debugging log
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.body).toEqual({ name: 'Alice', age: 30 });
  });
});
