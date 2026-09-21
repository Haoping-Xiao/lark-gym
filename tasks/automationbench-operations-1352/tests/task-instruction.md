按Holiday Staffing全部policy只统计Confirmed且无LEAVE/OT-HOLD者，仅Holiday Coverage Required=Yes部门；人数>=Min才排班，否则只私聊dept head缺口，不给不足部门部分排班。原未定时区明确UTC，Feb16 08–17每个够员部门创建一个cal_holiday日历<Department> Holiday Coverage，实际attendees包含所有合格confirmed员工。operations群报每部门eligible/min及short/covered、无需值班部门not required，不发hr。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：primary, cal_holiday。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_holiday：Holiday Staffing Plan；工作表 ws_availability（Staff Availability）, ws_requirements（Dept Requirements）, ws_holiday_coverage_policy（Holiday Coverage Hold Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
