// tests/jest.setup.ts
import { jest } from '@jest/globals';

// Mock sqlite3
jest.mock('sqlite3', () => {
  class Database {
    constructor(filename: string, callback?: (err: Error | null) => void) {
      if (callback) callback(null);
    }
    run() { return this; }
    get() { return this; }
    all() { return this; }
    exec() { return this; }
    close() { return this; }
  }

  return {
    default: {
      Database,
      OPEN_READWRITE: 1,
      OPEN_CREATE: 2,
    },
    Database,
  };
});

// Mock the database initialization - CORRECT PATH
jest.mock('../src/lib/db.js', () => ({
  initDB: async () => {
    const mockUsers = new Map();
    let lastID = 0;

    return {
      run: async (sql: string, params: any[]) => {
        console.log('Mock DB run called:', sql);
        if (sql.includes('INSERT INTO users')) {
          lastID++;
          const [email, password] = params;
          
          // Check if user already exists
          for (const user of mockUsers.values()) {
            if (user.email === email) {
              throw new Error('UNIQUE constraint failed');
            }
          }
          
          mockUsers.set(lastID, { id: lastID, email, password });
          console.log('User created:', { id: lastID, email });
          return { lastID };
        }
        return { lastID: 0 };
      },
      
      get: async (sql: string, params: any[]) => {
        console.log('Mock DB get called:', sql);
        if (sql.includes('SELECT * FROM users WHERE email')) {
          const [email] = params;
          for (const user of mockUsers.values()) {
            if (user.email === email) {
              console.log('User found:', user);
              return user;
            }
          }
          console.log('User not found');
          return undefined;
        }
        return undefined;
      },
      
      all: async () => Array.from(mockUsers.values()),
      
      close: async () => {
        mockUsers.clear();
      }
    };
  }
}));