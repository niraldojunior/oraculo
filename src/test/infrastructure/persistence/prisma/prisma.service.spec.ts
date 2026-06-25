import { describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service.js';

describe('PrismaService', () => {
  it('disconnects prisma client on module destroy', async () => {
    const service = new PrismaService();
    const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    disconnectSpy.mockRestore();
  });
});
