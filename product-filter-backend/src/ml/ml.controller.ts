import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MLService } from './ml.service';

@Controller('ml')
export class MLController {
  constructor(private readonly mlService: MLService) {}

  @Get('create-model')
  async createModel() {
    try {
      const result = await this.mlService.createModel();
      return {
        success: true,
        message: 'Model created successfully',
        output: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create model: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('predict')
  async predict(@Body() body: { price: number }) {
    if (!body.price || isNaN(body.price) || body.price <= 0) {
      throw new HttpException(
        'Invalid price. Please provide a positive number.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.mlService.predict(body.price);
      return {
        success: true,
        prediction: result,
      };
    } catch (error) {
      throw new HttpException(
        `Prediction failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
