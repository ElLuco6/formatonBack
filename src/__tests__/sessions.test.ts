import request from 'supertest';
import { app } from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Nettoyer la base de données avant les tests
  await prisma.session.deleteMany(); // Supprimer d'abord les sessions
  await prisma.formation.deleteMany(); // Puis les formations
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Session Routes', () => {
  let sessionId: number;
  let formationId: number;

  beforeAll(async () => {
    // Créer une formation pour les tests
    const formation = await prisma.formation.create({
      data: {
        title: 'Test Formation',
        type: 'Test',
        price: 1000
      }
    });
    formationId = formation.id;
  });

  test('POST /sessions - should create a new session', async () => {
    const response = await request(app)
      .post('/sessions')
      .send({
        type: 'Présentiel',
        date: new Date().toISOString(),
        formationId: formationId,
        nbEleves: 10
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    sessionId = response.body.id;
  });

  test('GET /sessions - should return all sessions', async () => {
    const response = await request(app).get('/sessions');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('GET /sessions/:id - should return a specific session', async () => {
    const response = await request(app).get(`/sessions/${sessionId}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(sessionId);
  });
});
