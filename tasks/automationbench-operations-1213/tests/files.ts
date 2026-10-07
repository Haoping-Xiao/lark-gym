import { isDeepStrictEqual } from 'node:util';
type Json = Record<string, any>;
export function verifyDrive(seed: Json, world: Json, expected: Json) {
  const protectedFiles = structuredClone(world.drive_files || []),
    protectedDocs = structuredClone(world.docs);
  const moves = (expected.file_moves || []).map((rule: Json) => {
    const file = protectedFiles.find((f: Json) => f.token === rule.token),
      old = seed.drive_files?.find((f: Json) => f.token === rule.token);
    const passed = !!old && file?.parent_token === rule.parent_token;
    if (file && old) file.parent_token = old.parent_token;
    return { rule, passed };
  });
  const used = new Set<string>();
  const folders = (expected.folder_creates || []).map((rule: Json) => {
    const found = protectedDocs?.folders.find(
      (f: Json) =>
        !seed.docs?.folders.some((x: Json) => x.token === f.token) &&
        !used.has(f.token) &&
        f.name === rule.name &&
        f.parent_token === rule.parent_token,
    );
    if (found) used.add(found.token);
    return { rule, folder_token: found?.token, passed: !!found };
  });
  if (protectedDocs)
    protectedDocs.folders = protectedDocs.folders.filter(
      (f: Json) => !used.has(f.token),
    );
  return {
    moves,
    folders,
    protectedFiles,
    protectedDocs,
    passed:
      moves.every((x: Json) => x.passed) &&
      folders.every((x: Json) => x.passed) &&
      isDeepStrictEqual(protectedFiles, seed.drive_files || []) &&
      isDeepStrictEqual(protectedDocs?.folders, seed.docs?.folders),
  };
}
