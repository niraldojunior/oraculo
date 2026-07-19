import { describe, expect, it, jest } from '@jest/globals';
import { existsSync } from 'node:fs';
import { SpaFallbackController } from '../../../../presentation/http/controllers/spa-fallback.controller.js';

jest.mock('node:fs', () => ({
  existsSync: jest.fn()
}));

describe('SpaFallbackController', () => {
  it('serves the built index.html for unmatched routes when the file exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    const res: any = { sendFile: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    const ctrl = new SpaFallbackController();

    ctrl.serveIndex(res);

    expect(res.sendFile).toHaveBeenCalledWith(expect.stringContaining('index.html'));
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns a clean 404 when dist/index.html is not present (e.g. serverless bundle)', () => {
    (existsSync as jest.Mock).mockReturnValue(false);
    const res: any = { sendFile: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    const ctrl = new SpaFallbackController();

    ctrl.serveIndex(res);

    expect(res.sendFile).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ statusCode: 404, message: 'Not Found' });
  });
});
