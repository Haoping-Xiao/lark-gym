按IT Onboarding清单、Notes及最新IT政策建立账号配置工单。Jira改为it_tickets飞书台账，字段summary=员工全名、project、priority、description；description列Department、Role、Start Date与获准系统、配置方式。尊重root特殊审批权限，普通onboarding仅允许IAM Console；返聘只reactivate existing accounts，contractor限定权限。只创建工单，不实际开通账号，也不自行开安全审批单。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_it_setup：IT Onboarding；工作表 ws_new_hires（New Hires - March）, ws_standard（Standard Provisioning Checklist）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-03-20T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_44fdcc7b06e4：it_tickets（来源实体 it_tickets）
