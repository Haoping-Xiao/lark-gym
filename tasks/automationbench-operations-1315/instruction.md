按Lead Sync所有规则，将有lead_score且允许同步的HubSpot联系人对齐aud_main的mailchimp_subscribers.tags。JSON数组中只留正确temperature tag，保留其他非温度标签。不存在的联系人创建mailchimp_subscribers(list_id/email/tags)，本题不补订阅状态。opted-out已有者只移除温度标签，legal hold完全不动。ws_log每个实际变更追加Email/Score/Temperature/Action，Action=Synced或Removed，Removed行Temperature为空；不改HubSpot分数或发通知。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

邮件列表实体存放在 mailchimp_audiences / mailchimp_subscribers 等集合，以 list_id 关联，订阅状态直接写 status；归档写 archived，退订写 unsubscribed，保留记录用于审计。通过 Base 查询实际 record_id。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

飞书电子表格目录：

- ss_lead_sync：Lead Sync；工作表 ws_log（Log）, ws_sync_rules（Sync Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
