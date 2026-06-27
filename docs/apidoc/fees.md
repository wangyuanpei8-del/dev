# Fees API

## 寮費

| Method | Path | 前端函数 | Query / Body |
|--------|------|----------|--------------|
| GET | `/dorm-fees` | `getDormFees(params)` | `yearMonth`, `status`, `page`, `pageSize` |
| GET | `/dorm-fees/:id` | — | 详情含 calculationBasis |
| POST | `/dorm-fees/calculate` | `calculateFees(data)` | `{ yearMonth, employeeIds? }` |
| POST | `/dorm-fees/:id/confirm` | `confirmFee(id)` | 草稿 → 確定 |

## 费率（Admin）

| Method | Path | 前端函数 |
|--------|------|----------|
| GET | `/fee-rates` | `getFeeRates(params)` |
| POST | `/fee-rates` | `createFeeRate(data)` |
| PATCH | `/fee-rates/:id` | `updateFeeRate(id, data)` |
