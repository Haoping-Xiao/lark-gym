// Keep every authoritative call while staying below the judge's per-file limit.
export function semanticEvidence(
  input: Record<string, any>,
  maxBytes = 512 * 1024,
): { name: string; data: string }[] {
  const data = JSON.stringify(input);
  if (Buffer.byteLength(data) <= maxBytes)
    return [{ name: 'input.json', data }];
  if (!Array.isArray(input.calls))
    throw new Error('Semantic evidence has no call history');
  const { calls, ...core } = input;
  const files: { name: string; data: string }[] = [];
  let chunk: any[] = [],
    start = 0,
    size = 128;
  const flush = () => {
    if (!chunk.length) return;
    const data = JSON.stringify({ start_index: start, calls: chunk });
    if (Buffer.byteLength(data) > maxBytes)
      throw new Error('Semantic call evidence exceeds file limit');
    files.push({
      name: `calls-${String(files.length + 1).padStart(4, '0')}.json`,
      data,
    });
    start += chunk.length;
    chunk = [];
    size = 128;
  };
  for (const call of calls) {
    const bytes = Buffer.byteLength(JSON.stringify(call)) + 1;
    if (bytes + 128 > maxBytes)
      throw new Error('A single semantic call exceeds file limit');
    if (size + bytes > maxBytes) flush();
    chunk.push(call);
    size += bytes;
  }
  flush();
  const coreData = JSON.stringify({
    ...core,
    call_files: files.map((f) => f.name),
    evidence_layout:
      'call_files contain the complete ordered call history; start_index is zero based; no calls are omitted.',
  });
  if (Buffer.byteLength(coreData) > maxBytes)
    throw new Error('Semantic seed/world evidence exceeds file limit');
  return [{ name: 'input.json', data: coreData }, ...files];
}
