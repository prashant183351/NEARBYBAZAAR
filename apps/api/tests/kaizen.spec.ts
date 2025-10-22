import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';
import { Kaizen } from '../src/models/Kaizen';
import { Experiment } from '../src/models/Experiment';
import { Decision } from '../src/models/Decision';

describe('Kaizen API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL || '', { dbName: 'test' });
    await Kaizen.deleteMany({});
    await Experiment.deleteMany({});
    await Decision.deleteMany({});
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should create a Kaizen idea', async () => {
    const res = await request(app)
      .post('/kaizen')
      .send({ title: 'Test Idea', description: 'A test idea', tags: ['test'], owners: ['user1'] })
      .expect(201);
    expect(res.body.kaizen.title).toBe('Test Idea');
  });

  it('should not allow invalid Kaizen idea', async () => {
    await request(app).post('/kaizen').send({ title: '' }).expect(400);
  });

  it('should create and link an experiment', async () => {
    const idea = await Kaizen.create({ title: 'Idea for Experiment', owners: ['user2'] });
    const exp = await Experiment.create({
      title: 'Experiment',
      ideas: [idea._id],
      status: 'Draft',
    });
    expect(exp.ideas[0].toString()).toBe(idea._id.toString());
  });

  it('should create a decision and link to idea', async () => {
    const idea = await Kaizen.create({ title: 'Idea for Decision', owners: ['user3'] });
    const dec = await Decision.create({
      title: 'Decision',
      idea: idea._id,
      madeBy: 'user3',
      madeAt: new Date(),
    });
    expect(dec.idea.toString()).toBe(idea._id.toString());
  });
});
