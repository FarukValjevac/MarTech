import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilterController } from './filter/filter.controller';
import { FilterService } from './filter/filter.service';

@Module({
  imports: [],
  controllers: [AppController, FilterController],
  providers: [AppService, FilterService],
})
export class AppModule {}
