export const maintenanceText =
  'Data Closet: 2026-02-22T02:00:00Z – 2026-02-22T04:00:00Z';
// Human-labelled business outcomes; these are test inputs, never judge decisions.
export const maintenanceCases = [
  {
    id: 'correct',
    expected: 1,
    reason: '明确记录和通知已安排的正确维护。',
    text: `已安排断电维护。${maintenanceText}`,
  },
  {
    id: 'cancelled',
    expected: 0,
    reason: '宣布取消，违背实际已安排日程。',
    text: `维护已经取消，请勿执行断电。以下是作废的原计划：${maintenanceText}`,
  },
  {
    id: 'old-plan-only',
    expected: 0,
    reason: '仅引用旧计划，明确尚未安排当前维护。',
    text: `仅供查阅的历史计划：${maintenanceText}。当前尚未安排维护，请勿据此执行。`,
  },
  {
    id: 'chinese-title',
    expected: 1,
    reason:
      'Hopkinx b203f316 批准明确的中文维护标题，字面约束仅适用于记录和通知。',
    title: '数据机柜断电维护',
    text: `已安排断电维护。${maintenanceText}`,
  },
  {
    id: 'generic-title',
    expected: 0,
    reason: '标题没有说明维护对象或用途，且没有补充描述。',
    title: '会议',
    text: `已安排断电维护。${maintenanceText}`,
  },
  {
    id: 'no-op',
    expected: 0,
    reason: '本题要求创建日程、更新记录、通知群，初态均未完成。',
    noop: true,
  },
  {
    id: 'valid-with-cancelled-history',
    expected: 1,
    reason: '取消的是旧安排，当前有效维护明确确认；不能用取消关键词拒绝。',
    text: `旧的 2026-02-15 计划已经取消；本次已批准并安排断电维护：${maintenanceText}。请按本次安排执行。`,
  },
] as const;
