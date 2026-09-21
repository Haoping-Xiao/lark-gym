为 Q1 Enterprise Deal 的管道评审准备公司资料。关联 CRM 账户与 linkedin_companies 飞书台账，核实公司身份，按 ss_channel_policy 的员工规模和账户层级路由到适当飞书群。摘要保留公司名称、行业、网站、员工区间、全部 specialties、简介与商机金额/阶段，不修改 CRM。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_channel_policy：Slack Channel Policy；工作表 ws_routing_001（Channel Routing）, ws_tier_overrides（Account Tier Overrides）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_bc62a3c14fec：客户公司（来源实体 accounts）
- tbl_aeb79edafcb8：linkedin_companies（来源实体 linkedin_companies）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
- tbl_9be34f3e549c：商机（来源实体 opportunities）
