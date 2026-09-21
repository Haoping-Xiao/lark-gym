检查飞书 CRM 联系人数据质量，查阅最近的清理政策及 SOP；出现冲突时使用最新权威来源。本次不处理 CRM 迁移。把审计发现私聊发送到 marketing@company.example.com，附政策追踪码。根据政策更新联系人 audit_tag，不合并或删除联系人。报告中的来源值必须照录。系统账号的“不标记/不移除”备注视为该账号免于本次审计和写入。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

当前时间固定为 2026-01-27T09:00:00。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_12c992d3771f：hubspot_contacts（来源实体 hubspot_contacts）
- tbl_7c76ad427795：hubspot_deals（来源实体 hubspot_deals）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
