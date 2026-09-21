逐ss_merge/ws_pairs核实双方first_name、last_name、organization完全相同才合并（不使用模糊姓名，公开本题判定规则）。把secondary的全部help_conversations customer_id/customer_email改primary，保留原threads作者与正文作为历史；每张移交会话新增help_notes(conversation_id/body含merge和双方完整邮箱/public=false文本)，已有primary会话不加移交备注。完成迁移后用base +record-delete --yes删除secondary客户记录，primary原资料不改；不匹配整对不动。data-quality汇总merge数/移交会话数、成功姓名与邮箱，不列跳过姓名。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_merge：Customer Merges；工作表 ws_pairs（Merge Pairs）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_77b186294697：help_conversations（来源实体 help_conversations）
- tbl_2330fab21dcd：help_customers（来源实体 help_customers）
- tbl_bb9ef273955e：help_notes（来源实体 help_notes）
