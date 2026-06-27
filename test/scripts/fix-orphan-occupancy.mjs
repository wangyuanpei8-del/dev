import pg from 'pg';

const client = new pg.Client({ connectionString: 'postgresql://dorm:dorm@localhost:5432/dormitory' });
await client.connect();

const { rowCount } = await client.query(`
  UPDATE occupancy_histories oh
  SET move_out_date = (CURRENT_DATE - INTERVAL '1 day')::date, updated_at = NOW()
  FROM rooms r
  WHERE oh.room_id = r.id
    AND oh.deleted_at IS NULL
    AND oh.move_in_date <= CURRENT_DATE
    AND (oh.move_out_date IS NULL OR oh.move_out_date >= CURRENT_DATE)
    AND (r.code <> 'R01' OR r.deleted_at IS NOT NULL)
`);

console.log(`已结束 ${rowCount} 条孤立在室履历`);
await client.end();
