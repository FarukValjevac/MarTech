/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
        on: jest.fn(() => {}),
      },
      stderr: {
        on: jest.fn(() => {}),
      },
      on: jest.fn((event, handler) => {
        if (event === 'close') {
          process.nextTick(() => handler(0));
        }
      }),
    });
  });

  it('should call spawn with the correct Python command, script filename, and arguments', async () => {
    const mockDb = 1.23;
    const mockSold = 45;
    const expectedFilename = 'TopMatchesSkript.py';

    // Call the service method that spawns the Python script
    await service.runPythonScript(mockDb, mockSold);

    // Assert that 'spawn' was called exactly once
    expect(mockSpawn).toHaveBeenCalledTimes(1);

    // Get the arguments that mockSpawn was called with in its first (and only) call
    const [command, args] = mockSpawn.mock.calls[0];

    // 1. Assert the Python command
    expect(command).toBe('python3');

    // 2. Assert the script filename (extract basename from the actual path passed)
    const actualScriptPathArg = args[0];
    expect(path.basename(actualScriptPathArg)).toBe(expectedFilename); //

    // 3. Assert the remaining arguments (db and sold thresholds)
    expect(args[1]).toBe(mockDb.toString());
    expect(args[2]).toBe(mockSold.toString());
  });
});
