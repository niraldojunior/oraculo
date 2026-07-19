import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2EApp } from './bootstrap.js';

describe('BusinessUnit + ClientTeam (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects creating a business unit without required fields', async () => {
    await request(app.getHttpServer()).post('/api/business-units').send({}).expect(400);
  });

  it('creates a business unit, associates a client team, then updates and deletes both', async () => {
    const bu = await request(app.getHttpServer())
      .post('/api/business-units')
      .send({ name: 'Atacado & B2B', companyId: 'c1', departmentId: 'd1' })
      .expect(201);
    expect(bu.body.id).toBeTruthy();

    const ct = await request(app.getHttpServer())
      .post('/api/client-teams')
      .send({ name: 'Operações', companyId: 'c1', departmentId: 'd1', businessUnitId: bu.body.id })
      .expect(201);
    expect(ct.body.businessUnitId).toBe(bu.body.id);

    const listBU = await request(app.getHttpServer()).get('/api/business-units?companyId=c1').expect(200);
    expect(listBU.body).toContainEqual(expect.objectContaining({ id: bu.body.id }));

    const listCT = await request(app.getHttpServer()).get('/api/client-teams?companyId=c1').expect(200);
    expect(listCT.body).toContainEqual(expect.objectContaining({ id: ct.body.id, businessUnitId: bu.body.id }));

    const updatedCT = await request(app.getHttpServer())
      .patch(`/api/client-teams/${ct.body.id}`)
      .send({ businessUnitId: null })
      .expect(200);
    expect(updatedCT.body.businessUnitId).toBeNull();

    await request(app.getHttpServer()).delete(`/api/client-teams/${ct.body.id}`).expect(200).expect({ success: true });
    await request(app.getHttpServer()).delete(`/api/business-units/${bu.body.id}`).expect(200).expect({ success: true });

    const listBUAfter = await request(app.getHttpServer()).get('/api/business-units?companyId=c1').expect(200);
    expect(listBUAfter.body).not.toContainEqual(expect.objectContaining({ id: bu.body.id }));
  });

  it('scopes listing by companyId and departmentId independently', async () => {
    await request(app.getHttpServer()).post('/api/business-units').send({ name: 'A', companyId: 'scope-c1', departmentId: 'scope-d1' }).expect(201);
    await request(app.getHttpServer()).post('/api/business-units').send({ name: 'B', companyId: 'scope-c2', departmentId: 'scope-d1' }).expect(201);

    const byCompany = await request(app.getHttpServer()).get('/api/business-units?companyId=scope-c1').expect(200);
    expect(byCompany.body).toHaveLength(1);

    const byDept = await request(app.getHttpServer()).get('/api/business-units?departmentId=scope-d1').expect(200);
    expect(byDept.body).toHaveLength(2);
  });

  it('links initiatives by clientTeamId, reflects renames and blocks deleting an area in use', async () => {
    const ct = await request(app.getHttpServer())
      .post('/api/client-teams')
      .send({ name: 'Operação - FTTH', companyId: 'scope-link', departmentId: 'dept-link' })
      .expect(201);

    const initiative = await request(app.getHttpServer())
      .post('/api/initiatives')
      .send({
        title: 'Iniciativa vinculada', status: 'Backlog', priority: 1,
        companyId: 'scope-link', departmentId: 'dept-link', clientTeamId: ct.body.id
      })
      .expect(201);
    expect(initiative.body).toEqual(expect.objectContaining({
      clientTeamId: ct.body.id,
      originDirectorate: 'Operação - FTTH'
    }));

    await request(app.getHttpServer())
      .patch(`/api/client-teams/${ct.body.id}`)
      .send({ name: 'Operações e Engenharia' })
      .expect(200);

    const afterRename = await request(app.getHttpServer())
      .get(`/api/initiatives/${initiative.body.id}`)
      .expect(200);
    expect(afterRename.body).toEqual(expect.objectContaining({
      clientTeamId: ct.body.id,
      originDirectorate: 'Operações e Engenharia'
    }));

    await request(app.getHttpServer()).delete(`/api/client-teams/${ct.body.id}`).expect(409);

    await request(app.getHttpServer())
      .patch(`/api/initiatives/${initiative.body.id}`)
      .send({ clientTeamId: null })
      .expect(200);
    await request(app.getHttpServer()).delete(`/api/client-teams/${ct.body.id}`).expect(200);
  });
});
