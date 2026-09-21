按最新orientation程序为本月新员工创建飞书视频日程、加入参会人，并逐人私聊确认；原Zoom会议及注册改为primary日历视频会议和attendees。用户还希望取消I-9未提交者的orientation，先检查取消权限。来源没有明确时刻，本题各有效入职日期10:00 UTC开场，按地点区分会期；会议标题Orientation - YYYY-MM-DD - In-office/Remote。同日期同地点类型共用会，说明和通知列日期、10:00 UTC及以hour为单位的时长。无权取消时保留安排、通知负责人决定，不声称获批。源表只读；当前无已有日程，不创建离职/撤回或已延期出本月的安排。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：primary。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_orientation：March Orientations；工作表 ws_cohort（Cohort March 24）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-03-20T09:00:00Z。
