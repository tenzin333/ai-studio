// tests/auth.test.ts
import { jest } from '@jest/globals';

// Create mock database
const mockUsers = new Map();
let lastID = 0;

const mockDB = {
  run: jest.fn(async (sql: string, params: any[]) => {
    if (sql.includes('INSERT INTO users')) {
      lastID++;
      const [email, password] = params;
      
      for (const user of mockUsers.values()) {
        if (user.email === email) {
          throw new Error('UNIQUE constraint failed');
        }
      }
      
      mockUsers.set(lastID, { id: lastID, email, password });
      return { lastID };
    }
    return { lastID: 0 };
  }),
  
  get: jest.fn(async (sql: string, params: any[]) => {
    if (sql.includes('SELECT * FROM users WHERE email')) {
      const [email] = params;
      for (const user of mockUsers.values()) {
        if (user.email === email) {
          return user;
        }
      }
      return undefined;
    }
    return undefined;
  }),
  
  all: jest.fn(async () => Array.from(mockUsers.values())),
  close: jest.fn(async () => { mockUsers.clear(); }),
};

// Mock the db module BEFORE importing app
jest.unstable_mockModule('../src/lib/db.js', () => ({
  initDB: jest.fn(async () => mockDB),
  getDB: jest.fn(() => mockDB),
  closeDB: jest.fn(async () => {})
}));

// Import app AFTER mocking
const { default: app } = await import('../src/app.js');
const request = (await import('supertest')).default;

describe('Auth API', () => {
  beforeEach(() => {
    mockUsers.clear();
    lastID = 0;
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message', 'User created successfully');
    });

    it('should reject signup with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test3@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email and password required');
    });

    it('should reject duplicate email registration', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'Test123!@#',
        });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });
  });
});