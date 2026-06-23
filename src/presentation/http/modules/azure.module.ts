import { Module } from '@nestjs/common';
import { AzureController } from '../controllers/azure.controller.js';

@Module({
  controllers: [AzureController]
})
export class AzureModule {}
