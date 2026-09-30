import { isDeepStrictEqual } from 'node:util';
type Json = Record<string, any>;
// Match real document objects, never reconstructed Base records or player output.
export function verifyDocuments(
  seed: Json,
  world: Json,
  rules: Json[],
  calls: Json[],
) {
  const old = new Set(
    (seed.docs?.documents || []).map((d: Json) => d.document_id),
  );
  const created: Json[] = (world.docs?.documents || []).filter(
    (d: Json) => !old.has(d.document_id),
  );
  const used = new Set<string>();
  const contains = (actual: unknown, terms: string[]) =>
    typeof actual === 'string' && terms.every((t) => actual.includes(t));
  const checks = rules.map((rule) => {
    const match = created.find(
      (doc) =>
        !used.has(doc.document_id) &&
        doc.parent_token === rule.parent_token &&
        (rule.title_contains
          ? contains(doc.title, rule.title_contains)
          : rule.semantic_title || doc.title === rule.title) &&
        (rule.content_literal
          ? contains(doc.content, rule.content_literal)
          : rule.semantic_content || doc.content === rule.content) &&
        (!rule.link_chats?.length ||
          rule.link_chats.every((chat: string) =>
            world.messages.some(
              (m: Json) =>
                !seed.messages.some(
                  (x: Json) => x.message_id === m.message_id,
                ) &&
                m.chat_id === chat &&
                m.body.content.includes(
                  `https://company.feishu.cn/docx/${doc.document_id}`,
                ),
            ),
          )) &&
        calls.some(
          (call) =>
            call.status < 400 &&
            call.mutations?.some(
              (m: Json) =>
                m.kind === 'document' &&
                m.id === doc.document_id &&
                !m.before &&
                m.after,
            ),
        ),
    );
    if (match) used.add(match.document_id);
    return { rule, document_id: match?.document_id, passed: !!match };
  });
  const protectedDocs = structuredClone(world.docs);
  if (protectedDocs)
    protectedDocs.documents = protectedDocs.documents.filter(
      (d: Json) => !used.has(d.document_id),
    );
  return {
    checks,
    passed:
      checks.every((c) => c.passed) &&
      used.size === created.length &&
      isDeepStrictEqual(seed.docs, protectedDocs),
    protectedDocs,
  };
}
