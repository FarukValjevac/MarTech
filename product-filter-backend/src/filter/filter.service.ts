import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class FilterService {
  runPythonScript(db: number, sold: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath =
        '/Users/VAF1WI/Documents/Workspace/Tutorials/XxxlDigital/product-filter-backend/src/skripts/TopMatchesSkript.py';

      const process = spawn('python3', [
        scriptPath,
        db.toString(),
        sold.toString(),
      ]);

      let output = '';
      process.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
      process.stderr.on('data', (err: Buffer) => {
        console.error('Error from Python script:', err.toString());
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          console.error(
            `Python script exited with code ${code}. Output: ${output.trim()}`,
          );
          reject(
            new Error(
              `Script exited with code ${code}. Output: ${output.trim()}`,
            ),
          );
        }
      });

      process.on('error', (err) => {
        console.error('Failed to start Python subprocess:', err);
        reject(new Error(`Failed to start Python subprocess: ${err.message}`));
      });
    });
  }
}
