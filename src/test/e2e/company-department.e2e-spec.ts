import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2EApp } from './bootstrap.js';

describe('Company + Department (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects creating a company without required fields', async () => {
    await request(app.getHttpServer()).post('/api/companies').send({}).expect(400);
  });

  it('creates a company, then a department scoped to it, then lists both', async () => {
    const companyRes = await request(app.getHttpServer())
      .post('/api/companies')
      .send({ fantasyName: 'Acme', realName: 'Acme Inc' })
      .expect(201);

    expect(companyRes.body.id).toBeTruthy();
    const companyId = companyRes.body.id;

    const departmentRes = await request(app.getHttpServer())
      .post('/api/departments')
      .send({ name: 'Engenharia', companyId })
      .expect(201);

    expect(departmentRes.body.companyId).toBe(companyId);

    const companies = await request(app.getHttpServer()).get('/api/companies').expect(200);
    expect(companies.body).toContainEqual(expect.objectContaining({ id: companyId }));

    const departments = await request(app.getHttpServer()).get('/api/departments').expect(200);
    expect(departments.body).toContainEqual(expect.objectContaining({ id: departmentRes.body.id, companyId }));
  });

  it('updates and deletes a company', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/companies')
      .send({ fantasyName: 'ToUpdate', realName: 'ToUpdate Inc' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .patch(`/api/companies/${created.body.id}`)
      .send({ fantasyName: 'Updated' })
      .expect(200);
    expect(updated.body.fantasyName).toBe('Updated');

    await request(app.getHttpServer()).delete(`/api/companies/${created.body.id}`).expect(200).expect({ message: 'Company deleted' });
  });
});
