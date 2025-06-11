/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { FilterService } from './filter.service';
import { spawn } from 'child_process';
import * as path from 'path';

// Mock the child_process module entirely to control 'spawn'
jest.mock('child_process', () => ({
  spawn: jest.fn(), // Mock the spawn function
}));

// Cast spawn to a Jest mock function for easier typing and access to its calls
const mockSpawn = spawn as jest.Mock;

describe('FilterService - Command & Args Test', () => {
  let service: FilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilterService],
    }).compile();

    service = module.get<FilterService>(FilterService);

    mockSpawn.mockReset();

    mockSpawn.mockReturnValue({
      stdout: {
        on: jest.fn(() => {
          /* Simulate no data */
        }),
      },
      stderr: {
        on: jest.fn(() => {
          /* Simulate no data */
        }),
      },
      on: jest.fn((event, handler) => {
        if (event === 'close') {
          process.nextTick(() => handler(0));
        }
      }),
    });
  });

  it('should call spawn with the correct Python command, script path, and arguments', async () => {
    const mockDb = 1.23;
    const mockSold = 45;

    const expectedScriptPath = path.join(
      __dirname,
      '../scripts/TopMatchesSkript.py',
    );

    // Call the service method that spawns the Python script
    await service.runPythonScript(mockDb, mockSold);

    // Assert that 'spawn' was called exactly once with the expected parameters
    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(mockSpawn).toHaveBeenCalledWith(
      'python3', // Expected Python executable
      [
        expectedScriptPath, // Expected full path to the Python script
        mockDb.toString(), // DB threshold converted to string
        mockSold.toString(), // Sold threshold converted to string
      ],
    );
  });
});
