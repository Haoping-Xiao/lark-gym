按最新Equipment Provisioning Policy和starter Notes为真正需要的新全职员工准备设备。Jira改equipment_tickets飞书台账，字段summary姓名、employee_id、department、start_date、location、laptop、peripherals（JSON数组文本）、delivery：Office或Home address required。远程需monitor，但源缺具体家庭地址，只登记待补，不声称已发货或付款。给it-ops@company.example.com一条完整设备清单，逐人列型号、外设、地点与日期；不含跳过的人，不改来源。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_newhires_5107：New Hire Onboarding Tracker；工作表 ws_starters_5107（April Starters）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-04-15T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_665d654c08c2：equipment_tickets（来源实体 equipment_tickets）
