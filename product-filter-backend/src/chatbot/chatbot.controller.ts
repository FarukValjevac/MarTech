// import { Controller, Post, Body } from '@nestjs/common';
// import { ChatbotService } from './chatbot.service';

// @Controller('api/chatbot')
// export class ChatbotController {
//   constructor(private readonly chatbotService: ChatbotService) {}

//   @Post('chat')
//   async chat(@Body() body: { message: string }): Promise<{ response: string }> {
//     const response = await this.chatbotService.sendMessage(body.message);
//     return { response };
//   }
// }
