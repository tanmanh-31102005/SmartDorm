import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MlClientService } from '../ml-client/ml-client.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import { RuleEngineService } from '../decision-engine/rule-engine.service';
import { CopilotToolsService } from './tools/copilot-tools.service';
import { CopilotContextService } from './context/copilot-context.service';
import { CopilotService } from './copilot.service';
import { CopilotController } from './copilot.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CopilotController],
  providers: [
    MlClientService,
    RecommendationService,
    RuleEngineService,
    CopilotToolsService,
    CopilotContextService,
    CopilotService,
  ],
  exports: [
    CopilotToolsService,
    CopilotContextService,
    CopilotService,
  ],
})
export class CopilotModule {}
