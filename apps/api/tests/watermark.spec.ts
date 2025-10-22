import request from 'supertest';
import app from '../../src/index';
import fs from 'fs';
import path from 'path';

describe('Classified Image Upload', () => {
  it('rejects upload with too many images', async () => {
    const images = Array(5).fill({ buffer: Buffer.alloc(10), watermarkText: 'Test' });
    const res = await request(app)
      .post('/api/classifieds')
      .send({ title: 'Test', vendor: '123', images });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/plan allows up to/);
  });

  it('rejects upload with missing watermark', async () => {
    const imgPath = path.join(__dirname, 'fixtures', 'plain.jpg');
    if (!fs.existsSync(imgPath)) return;
    const buffer = fs.readFileSync(imgPath);
    const res = await request(app)
      .post('/api/classifieds')
      .send({ title: 'Test', vendor: '123', images: [{ buffer, watermarkText: 'Test' }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing the required watermark/);
  });
});
