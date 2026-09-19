今天2026-03-15，按薪酬保密与提交权限准备经理审阅包；使用最新绩效，不广播、不直接交committee、不改薪资。每位有合格员工的经理一条私聊，逐人列Employee | Salary | Level | Tenure X years | Performance及已知特殊备注。Tenure按实际天数/365四舍五入两位计算。VP People另收全部包供其提交；没有调薪幅度依据时说明调整建议待经理审阅，不编造数值，不必回写源绩效。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_comp_review：Comp Review Data；工作表 ws_data（Employee Data）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-03-15T09:00:00Z。
