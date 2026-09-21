将高意向联系人同步到 acc_1 的 High Intent 受众。先读取当前需求生成规则；联系人在 hubspot_contacts，名单在 google_ads_customer_lists 飞书台账。只添加符合规则且未退订者，保留既有成员；members 字段用按邮箱字母排序的去重 JSON 字符串数组，不改联系人本身。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_7adc35bdcae4：google_ads_customer_lists（来源实体 google_ads_customer_lists）
- tbl_12c992d3771f：hubspot_contacts（来源实体 hubspot_contacts）
- tbl_7c76ad427795：hubspot_deals（来源实体 hubspot_deals）
