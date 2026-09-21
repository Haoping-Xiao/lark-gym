按ss_contacts邮箱映射判断同客户同问题的跨渠道重复，不能同人不同问题就合并。无时间戳时保留email渠道为主、chat为重复；先两边追加内部reamaze_messages(conversation_id/body含merged及双ID和问题要点/author_type=staff/internal=true文本)，再将重复status=resolved；主票状态及所有历史消息原样。ws_dedup_log四列完整，Reason说明实际同一问题；support-dedup含Batch_Reference、merged数量、逐客户双ID/姓名和相关原始金额或数量。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_contacts：Contact Management；工作表 ws_contact_map（Contact Email Map）, ws_dedup_log（Dedup Log）, ws_config（Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_029a23ba59d9：reamaze_conversations（来源实体 reamaze_conversations）
- tbl_1278a539b427：reamaze_messages（来源实体 reamaze_messages）
