今天2026-04-01，按最新intern政策处理有效实习生。Conditional须先私聊Legal后才能创建任务或欢迎；学校/日期/导师采用来源与有效更正。Asana改为intern_onboarding飞书台账字段name、school、department、mentor、mentor_email、start_date、status=Not Started。给导师私聊实习生学校、有效Start Date（ISO及June N）并请求书面批准email account，未获批前不能请求IT或创建账号；不办信用卡。interns群逐人欢迎，仅姓名、部门、有效入职日，不公开条件背调细节。不必修改原Roster。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_interns：Summer Intern Program 2026；工作表 ws_roster（Intern Roster）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-04-01T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_c7567bc410c7：intern_onboarding（来源实体 intern_onboarding）
