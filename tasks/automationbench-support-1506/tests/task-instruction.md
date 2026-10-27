仅open Intercom会话按ss_templates/ws_responses的精确Topic Tag匹配，多个命中取Priority最小；未命中不草拟，不按subject猜分类。在飞书邮箱新建真实草稿，收件人为contact邮箱、主题为完整title、正文为模板原文后追加Batch_Reference，不实际发送。每个draft创建intercom_notes(contact_id/body含Batch_Reference、draft、姓名、title、选中tag及本次该会话draft数)。保留源值原文，不改会话tags或状态。

邮件收发和草稿均使用飞书邮箱。草稿不要发送；工单备注与处理日志仍保存在相应飞书业务表，保持草稿与原工单及联系人的对应关系。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
