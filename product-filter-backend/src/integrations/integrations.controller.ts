import { Controller, Post } from '@nestjs/common';
import { EmailMarketingService } from './email-marketing.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly emailMarketingService: EmailMarketingService) {}

  // Email Marketing Automation - Send emails for hot products (>1000 sales)
  @Post('email/marketing-automation')
  runEmailMarketing() {
    return this.emailMarketingService.automatedEmailMarketing();
  }
}
