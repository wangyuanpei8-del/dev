/**
 * データ整合性 issue → ユーザー向け操作ガイド
 */

function historyActions(historyId, extra = []) {
  return [
    { label: '退寮登録', path: `/occupancy/${historyId}/move-out`, primary: true },
    { label: '履歴一覧', path: '/occupancy/history' },
    ...extra,
  ];
}

export function enrichDataIssues(issues = []) {
  const detailed = issues.filter((i) => i.id !== 'resident_room_count_mismatch');

  return issues.map((issue) => {
    switch (issue.id) {
      case 'history_room_status_mismatch':
        return {
          ...issue,
          actionGuide:
            '在室履歴と部屋の表示が食い違っています。該当の履歴を確認し、必要な操作を行ってください。',
          items: (issue.items || []).map((item) => {
            const hasMoveOut = Boolean(item.moveOutDate);
            return {
              ...item,
              summary: `${item.employeeName} · ${item.dormName} / ${item.roomName}`,
              actionText: hasMoveOut
                ? `退寮日 ${item.moveOutDate} 登録済みです。追加の退寮登録は不要です。`
                : '履歴は在室のままですが、部屋は空室表示です。実際に退寮済みなら退寮日を登録してください。',
              detail: item.detail,
              actions: hasMoveOut
                ? [
                    { label: '履歴一覧', path: '/occupancy/history', primary: true },
                    ...(item.employeeId ? [{ label: '社員詳細', path: `/employees/${item.employeeId}` }] : []),
                  ]
                : historyActions(item.historyId, item.employeeId
                  ? [{ label: '社員詳細', path: `/employees/${item.employeeId}` }]
                  : []),
            };
          }),
        };

      case 'employee_multi_active':
        return {
          ...issue,
          actionGuide: '1人の社員が複数の部屋に同時入居中です。正しい部屋だけ残し、それ以外は退寮登録してください。',
          items: (issue.items || []).map((item) => ({
            ...item,
            summary: `${item.employeeName}（在室履歴 ${item.count || item.histories?.length || '?'} 件）`,
            actionText: '不要な入居履歴それぞれに退寮登録してください。',
            actions: (item.histories || []).map((h) => ({
              label: `${h.dormName}/${h.roomName}を退寮`,
              path: `/occupancy/${h.historyId}/move-out`,
            })).concat(item.employeeId ? [{ label: '社員詳細', path: `/employees/${item.employeeId}` }] : []),
          })),
        };

      case 'room_multi_active':
        return {
          ...issue,
          actionGuide: '同じ部屋に複数の在室履歴があります。重複分は退寮登録してください。',
          items: (issue.items || []).map((item) => ({
            ...item,
            summary: `${item.dormName} / ${item.roomName}（${item.count || item.histories?.length || '?'} 件）`,
            actionText: '重複している入居者のうち、不要な履歴に退寮登録してください。',
            actions: (item.histories || []).map((h) => ({
              label: `${h.employeeName}を退寮`,
              path: `/occupancy/${h.historyId}/move-out`,
            })),
          })),
        };

      case 'deleted_employee_active':
        return {
          ...issue,
          actionGuide: '削除済み社員の在室履歴が残っています。社員を復元するか、退寮登録してください。',
          items: (issue.items || []).map((item) => ({
            ...item,
            summary: `${item.employeeName} · ${item.roomName || '—'}`,
            actionText: '社員を復元するか、退寮登録して履歴を閉じてください。',
            actions: historyActions(item.historyId, [{ label: '削除済履歴', path: '/occupancy/history?inconsistent=1' }]),
          })),
        };

      case 'deleted_room_active':
      case 'deleted_dorm_active':
        return {
          ...issue,
          actionGuide:
            issue.id === 'deleted_dorm_active'
              ? '削除済み寮に紐づく在室履歴があります。寮を復元するか、退寮登録してください。'
              : '削除済み部屋に紐づく在室履歴があります。部屋を復元するか、退寮登録してください。',
          items: (issue.items || []).map((item) => ({
            ...item,
            summary: `${item.employeeName} · ${item.dormName} / ${item.roomName}`,
            actionText: '退寮登録して履歴を閉じてください。',
            actions: historyActions(item.historyId, [
              { label: '履歴一覧', path: '/occupancy/history' },
            ]),
          })),
        };
      case 'room_without_history':
        return {
          ...issue,
          actionGuide: '部屋は在室表示なのに、対応する在室履歴がありません。',
          items: (issue.items || []).map((item) => ({
            ...item,
            summary: `${item.dormName} / ${item.roomName}`,
            actionText: '入退寮履歴を確認し、なければ入寮登録してください。',
            actions: [
              { label: '入寮登録', path: '/occupancy/create', primary: true },
              { label: '履歴一覧', path: '/occupancy/history' },
              { label: '空室確認', path: '/vacancies' },
            ],
          })),
        };

      case 'resident_room_count_mismatch':
        return {
          ...issue,
          actionGuide:
            detailed.length > 0
              ? '在室人数（退寮未登録）と使用中部屋数（物理在室）が一致していません。下記の個別項目を修正してください。'
              : '退寮未登録の人数と物理的使用中部屋数が一致しません。重複入居・未退寮・退寮当日の差異を確認してください。',
          items: [],
          relatedCount: detailed.length,
        };

      default:
        return { ...issue, actionGuide: issue.message, items: issue.items || [] };
    }
  });
}
