import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2EApp } from './bootstrap.js';

describe('Initiative (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects creating an initiative with an invalid status', async () => {
    await request(app.getHttpServer())
      .post('/api/initiatives')
      .send({ title: 'Bad', status: 'Not-A-Status', priority: 0 })
      .expect(400);
  });

  it('creates from the CreateInitiativeModal payload without losing fields', async () => {
    // Payload literal de `handleCreateSave` (web/src/modules/initiatives/pages/InitiativesPage.tsx):
    // status numerado, sem `priority`, com `clientTeamId: null` e campos extras
    // que o whitelist descarta. Antes esse corpo voltava 400.
    const created = await request(app.getHttpServer())
      .post('/api/initiatives')
      .send({
        title: 'Nova pelo modal',
        type: '2- Projeto',
        status: '1- Backlog',
        benefit: 'Objetivo da iniciativa',
        leaderId: 'col-1',
        memberIds: ['col-2'],
        impactedSystemIds: ['sys-1'],
        companyId: 'c1',
        departmentId: 'd1',
        createdById: 'u1',
        startDate: '2026-08-01',
        endDate: '2026-09-01',
        createdAt: new Date().toISOString(),
        scope: '',
        customerOwner: '',
        clientTeamId: null,
        originDirectorate: '',
        milestones: [],
        history: []
      })
      .expect(201);

    expect(created.body).toMatchObject({
      title: 'Nova pelo modal',
      type: '2- Projeto',
      status: '1- Backlog',
      benefit: 'Objetivo da iniciativa',
      leaderId: 'col-1',
      memberIds: ['col-2'],
      impactedSystemIds: ['sys-1'],
      createdById: 'u1',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
      clientTeamId: null,
      priority: 0
    });

    await request(app.getHttpServer()).delete(`/api/initiatives/${created.body.id}`).expect(200);
  });

  it('creates, lists, fetches, updates, reprioritizes and deletes an initiative', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/initiatives')
      .send({ title: 'Nova iniciativa', status: 'Backlog', priority: 1, companyId: 'c1', departmentId: 'd1' })
      .expect(201);
    expect(created.body.id).toBeTruthy();
    const id = created.body.id;

    const list = await request(app.getHttpServer()).get('/api/initiatives?companyId=c1').expect(200);
    expect(list.body).toContainEqual(expect.objectContaining({ id }));

    const fetched = await request(app.getHttpServer()).get(`/api/initiatives/${id}`).expect(200);
    expect(fetched.body.title).toBe('Nova iniciativa');

    const history = await request(app.getHttpServer()).get(`/api/initiatives/${id}/history`).expect(200);
    expect(history.body).toEqual([]);

    const updated = await request(app.getHttpServer())
      .patch(`/api/initiatives/${id}`)
      .send({ title: 'Atualizada' })
      .expect(200);
    expect(updated.body.title).toBe('Atualizada');

    const reprioritized = await request(app.getHttpServer())
      .patch(`/api/initiatives/${id}/priority`)
      .send({ priority: 9 })
      .expect(200);
    expect(reprioritized.body.priority).toBe(9);

    await request(app.getHttpServer()).delete(`/api/initiatives/${id}`).expect(200).expect({ message: 'Initiative deleted' });
    await request(app.getHttpServer()).get(`/api/initiatives/${id}`).expect(404);
  });

  it('returns 404 when reprioritizing a missing initiative', async () => {
    await request(app.getHttpServer())
      .patch('/api/initiatives/does-not-exist/priority')
      .send({ priority: 1 })
      .expect(404);
  });
});
