import knex from 'knex';
import { COCKROACH_DB_URL } from '$env/static/private';

if (!COCKROACH_DB_URL) {
  throw new Error('Please define the COCKROACH_DB_URL environment variable');
}

export const db = knex({
  client: 'pg',
  connection: {
    connectionString: COCKROACH_DB_URL,
    ssl: {
      rejectUnauthorized: false // For development. In production, you should properly configure SSL
    }
  },
  pool: {
    min: 2,
    max: 10
  }
});

// Create dividends table if it doesn't exist
export async function initializeDatabase() {
  const exists = await db.schema.hasTable('dividends');
  if (!exists) {
    await db.schema.createTable('dividends', (table) => {
      table.bigInteger('id').primary();
      table.string('userId').notNullable();
      table.date('date').notNullable();
      table.string('stock').notNullable();
      table.decimal('amount', 12, 2).notNullable();
      table.timestamps(true, true);
    });
  }
} 