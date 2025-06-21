/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { FilterController } from './filter.controller';
import { FilterService } from './filter.service';

describe('FilterController', () => {
  let controller: FilterController;
  let service: FilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilterController],
      providers: [FilterService],
    }).compile();

    controller = module.get<FilterController>(FilterController);
    service = module.get<FilterService>(FilterService);
  });

  // Test controller instantiation
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test product filtering with database and sold thresholds
  it('should run filter', async () => {
    const filterDto = { db: 7.0, sold: 50 };
    const mockResult = 'product,db,sold\ntest,7.5,100';

    jest.spyOn(service, 'runPythonScript').mockResolvedValue(mockResult);

    const result = await controller.runFilter(filterDto);
    expect(result).toBe(mockResult);
  });
});
