按ss_sync以exact subject+requester email对账。原政策internal.company.com与样本internal.company.example.com不一致，本题将二者及其子域都视内部并完全排除。先判matched，再仅对unmatched closed/solved或4/5跳过；matched的open/resolved不同须报差异。priority用表中映射，status公开等价new/open=2,pending=3,solved=4,closed=5。缺失counterpart时保留subject/description、映射priority，目标新票status=open或2。若目标联系人不存在，新建support_users或freshdesk_contacts，external_key=sync_原联系人ID；新票support_tickets/freshdesk_tickets的external_key=sync_原票ID，requester_id指向该联系人key，tags及comments/notes为空JSON数组。新增sync_log记source_platform/source_ticket_id/target_platform/target_ticket_key/requester_email/report_reference。差异逐字段追加ws_discrepancies原值，双方内部support_comments(body/public=false)/freshdesk_notes(body/private=true)，均含ticket_id。只flag不擅自同步冲突值。platform-sync含Report_Reference、实际新建及差异条目、原subject与客户姓名。 本题两系统priority/status共列，均以文本保存；Freshdesk数值代码写为字符串，原数值字面内容保持。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_sync：Platform Sync Config；工作表 ws_mapping（Sync Rules）, ws_discrepancies（Discrepancies）, ws_config（Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
