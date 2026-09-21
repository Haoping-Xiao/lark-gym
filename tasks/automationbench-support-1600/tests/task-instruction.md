按ss_sync同步新/更新会话，先排除closed/resolved、test.internal/staging.internal与paused-sync。reamaze unresolved等价Intercom open；tracker与当前一致不动，状态变更须双方追加内部reamaze_messages(conversation_id/body/author_type=staff/internal=true文本)及intercom_notes(conversation_id/body/author_type=admin)，更新Last Synced Status为规范open并Notes记变化，不伪造冲突或改当前一致的两端状态。新counterpart用external_key=sync_源会话ID；Intercom目标联系人缺失时先建intercom_contacts(external_key=contact_sync_源ID/email/contact_type=user/tags空数组)，目标会话contact_ids指向该key。转Re:amaze保留客户name/email；两方向保留subject/title、tags、内容，state=open/status=unresolved。ws_tracker新行填写双源ID或目标external_key、Subject、Last Synced Status=open、Sync Status=synced、Notes=Created Intercom counterpart或Created Re:amaze counterpart。platform-sync报告各方向数量、原subject、双引用及客户可得姓名/邮箱和变更，跳过项不报告。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_sync：Sync Configuration；工作表 ws_tracker（Sync Tracker）, ws_priority（Conflict Priority）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_340d8a319d78：intercom_contacts（来源实体 intercom_contacts）
- tbl_466e562074c2：intercom_conversations（来源实体 intercom_conversations）
- tbl_aab4246ab7fa：intercom_notes（来源实体 intercom_notes）
- tbl_029a23ba59d9：reamaze_conversations（来源实体 reamaze_conversations）
- tbl_1278a539b427：reamaze_messages（来源实体 reamaze_messages）
