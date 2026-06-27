import { RoomTypeLabels } from '@/constants/enums';

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computePartAmount(part, daysInMonth) {
  const area = num(part.areaSqm ?? part.area_sqm);
  const rate = num(part.dailyRateYen ?? part.daily_rate_yen);
  const days = num(part.occupiedDays ?? part.occupied_days);
  const dim = num(daysInMonth);
  if (area == null || rate == null || days == null || !dim) return null;
  return Math.round((area * rate * days) / dim);
}

/** 算定根拠 JSON → 画面表示用 */
export function parseFeeBasis(raw) {
  if (!raw || typeof raw !== 'object') return null;

  if (Array.isArray(raw)) {
    return parseFeeBasis({ parts: raw, daysInMonth: 30 });
  }

  if (raw.parts && Array.isArray(raw.parts)) {
    const daysInMonth = num(raw.daysInMonth ?? raw.days_in_month) ?? 30;
    const parts = raw.parts.map((p, i) => {
      const roomType = p.roomType ?? p.room_type;
      const occupiedDays = num(p.occupiedDays ?? p.occupied_days) ?? 0;
      const areaSqm = num(p.areaSqm ?? p.area_sqm);
      const dailyRateYen = num(p.dailyRateYen ?? p.daily_rate_yen);
      const partAmountYen =
        num(p.partAmountYen ?? p.part_amount_yen) ?? computePartAmount(p, daysInMonth);

      return {
        index: i + 1,
        roomName: p.roomName || p.room_name || '',
        dormName: p.dormName || p.dorm_name || '',
        roomType,
        roomTypeLabel: RoomTypeLabels[roomType] || roomType || '—',
        areaSqm,
        dailyRateYen,
        occupiedDays,
        partAmountYen,
        locationLabel: [p.dormName || p.dorm_name, p.roomName || p.room_name].filter(Boolean).join(' / '),
      };
    });

    const totalFromParts = parts.reduce((sum, p) => sum + (p.partAmountYen ?? 0), 0);

    return {
      daysInMonth,
      parts,
      totalFromParts: parts.some((p) => p.partAmountYen != null) ? totalFromParts : null,
      formulaText: '面積（㎡）× 日単価（円）× 在室日数 ÷ 当月日数',
    };
  }

  const legacyDays = num(raw.days ?? raw.occupiedDays);
  const legacyRate = num(raw.dailyRate ?? raw.daily_rate ?? raw.dailyRateYen);
  if (legacyDays != null || legacyRate != null) {
    return {
      daysInMonth: legacyDays ?? 30,
      parts: [],
      legacyNote: '旧形式のデータです。「算定」を再実行すると、部屋別の内訳が表示されます。',
      legacyDays,
      legacyRate,
    };
  }

  return null;
}

export function formatYen(v) {
  if (v == null) return '—';
  return `¥${Number(v).toLocaleString('ja-JP')}`;
}
