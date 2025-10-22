// tests/__mocks__/sqlite3.ts
export class Database {
  constructor(filename: string, callback?: (err: Error | null) => void) {
    if (callback) callback(null);
  }

  run(sql: string, params?: any, callback?: (err: Error | null) => void) {
    if (callback) callback(null);
    return this;
  }

  get(sql: string, params?: any, callback?: (err: Error | null, row?: any) => void) {
    if (callback) callback(null, {});
    return this;
  }

  all(sql: string, params?: any, callback?: (err: Error | null, rows?: any[]) => void) {
    if (callback) callback(null, []);
    return this;
  }

  exec(sql: string, callback?: (err: Error | null) => void) {
    if (callback) callback(null);
    return this;
  }

  close(callback?: (err: Error | null) => void) {
    if (callback) callback(null);
    return this;
  }
}

export default {
  Database,
  OPEN_READWRITE: 1,
  OPEN_CREATE: 2,
  verbose: () => ({ Database }),
};
