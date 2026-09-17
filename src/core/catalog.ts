import { maintenanceNotice } from '../../tasks/maintenance-notice/task.js';
import type { TaskDefinition } from './contracts.js';
const cases = new Map<string, TaskDefinition>([
  [maintenanceNotice.id, maintenanceNotice],
]);
export function loadTask(id: string): TaskDefinition {
  const entry = cases.get(id);
  if (!entry)
    throw new Error(
      `Unknown case ${id}; available: ${[...cases.keys()].join(', ')}`,
    );
  return entry;
}
