# Vacancies API

| Method | Path | 前端函数 | Query |
|--------|------|----------|-------|
| GET | `/vacancies` | `getVacancies(params)` | `asOfDate`, `location?`, `genderType?` |
| GET | `/vacancies/assignable-rooms` | `getAssignableRooms(params)` | `employeeId`, `moveInDate` |
