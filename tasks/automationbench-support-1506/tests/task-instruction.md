仅open Intercom会话按ss_templates/ws_responses的精确Topic Tag匹配，多个命中取Priority最小；未命中不草拟，不按subject猜分类。新建mail_drafts(to=contact邮箱/subject=完整title/body=模板原文后追加Batch_Reference)，不实际发送。每个draft创建intercom_notes(contact_id/body含Batch_Reference、draft、姓名、title、选中tag及本次该会话draft数)。保留源值原文，不改会话tags或状态。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_templates：Response Templates；工作表 ws_responses（Topic Templates）, ws_config（Report Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_340d8a319d78：intercom_contacts（来源实体 intercom_contacts）
- tbl_466e562074c2：intercom_conversations（来源实体 intercom_conversations）
- tbl_aab4246ab7fa：intercom_notes（来源实体 intercom_notes）
- tbl_f9aeb41ef78b：mail_drafts（来源实体 mail_drafts）
