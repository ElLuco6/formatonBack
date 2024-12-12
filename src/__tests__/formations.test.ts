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

describe('Formation Routes', () => {
  let formationId: number;

  test('POST /formations - should create a new formation', async () => {
    const response = await request(app)
      .post('/formations')
      .send({
        title: 'Test Formation',
        type: 'Test Type',
        duration: '2 jours',
        description: 'Test Description',
        price: 1000,
        registeredNames: ['Test User']
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Formation');
    formationId = response.body.id;
  });

  test('GET /formations - should return all formations', async () => {
    const response = await request(app).get('/formations');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  test('PATCH /formations/:id/registeredNames - should update registered names', async () => {
    const response = await request(app)
      .patch(`/formations/${formationId}/registeredNames`)
      .send({
        registeredNames: ['New User 1', 'New User 2']
      });

    expect(response.status).toBe(200);
    expect(response.body.registeredNames).toEqual(['New User 1', 'New User 2']);
  });
});
