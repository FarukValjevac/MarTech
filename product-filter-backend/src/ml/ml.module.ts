import { Module } from '@nestjs/common';
import { MLController } from './ml.controller';
import { MLService } from './ml.service';

@Module({
  controllers: [MLController],
  providers: [MLService],
})
export class MLModule {}
