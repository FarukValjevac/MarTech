import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

describe('ChatbotController', () => {
  let controller: ChatbotController;
  let service: ChatbotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [ChatbotService],
    }).compile();

    controller = module.get<ChatbotController>(ChatbotController);
    service = module.get<ChatbotService>(ChatbotService);
  });

  // Test controller instantiation
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test chatbot message handling with Ollama LLM
  it('should send chat message', async () => {
    const chatDto = { message: 'Hello' };
    const mockResponse = 'Hello! How can I help you?';
    jest.spyOn(service, 'sendMessage').mockResolvedValue(mockResponse);

    const result = await controller.chat(chatDto);
    expect(result).toEqual({ response: mockResponse });
  });
});
