import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2EApp } from './bootstrap.js';

describe('Organization: teams + collaborators (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects creating a team without required fields', async () => {
    await request(app.getHttpServer()).post('/teams').send({}).expect(400);
  });

  it('creates a team, lists it by scope, updates and deletes it', async () => {
    const team = await request(app.getHttpServer())
      .post('/teams')
      .send({ name: 'Core Team', type: 'SQUAD', companyId: 'c1', departmentId: 'd1' })
      .expect(201);
    expect(team.body.id).toBeTruthy();

    const list = await request(app.getHttpServer()).get('/teams?companyId=c1').expect(200);
    expect(list.body).toContainEqual(expect.objectContaining({ id: team.body.id }));

    const updated = await request(app.getHttpServer())
      .patch(`/teams/${team.body.id}`)
      .send({ name: 'Core Team Renamed' })
      .expect(200);
    expect(updated.body.name).toBe('Core Team Renamed');

    await request(app.getHttpServer()).delete(`/teams/${team.body.id}`).expect(200).expect({ message: 'Team deleted' });
  });

  it('creates a collaborator, normalizes VP role to Head, finds by email and deletes', async () => {
    const collaborator = await request(app.getHttpServer())
      .post('/collaborators')
      .send({ companyId: 'c1', departmentId: 'd1', name: 'Ana', email: 'ana@corp.com', role: 'VP' })
      .expect(201);
    expect(collaborator.body.role).toBe('Head');

    const byEmail = await request(app.getHttpServer()).get('/collaborators/email/ana@corp.com').expect(200);
    expect(byEmail.body.id).toBe(collaborator.body.id);

    const list = await request(app.getHttpServer()).get('/collaborators?companyId=c1').expect(200);
    expect(list.body).toContainEqual(expect.objectContaining({ id: collaborator.body.id }));

    await request(app.getHttpServer()).delete(`/collaborators/${collaborator.body.id}`).expect(200).expect({ message: 'Collaborator deleted' });
  });

  it('toggles a collaborator skill relationship', async () => {
    await request(app.getHttpServer())
      .post('/collaborators/skills/toggle')
      .send({ collaboratorId: 'u1', skillId: 's1', active: true })
      .expect(201)
      .expect({ success: true });
  });
});
