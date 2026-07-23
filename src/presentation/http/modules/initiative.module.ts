import { Module } from '@nestjs/common';
import { InitiativeService } from '../../../application/services/initiative.service.js';
import { InitiativeCommentService } from '../../../application/services/initiative-comment.service.js';
import { InitiativeController } from '../controllers/initiative.controller.js';
import { InitiativeClientTeamPersistenceModule } from './initiative-client-team-persistence.module.js';

@Module({
  imports: [InitiativeClientTeamPersistenceModule],
  controllers: [InitiativeController],
  providers: [InitiativeService, InitiativeCommentService]
})
export class InitiativeModule {}
