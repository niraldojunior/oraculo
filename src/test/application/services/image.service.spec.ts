import { describe, expect, it, jest } from '@jest/globals';
import { ImageService } from '../../../application/services/image.service.js';

function createRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.end = jest.fn(() => res);
  res.redirect = jest.fn(() => res);
  res.setHeader = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

describe('ImageService', () => {
  it('serves collaborator image as binary when data url is returned by prisma', async () => {
    const service = new ImageService(
      { get: () => 'supabase' } as any,
      {
        collaborator: {
          findUnique: jest.fn(async () => ({
            photoUrl: 'data:image/png;base64,AA==',
            name: 'Alice'
          }))
        }
      } as any,
      {} as any
    );

    const req: any = { headers: {} };
    const res = createRes();

    await service.serveCollaboratorImage(req, res, 'c1');

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600, must-revalidate');
    expect(res.send).toHaveBeenCalled();
  });

  it('returns 304 when etag matches if-none-match', async () => {
    const dataUrl = 'data:image/png;base64,AA==';
    const service = new ImageService(
      { get: () => 'supabase' } as any,
      {
        collaborator: {
          findUnique: jest.fn(async () => ({ photoUrl: dataUrl, name: 'Alice' }))
        }
      } as any,
      {} as any
    );

    const firstReq: any = { headers: {} };
    const firstRes = createRes();
    await service.serveCollaboratorImage(firstReq, firstRes, 'c1');
    const etag = firstRes.setHeader.mock.calls.find((c: any[]) => c[0] === 'ETag')[1];

    const req: any = { headers: { 'if-none-match': etag } };
    const res = createRes();
    await service.serveCollaboratorImage(req, res, 'c1');

    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.end).toHaveBeenCalled();
  });

  it('redirects when image value is plain url', async () => {
    const service = new ImageService(
      { get: () => 'supabase' } as any,
      {
        company: { findUnique: jest.fn(async () => ({ logo: 'https://cdn/logo.png' })) }
      } as any,
      {} as any
    );

    const req: any = { headers: {} };
    const res = createRes();

    await service.serveCompanyImage(req, res, 'comp1');
    expect(res.redirect).toHaveBeenCalledWith(302, 'https://cdn/logo.png');
  });

  it('returns 404 when entity has no image value', async () => {
    const service = new ImageService(
      { get: () => 'supabase' } as any,
      {
        vendor: { findUnique: jest.fn(async () => ({ logoUrl: null })) }
      } as any,
      {} as any
    );

    const req: any = { headers: {} };
    const res = createRes();

    await service.serveVendorImage(req, res, 'v1');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 415 for invalid data url format', async () => {
    const service = new ImageService(
      { get: () => 'supabase' } as any,
      {
        skill: { findUnique: jest.fn(async () => ({ icon: 'data:image/png,not-base64' })) }
      } as any,
      {} as any
    );

    const req: any = { headers: {} };
    const res = createRes();

    await service.serveSkillImage(req, res, 's1');
    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns fallback svg for collaborator in oracle when photo is empty', async () => {
    const service = new ImageService(
      { get: () => 'oracle' } as any,
      {} as any,
      {
        query: jest.fn(async () => [{ photoUrl: null, name: 'Bob' }])
      } as any
    );

    const req: any = { headers: {} };
    const res = createRes();

    await service.serveCollaboratorImage(req, res, 'o1');

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
    expect(res.send).toHaveBeenCalled();
  });

  it('uses oracle query for company/vendor/skill images', async () => {
    const oracle = {
      query: jest
        .fn(async (): Promise<any[]> => [{ logo: 'https://cdn/company.png' }])
        .mockImplementationOnce(async (): Promise<any[]> => [{ logo: 'https://cdn/company.png' }])
        .mockImplementationOnce(async (): Promise<any[]> => [{ logoUrl: 'https://cdn/vendor.png' }])
        .mockImplementationOnce(async (): Promise<any[]> => [{ icon: 'https://cdn/skill.png' }])
    };

    const service = new ImageService(
      { get: () => 'oracle' } as any,
      {} as any,
      oracle as any
    );

    const req: any = { headers: {} };
    const res1 = createRes();
    const res2 = createRes();
    const res3 = createRes();

    await service.serveCompanyImage(req, res1, 'co');
    await service.serveVendorImage(req, res2, 've');
    await service.serveSkillImage(req, res3, 'sk');

    expect(oracle.query).toHaveBeenCalledTimes(3);
    expect(res1.redirect).toHaveBeenCalledWith(302, 'https://cdn/company.png');
    expect(res2.redirect).toHaveBeenCalledWith(302, 'https://cdn/vendor.png');
    expect(res3.redirect).toHaveBeenCalledWith(302, 'https://cdn/skill.png');
  });

  it('returns 500 when fetcher throws', async () => {
    const service = new ImageService(
      { get: () => 'supabase' } as any,
      {
        company: {
          findUnique: jest.fn(async () => {
            throw new Error('db down');
          })
        }
      } as any,
      {} as any
    );

    const req: any = { headers: {} };
    const res = createRes();

    await service.serveCompanyImage(req, res, 'x');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.end).toHaveBeenCalled();
  });
});

