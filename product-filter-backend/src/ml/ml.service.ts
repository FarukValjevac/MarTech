import { Injectable } from '@nestjs/common';
import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';

export interface PredictionOutput {
  price: number;
  sales: number;
  revenue: number;
}

@Injectable()
export class MLService {
  private readonly scriptsPath = path.join(process.cwd(), 'src', 'scripts');

  createModel(): Promise<string> {
    return new Promise((resolve, reject) => {
      const options: SpawnOptions = {
        cwd: this.scriptsPath,
      };
      const scriptName = 'CreateSalesPredictionsModel.py';
      const process = spawn('python3', [scriptName], options);

      let output = '';
      let errorOutput = '';

      if (process.stdout) {
        process.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
      }

      if (process.stderr) {
        process.stderr.on('data', (err: Buffer) => {
          errorOutput += err.toString();
          console.error('Model creation error:', err.toString());
        });
      }

      process.on('close', (code) => {
        if (code === 0) {
          const successMessage = 'Model training complete!';

          if (output.includes(successMessage)) {
            resolve(successMessage);
          } else {
            resolve(
              'Model created successfully, but final message was not found.',
            );
          }
        } else {
          reject(
            new Error(
              `Model creation failed with code ${code}. Error: ${errorOutput}`,
            ),
          );
        }
      });

      process.on('error', (err) => {
        reject(
          new Error(`Failed to start model creation process: ${err.message}`),
        );
      });
    });
  }

  predict(price: number): Promise<PredictionOutput | { rawOutput: string }> {
    return new Promise((resolve, reject) => {
      const options: SpawnOptions = {
        cwd: this.scriptsPath,
      };
      const scriptName = 'ReadModel.py';
      const process = spawn('python3', [scriptName, price.toString()], options);

      let output = '';
      let errorOutput = '';

      if (process.stdout) {
        process.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
      }

      if (process.stderr) {
        process.stderr.on('data', (err: Buffer) => {
          errorOutput += err.toString();
          console.error('Prediction error:', err.toString());
        });
      }

      process.on('close', (code) => {
        const missingModelMessage =
          'Please run the training script first to create the model.';

        if (code === 0) {
          try {
            const lines = output.trim().split('\n');
            let prediction: PredictionOutput | null = null;

            for (const line of lines) {
              if (line.includes('->') && line.includes('units')) {
                const match = line.match(
                  /€\s*([\d.]+)\s*->\s*([\d.]+)\s*units.*Revenue:\s*\$\s*([\d.]+)/,
                );
                if (match) {
                  prediction = {
                    price: parseFloat(match[1]),
                    sales: Math.round(parseFloat(match[2])),
                    revenue: parseFloat(match[3]),
                  };
                  break;
                }
              }
            }

            if (prediction) {
              resolve(prediction);
            } else {
              resolve({ rawOutput: output.trim() });
            }
          } catch (parseError) {
            console.error('Error parsing prediction output:', parseError);
            resolve({ rawOutput: output.trim() });
          }
        } else {
          if (
            errorOutput.includes(missingModelMessage) ||
            output.includes(missingModelMessage)
          ) {
            reject(
              new Error('Model not found. Please generate the model first.'),
            );
          } else {
            reject(
              new Error(
                `Prediction failed with code ${code}. Error: ${errorOutput || output}`,
              ),
            );
          }
        }
      });

      process.on('error', (err) => {
        reject(new Error(`Failed to start prediction process: ${err.message}`));
      });
    });
  }
}
