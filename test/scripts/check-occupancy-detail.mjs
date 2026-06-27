import pg from 'pg';

const client = new pg.Client({ connectionString: 'postgresql://dorm:dorm@localhost:5432/dormitory' });
await client.connect();
const { rows } = await client.query(`
  SELECT e.full_name,
         e.deleted_at IS NOT NULL AS emp_deleted,
         r.name AS room_name,
         r.code AS room_code,
         d.name AS dorm_name,
         oh.move_in_date::date AS move_in,
         oh.move_out_date::date AS move_out,
         oh.id AS history_id
  FROM occupancy_histories oh
  JOIN employees e ON e.id = oh.employee_id
  JOIN rooms r ON r.id = oh.room_id
  JOIN dorms d ON d.id = r.dorm_id
  WHERE oh.deleted_at IS NULL
    AND oh.move_in_date <= CURRENT_DATE
    AND (oh.move_out_date IS NULL OR oh.move_out_date >= CURRENT_DATE)
  ORDER BY e.full_name
`);
console.log('Active occupancies:', rows.length);
console.table(rows);
await client.end();
