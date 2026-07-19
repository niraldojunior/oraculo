import { Module } from '@nestjs/common';
import { ClientTeamController } from '../controllers/client-team.controller.js';
import { ClientTeamService } from '../../../application/services/client-team.service.js';
import { InitiativeClientTeamPersistenceModule } from './initiative-client-team-persistence.module.js';

@Module({
  imports: [InitiativeClientTeamPersistenceModule],
  controllers: [ClientTeamController],
  providers: [ClientTeamService]
})
export class ClientTeamModule {}
