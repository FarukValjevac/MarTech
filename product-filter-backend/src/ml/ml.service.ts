import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class MLService {
  private readonly scriptsPath = path.join(process.cwd(), 'src', 'scripts');

  createModel(): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        this.scriptsPath,
        'CreateSalesPredictionModel.py',
      );
      const process = spawn('python3', [scriptPath]);

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString();
        console.log('Model creation output:', data.toString());
      });

      process.stderr.on('data', (err: Buffer) => {
        errorOutput += err.toString();
        console.error('Model creation error:', err.toString());
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
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

  predict(price: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.scriptsPath, 'ReadModel.py');
      const process = spawn('python3', [scriptPath, price.toString()]);

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      process.stderr.on('data', (err: Buffer) => {
        errorOutput += err.toString();
        console.error('Prediction error:', err.toString());
      });

      process.on('close', (code) => {
        if (code === 0) {
          // Parse the output to extract the prediction
          try {
            const lines = output.trim().split('\n');
            let prediction = null;

            // Look for the prediction line in the output
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
              // If we can't parse the output, return the raw output
              resolve({ rawOutput: output.trim() });
            }
          } catch (parseError) {
            console.error('Error parsing prediction output:', parseError);
            resolve({ rawOutput: output.trim() });
          }
        } else {
          reject(
            new Error(
              `Prediction failed with code ${code}. Error: ${errorOutput}`,
            ),
          );
        }
      });

      process.on('error', (err) => {
        reject(new Error(`Failed to start prediction process: ${err.message}`));
      });
    });
  }
}
