import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { EmailMarketingService } from './email-marketing.service';

@Module({
  controllers: [IntegrationsController],
  providers: [EmailMarketingService],
})
export class IntegrationsModule {}
