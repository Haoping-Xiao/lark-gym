今天是 2026-01-27 15:00 UTC。整理 StrataCorp 新平台竞争响应简报，汇合跟踪表、分析师来信和 competitive-intel 群的一线反馈，给 strategy@company.example.com 发飞书私聊。功能对照逐行按“feature_name | stratacorp_has | we_have | gap_status | priority”保留原文，其余材料需标识来源、引用关键数值。同时按当前定价页审批流程处理新价格：审批请求使用 hubspot_tickets 台账，subject 与政策一致，description 列出具体价格修改。 非表格部分按“主题 | 对应事实或数值”分行，分析师部分使用 AI-Powered Insights、Native Mobile App、Pricing、Embedded Analytics、Custom Workflows 标签，一线信息用 Field，建议用 Response。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

飞书电子表格目录：

- ss_cint：Competitive Intelligence Tracker；工作表 ws_features（Feature Comparison）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-27T15:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_12c992d3771f：hubspot_contacts（来源实体 hubspot_contacts）
- tbl_7c76ad427795：hubspot_deals（来源实体 hubspot_deals）
- tbl_a23c0edc2143：hubspot_tickets（来源实体 hubspot_tickets）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
