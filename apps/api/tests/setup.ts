import { beforeAll, vi } from 'vitest';

// 1. Set environment variables BEFORE any modules are imported
process.env.DEV_LOGIN_ENABLED = "true";
process.env.JWT_SECRET = "test-secret";
process.env.DATA_DIR = "./tests/data";

// 2. Mock lib/db.ts to use in-memory storage instead of Bun.file / filesystem
// Note: Variables used in vi.mock must start with 'mock'
const mockMemoryDb: Record<string, any> = {
  "users.json": [],
  "tasks.json": [],
  "subjects.json": [],
  "practice_journals.json": [],
  "absences.json": [],
  "class_notes.json": [],
};

vi.mock('../src/lib/db', () => ({
  readJson: vi.fn(async (filename: string) => {
    // We access mockMemoryDb from the closure
    // @ts-ignore - Vitest hoists this but mock-prefix allows access
    return mockMemoryDb[filename] || [];
  }),
  writeJson: vi.fn(async (filename: string, data: any) => {
    // @ts-ignore
    mockMemoryDb[filename] = data;
  }),
}));

beforeAll(() => {
  // Clear memory DB before tests
  mockMemoryDb["users.json"] = [];
});
