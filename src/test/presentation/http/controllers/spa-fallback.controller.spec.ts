import { describe, expect, it, jest } from '@jest/globals';
import { SpaFallbackController } from '../../../../presentation/http/controllers/spa-fallback.controller.js';

describe('SpaFallbackController', () => {
  it('serves the built index.html for unmatched routes', () => {
    const res: any = { sendFile: jest.fn() };
    const ctrl = new SpaFallbackController();

    ctrl.serveIndex(res);

    expect(res.sendFile).toHaveBeenCalledWith(expect.stringContaining('index.html'));
  });
});
