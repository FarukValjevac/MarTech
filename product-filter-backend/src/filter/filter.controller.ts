import { Controller, Post, Body } from '@nestjs/common';
import { FilterService } from './filter.service';

@Controller('filter')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Post()
  runFilter(@Body() body: { db: number; sold: number }) {
    return this.filterService.runPythonScript(body.db, body.sold);
  }
}
