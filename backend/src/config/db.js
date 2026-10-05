import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import sqlite3 from 'sqlite3';
import { config } from './env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(here, '../database/schema.sql');
const remoteDatabase = Boolean(config.tursoDatabaseUrl);
const client = remoteDatabase ? createClient({
  url: config.tursoDatabaseUrl,
  authToken: config.tursoAuthToken
}) : null;
const configuredPath = path.resolve(process.cwd(), config.dbPath);
if (!remoteDatabase) fs.mkdirSync(path.dirname(configuredPath), { recursive: true });
const db = remoteDatabase ? null : new sqlite3.Database(configuredPath);

let operationQueue = Promise.resolve();

function enqueue(operation) {
  const current = operationQueue.then(operation, operation);
  operationQueue = current.catch(() => {});
  return current;
}

function runLocal(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getLocal(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
  });
}

function allLocal(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

async function runRemote(executor, sql, params = []) {
  const result = await executor.execute({ sql, args: params });
  return { lastID: Number(result.lastInsertRowid || 0), changes: Number(result.rowsAffected || 0) };
}

async function getRemote(executor, sql, params = []) {
  const result = await executor.execute({ sql, args: params });
  return result.rows[0] ? { ...result.rows[0] } : undefined;
}

async function allRemote(executor, sql, params = []) {
  const result = await executor.execute({ sql, args: params });
  return result.rows.map((row) => ({ ...row }));
}

export const run = (sql, params = []) => remoteDatabase
  ? runRemote(client, sql, params)
  : enqueue(() => runLocal(sql, params));
export const get = (sql, params = []) => remoteDatabase
  ? getRemote(client, sql, params)
  : enqueue(() => getLocal(sql, params));
export const all = (sql, params = []) => remoteDatabase
  ? allRemote(client, sql, params)
  : enqueue(() => allLocal(sql, params));

// SQLite transactions are connection-wide, so no other query may interleave before commit or rollback.
async function runTransaction(work) {
  const tx = await client.transaction('write');
  try {
    const result = await work({
      run: (sql, params = []) => runRemote(tx, sql, params),
      get: (sql, params = []) => getRemote(tx, sql, params),
      all: (sql, params = []) => allRemote(tx, sql, params)
    });
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

async function transactionLocal(work) {
  await runLocal('BEGIN IMMEDIATE');
  try {
    const result = await work({ run: runLocal, get: getLocal, all: allLocal });
    await runLocal('COMMIT');
    return result;
  } catch (error) {
    await runLocal('ROLLBACK');
    throw error;
  }
}

export const transaction = (work) => remoteDatabase
  ? runTransaction(work)
  : enqueue(() => transactionLocal(work));

function readColumnsLocal() {
  return new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(users)', (error, rows) => error ? reject(error) : resolve(rows));
  });
}

export async function initializeDatabase() {
  if (remoteDatabase) {
    const schema = fs.readFileSync(schemaPath, 'utf8')
      .split(';')
      .map((statement) => statement.trim())
      .filter((statement) => statement && !/^PRAGMA\b/i.test(statement))
      .join(';');
    await client.executeMultiple(schema);
    const columns = await allRemote(client, "SELECT name FROM pragma_table_info('users')");
    if (!columns.some((column) => column.name === 'role')) {
      try {
        await client.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))");
      } catch (error) {
        if (!/duplicate column/i.test(error.message)) throw error;
      }
    }
    return;
  }

  await new Promise((resolve, reject) => {
    db.run('PRAGMA foreign_keys = ON', (error) => error ? reject(error) : resolve());
  });
  await new Promise((resolve, reject) => {
    db.exec(fs.readFileSync(schemaPath, 'utf8'), (error) => error ? reject(error) : resolve());
  });

  const columns = await readColumnsLocal();
  if (!columns.some((column) => column.name === 'role')) {
    await new Promise((resolve, reject) => {
      db.run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))",
        (error) => error ? reject(error) : resolve());
    });
  }
}

export async function closeDatabase() {
  if (remoteDatabase) return client.close();
  return new Promise((resolve, reject) => db.close((error) => error ? reject(error) : resolve()));
}