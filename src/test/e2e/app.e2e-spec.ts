import { afterAll, beforeAll, describe, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2EApp } from './bootstrap.js';

describe('App bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('boots the full AppModule and responds on a known route', async () => {
    await request(app.getHttpServer()).get('/api/companies').expect(200).expect([]);
  });

  it('wires business-unit and client-team modules end-to-end', async () => {
    await request(app.getHttpServer()).get('/api/business-units').expect(200).expect([]);
    await request(app.getHttpServer()).get('/api/client-teams').expect(200).expect([]);
  });

  it('wires the api-prefixed login route', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'missing@corp.com', password: 'wrong' })
      .expect(401);
  });
});
