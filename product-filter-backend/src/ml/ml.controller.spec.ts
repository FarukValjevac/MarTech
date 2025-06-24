import { Test, TestingModule } from '@nestjs/testing';
import { MLController } from './ml.controller';
import { MLService } from './ml.service';

describe('MLController', () => {
  let controller: MLController;
  let service: MLService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MLController],
      providers: [MLService],
    }).compile();

    controller = module.get<MLController>(MLController);
    service = module.get<MLService>(MLService);
  });

  // Test controller instantiation
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test machine learning model creation endpoint
  it('should create ML model', async () => {
    const mockResult = 'Model created successfully';
    jest.spyOn(service, 'createModel').mockResolvedValue(mockResult);

    const result = await controller.createModel();
    expect(result.success).toBe(true);
    expect(result.message).toBe(mockResult);
  });

  // Test sales prediction based on product price
  it('should make predictions', async () => {
    const predictDto = { price: 2.5 };
    const mockResult = { price: 2.5, sales: 100, revenue: 250 };
    jest.spyOn(service, 'predict').mockResolvedValue(mockResult);

    const result = await controller.predict(predictDto);
    expect(result.success).toBe(true);
    expect(result.prediction).toEqual(mockResult);
  });
});
