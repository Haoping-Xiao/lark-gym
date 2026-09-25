仅open Intercom会话按ss_templates/ws_responses的精确Topic Tag匹配，多个命中取Priority最小；未命中不草拟，不按subject猜分类。新建mail_drafts(to=contact邮箱/subject=完整title/body=模板原文后追加Batch_Reference)，不实际发送。每个draft创建intercom_notes(contact_id/body含Batch_Reference、draft、姓名、title、选中tag及本次该会话draft数)。保留源值原文，不改会话tags或状态。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
