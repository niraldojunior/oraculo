import { Module } from '@nestjs/common';
import { SpaFallbackController } from '../controllers/spa-fallback.controller.js';

@Module({
  controllers: [SpaFallbackController]
})
export class SpaFallbackModule {}
