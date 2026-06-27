import pg from 'pg';

const client = new pg.Client({ connectionString: 'postgresql://dorm:dorm@localhost:5432/dormitory' });
await client.connect();

await client.query(`
  UPDATE occupancy_histories
  SET move_out_date = '2026-06-19'::date, updated_at = NOW()
  WHERE id = '07ab24ef-4cb2-4f2c-98b7-9b3cbfe9ed1d'
`);

const { rows } = await client.query(`
  SELECT e.full_name, oh.move_out_date::date AS move_out
  FROM occupancy_histories oh
  JOIN employees e ON e.id = oh.employee_id
  WHERE oh.deleted_at IS NULL AND oh.move_out_date IS NULL
`);
console.log('Open occupancies:', rows.length);
console.table(rows);
await client.end();
