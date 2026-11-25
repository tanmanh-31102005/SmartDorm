import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MqttModule } from '../mqtt/mqtt.module';
import { EventsModule } from '../gateway/events.module';
import { DevicesModule } from '../devices/devices.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LlmModule } from './llm/llm.module';

import { IntelligenceController, AutomationController } from './intelligence.controller';
import { IntelligenceService } from './intelligence.service';
import { MlClientService } from './ml-client/ml-client.service';
import { DecisionEngineService } from './decision-engine/decision-engine.service';
import { RuleEngineService } from './decision-engine/rule-engine.service';
import { RecommendationService } from './recommendation/recommendation.service';
import { AutomationService } from './automation/automation.service';

import { CopilotController } from './copilot/copilot.controller';
import { CopilotService } from './copilot/copilot.service';
import { CopilotToolsService } from './copilot/tools/copilot-tools.service';
import { CopilotContextService } from './copilot/context/copilot-context.service';

@Module({
  imports: [
    PrismaModule,
    MqttModule,
    EventsModule,
    LlmModule,
    forwardRef(() => DevicesModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [
    IntelligenceController,
    AutomationController,
    CopilotController,
  ],
  providers: [
    IntelligenceService,
    MlClientService,
    DecisionEngineService,
    RuleEngineService,
    RecommendationService,
    AutomationService,
    CopilotToolsService,
    CopilotContextService,
    CopilotService,
  ],
  exports: [
    IntelligenceService,
    MlClientService,
    DecisionEngineService,
    RuleEngineService,
    RecommendationService,
    AutomationService,
    CopilotToolsService,
    CopilotContextService,
    CopilotService,
    LlmModule,
  ],
})
export class IntelligenceModule {}
