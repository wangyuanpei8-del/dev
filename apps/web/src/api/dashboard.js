import {
  getLongTermWarnings,
  getOccupancyDataChecks,
  getOccupancyHistories,
} from '@/api/occupancy';
import { getDormFees } from '@/api/fees';
import { getVacancies } from '@/api/vacancies';
import { todayISO } from '@/utils/date';

export async function loadDashboardPayload(asOfDate = todayISO()) {
  const [checks, vacancies, draftFees, longTerm, recent] = await Promise.all([
    getOccupancyDataChecks({ activeOn: asOfDate }).catch(() => null),
    getVacancies({ asOfDate }).catch(() => ({ items: [] })),
    getDormFees({ status: 'DRAFT', page: 1, pageSize: 1 }).catch(() => ({ total: 0 })),
    getLongTermWarnings({ page: 1, pageSize: 1 }).catch(() => ({ total: 0 })),
    getOccupancyHistories({ page: 1, pageSize: 5, activeOn: asOfDate }).catch(() => ({ items: [] })),
  ]);

  const summary = checks?.summary || {};
  const vacancyItems = vacancies?.items || [];
  const vacantCount = summary.vacantCount ?? vacancyItems.reduce(
    (sum, d) => sum + (d.vacantCount ?? d.rooms?.filter((r) => r.status === 'VACANT').length ?? 0),
    0,
  );
  const totalRooms = summary.totalRooms ?? vacancyItems.reduce((sum, d) => sum + (d.rooms?.length ?? 0), 0);
  const occupiedRoomCount = summary.occupiedRoomCount ?? 0;
  const residentCount = summary.residentCount ?? 0;

  const dormBreakdown = checks?.dormBreakdown?.length
    ? checks.dormBreakdown
    : vacancyItems.map((d) => {
        const rooms = d.rooms || [];
        const vacant = d.vacantCount ?? rooms.filter((r) => r.status === 'VACANT').length;
        return {
          name: d.dormName || d.name,
          occupied: rooms.length - vacant,
          vacant,
          total: rooms.length,
        };
      }).filter((d) => d.total > 0);

  return {
    asOfDate,
    summary: {
      residentCount,
      occupiedRoomCount,
      vacantCount,
      totalRooms,
      draftFeeCount: draftFees?.total ?? 0,
      longTermCount: longTerm?.total ?? 0,
      issueCount: summary.issueCount ?? checks?.issues?.length ?? 0,
      isConsistent: summary.isConsistent ?? (checks?.issues?.length === 0),
    },
    issues: checks?.issues || [],
    dormBreakdown,
    todos: {
      draftFeeCount: draftFees?.total ?? 0,
      longTermCount: longTerm?.total ?? 0,
      inconsistentCount: summary.issueCount ?? checks?.issues?.length ?? 0,
      recentOccupancyCount: recent?.items?.length ?? 0,
      recentOccupancies: recent?.items || [],
    },
  };
}
