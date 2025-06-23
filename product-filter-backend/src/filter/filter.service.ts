import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class FilterService {
  runPythonScript(db: number, sold: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const scriptPath = `${process.cwd()}/src/scripts/TopMatchesSkript.py`;

      const pythonProcess = spawn('python3', [
        scriptPath,
        db.toString(),
        sold.toString(),
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (err: Buffer) => {
        errorOutput += err.toString();
        console.error('Error from Python script:', err.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          console.error(
            `Python script exited with code ${code}. Output: ${output.trim()}. Error: ${errorOutput}`,
          );
          reject(
            new Error(
              `Script exited with code ${code}. Error: ${errorOutput || output.trim()}`,
            ),
          );
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python subprocess:', err);
        reject(new Error(`Failed to start Python subprocess: ${err.message}`));
      });
    });
  }
}
