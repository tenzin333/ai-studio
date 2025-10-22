import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { createUsersTable } from "../Modules/user.js";
import { createGenerationsTable } from "../Modules/generate.js";

let dbInstance: Database | null = null;

export const initDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  await dbInstance.exec(createUsersTable);
  await dbInstance.exec(createGenerationsTable);

  return dbInstance;
};

export const getDB = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return dbInstance;
};

export const closeDB = async () => {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
};