import { describe, expect, it } from '@jest/globals';
import { ImageService } from '../application/services/image.service.js';

describe('ImageService', () => {
  it('is instantiable with lightweight stubs', () => {
    const service = new ImageService(
      { get: () => 'supabase' } as any,
      {} as any,
      {} as any
    );

    expect(service).toBeDefined();
  });
});
