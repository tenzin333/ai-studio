// tests/__mocks__/db.ts
export const initDB = async () => {
  const mockUsers = new Map();
  let lastID = 0;

  return {
    run: async (sql: string, params: any[]) => {
      if (sql.includes('INSERT INTO users')) {
        lastID++;
        const [email, password] = params;
        
        // Check if user already exists
        for (const [id, user] of mockUsers.entries()) {
          if (user.email === email) {
            throw new Error('UNIQUE constraint failed: users.email');
          }
        }
        
        mockUsers.set(lastID, { id: lastID, email, password });
        return { lastID };
      }
      return { lastID: 0 };
    },
    
    get: async (sql: string, params: any[]) => {
      if (sql.includes('SELECT * FROM users WHERE email')) {
        const [email] = params;
        for (const [id, user] of mockUsers.entries()) {
          if (user.email === email) {
            return user;
          }
        }
        return undefined;
      }
      return undefined;
    },
    
    all: async (sql: string, params?: any[]) => {
      return Array.from(mockUsers.values());
    },
    
    close: async () => {
      mockUsers.clear();
    }
  };
};