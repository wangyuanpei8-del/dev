import { Dorm, Employee, Room } from '@prisma/client';
import { decimalToNumber, formatDateField } from '../../common/mapper.util';

type DormWithLeader = Dorm & { responsible_employee?: Employee | null };

export function mapDorm(d: DormWithLeader) {
  return {
    id: d.id,
    version: d.version,
    code: d.code,
    name: d.name,
    address: d.address,
    postalCode: d.postal_code,
    layoutType: d.layout_type,
    genderType: d.gender_type,
    location: d.location,
    responsibleEmployeeId: d.responsible_employee_id,
    notes: d.notes,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}

export function mapRoom(r: Room) {
  return {
    id: r.id,
    version: r.version,
    dormId: r.dorm_id,
    code: r.code,
    name: r.name,
    areaSqm: decimalToNumber(r.area_sqm),
    capacity: r.capacity,
    roomType: r.room_type,
    hasAc: r.has_ac,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
