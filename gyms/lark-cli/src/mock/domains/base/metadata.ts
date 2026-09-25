import type { World } from '../../../types.ts';

// Reuse the fixture's existing Drive catalogue label; do not invent owner,
// revision, timestamps or a second independent resource registry.
export const baseMetadata = (base: World['base']) => ({
  base_token: base.app_token,
  ...(base.workspace_token ? { workspace_token: base.workspace_token } : {}),
  name: base.name ?? '业务台账',
});
