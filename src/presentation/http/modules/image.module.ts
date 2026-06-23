import { Module } from '@nestjs/common';
import { ImageService } from '../../../application/services/image.service.js';
import { OracleService } from '../../../infrastructure/persistence/oracle/oracle.service.js';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service.js';
import { ImageController } from '../controllers/image.controller.js';

@Module({
  controllers: [ImageController],
  providers: [ImageService, PrismaService, OracleService]
})
export class ImageModule {}
