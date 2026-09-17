import { maintenanceNotice } from '../../../cases/maintenance-notice/case.js';
import type { CaseDefinition } from './contracts.js';
const cases = new Map<string, CaseDefinition>([
  [maintenanceNotice.id, maintenanceNotice],
]);
export function loadCase(id: string): CaseDefinition {
  const entry = cases.get(id);
  if (!entry)
    throw new Error(
      `Unknown case ${id}; available: ${[...cases.keys()].join(', ')}`,
    );
  return entry;
}
