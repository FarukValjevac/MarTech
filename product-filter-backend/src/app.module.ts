import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilterController } from './filter/filter.controller';
import { FilterService } from './filter/filter.service';
import { MLModule } from './ml/ml.module';
import { ChatbotModule } from './chatbot/chatbot.module';
// import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [MLModule, ChatbotModule],
  controllers: [AppController, FilterController],
  providers: [AppService, FilterService],
})
export class AppModule {}
