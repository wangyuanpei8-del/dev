import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import * as path from 'path';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { buildBadImportBuffer, buildSampleImportBuffer } from './fixtures/import-sample';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    execSync('npx tsx prisma/seed.ts', {
      cwd: path.join(__dirname, '..'),
      env: process.env,
      stdio: 'pipe',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /auth/login 正确密码返回 token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'Admin123!!' })
        .expect(201);

      expect(res.body.code).toBe(0);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@example.com');
    });

    it('POST /auth/login 错误密码返回 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'wrong-password' })
        .expect(401);

      expect(res.body.code).toBe(40100);
    });
  });

  describe('Occupancy', () => {
    it('POST 入居重叠被拒绝 (40901)', async () => {
      const employees = await request(app.getHttpServer())
        .get('/api/v1/employees?page=1&pageSize=50')
        .expect(200);
      const tanaka = employees.body.data.items.find(
        (e: { employeeCode?: string }) => e.employeeCode === 'E003',
      );
      expect(tanaka).toBeDefined();

      const rooms = await request(app.getHttpServer())
        .get('/api/v1/dorms')
        .expect(200);
      const dorm = rooms.body.data.items.find((d: { code: string }) => d.code === 'TOYOSU-1');
      const roomsRes = await request(app.getHttpServer())
        .get(`/api/v1/dorms/${dorm.id}/rooms`)
        .expect(200);
      const room = roomsRes.body.data.items.find((r: { code: string }) => r.code === 'R01');
      expect(room).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/api/v1/occupancy-histories')
        .send({
          employeeId: tanaka.id,
          roomId: room.id,
          moveInDate: '2026-04-15',
        })
        .expect(409);

      expect(res.body.code).toBe(40901);
    });

    it('POST 性别不符被拒绝 (40902)', async () => {
      const employees = await request(app.getHttpServer())
        .get('/api/v1/employees?page=1&pageSize=50')
        .expect(200);
      const sato = employees.body.data.items.find(
        (e: { employeeCode?: string }) => e.employeeCode === 'E002',
      );

      const dorms = await request(app.getHttpServer()).get('/api/v1/dorms').expect(200);
      const dorm = dorms.body.data.items.find((d: { code: string }) => d.code === 'TOYOSU-1');
      const roomsRes = await request(app.getHttpServer())
        .get(`/api/v1/dorms/${dorm.id}/rooms`)
        .expect(200);
      const room = roomsRes.body.data.items.find((r: { code: string }) => r.code === 'R01');

      const res = await request(app.getHttpServer())
        .post('/api/v1/occupancy-histories')
        .send({
          employeeId: sato.id,
          roomId: room.id,
          moveInDate: '2027-01-01',
        })
        .expect(409);

      expect(res.body.code).toBe(40902);
    });
  });

  describe('Dorm fees', () => {
    it('POST /dorm-fees/calculate 生成月次草稿', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/dorm-fees/calculate')
        .send({ yearMonth: '2026-04' })
        .expect(201);

      expect(res.body.code).toBe(0);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      const yamadaFee = res.body.data.items.find(
        (f: { employeeName: string }) => f.employeeName === '山田 太郎',
      );
      expect(yamadaFee).toBeDefined();
      expect(yamadaFee.amountYen).toBeGreaterThan(0);
      expect(yamadaFee.status).toBe('DRAFT');
    });
  });

  describe('Health', () => {
    it('GET /health 返回 ok', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('Export (CSV 导出)', () => {
    it('GET /exports/occupancy-histories 返回 UTF-8 CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/exports/occupancy-histories')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text.startsWith('\uFEFF')).toBe(true);
      expect(res.text).toContain('寮名');
      expect(res.text).toContain('入寮日');
      expect(res.text).toContain('豊洲');
    });

    it('GET /exports/dorm-fees 返回 CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/exports/dorm-fees?yearMonth=2026-04')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('氏名');
      expect(res.text).toContain('年月');
    });

    it('GET /exports/dorm-allocation-calendar 返回月历 CSV', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/exports/dorm-allocation-calendar?yearMonth=2026-04')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('1日');
      expect(res.text).toContain('30日');
    });
  });

  describe('Import (Excel 导入)', () => {
    const mapping = {
      employeeCode: '社員番号',
      fullName: '氏名',
      dormCode: '寮コード',
      roomCode: '部屋コード',
    };

    it('Excel 上传→映射→预览→执行 成功', async () => {
      const upload = await request(app.getHttpServer())
        .post('/api/v1/import/upload')
        .attach('file', buildSampleImportBuffer(), {
          filename: 'sample-import.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .expect(201);

      expect(upload.body.code).toBe(0);
      const jobId = upload.body.data.jobId;
      expect(jobId).toBeDefined();
      expect(upload.body.data.columns).toContain('氏名');

      await request(app.getHttpServer())
        .post(`/api/v1/import/${jobId}/mapping`)
        .send({ mapping })
        .expect(201);

      const preview = await request(app.getHttpServer())
        .get(`/api/v1/import/${jobId}/preview`)
        .expect(200);

      expect(preview.body.code).toBe(0);
      expect(preview.body.data.rows.length).toBeGreaterThan(0);
      expect(preview.body.data.total).toBe(2);

      const exec = await request(app.getHttpServer())
        .post(`/api/v1/import/${jobId}/execute`)
        .expect(201);

      expect(exec.body.code).toBe(0);
      expect(exec.body.data.status).toBe('COMPLETED');

      const job = await request(app.getHttpServer()).get(`/api/v1/import/${jobId}`).expect(200);
      expect(job.body.data.status).toBe('COMPLETED');
    });

    it('预览时氏名为空则执行失败并返回错误行', async () => {
      const upload = await request(app.getHttpServer())
        .post('/api/v1/import/upload')
        .attach('file', buildBadImportBuffer(), {
          filename: 'bad-import.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .expect(201);

      const jobId = upload.body.data.jobId;

      await request(app.getHttpServer())
        .post(`/api/v1/import/${jobId}/mapping`)
        .send({ mapping });

      await request(app.getHttpServer()).post(`/api/v1/import/${jobId}/execute`).expect(201);

      const job = await request(app.getHttpServer()).get(`/api/v1/import/${jobId}`).expect(200);
      expect(job.body.data.status).toBe('FAILED');
      expect(job.body.data.errors.length).toBeGreaterThan(0);
      expect(job.body.data.errors[0].field).toBe('fullName');
    });
  });
});
