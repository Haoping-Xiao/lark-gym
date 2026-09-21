处理停车位申请，读取 ss_parking 全部政策、车位与资历表，并核对设施管理最新通知。按 Rank 从小到大分配给有效申请人，已有车位不重复分配；Handicap 仅 Accessibility=Yes，Reserved 仅 Director 及以上，Standard 通用。先为符合条件者匹配专用类型以保留普通车位，同类型取编号最小可用位；跳过维护或其他限制车位和不合格员工。更新 ws_spots 的 Assignee，逐人私聊车位编号和类型。在 office-ops 群汇总所有新分配、数量和整体利用率；分母为全部 Status=Active 车位，百分比四舍五入到整数。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_parking：Parking Management；工作表 ws_spots（Parking Spots）, ws_seniority（Employee Seniority）, ws_parking_policy（Parking Policy）, ws_allocation_rules（Allocation Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
