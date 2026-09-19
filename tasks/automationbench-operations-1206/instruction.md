按maintenance windows、所有有效policy和供应商确认，选择Warehouse主HVAC下一可用窗口，在cal_ops飞书日历安排Warehouse HVAC Maintenance。当前时间固定2026-02-10 10:00 UTC，避免将源待安排窗口置于过去；auxiliary不属于本次。Airtable原题只有记录引用无本体，创建maintenance_comments(applicationId=base_ops/tableName=Maintenance/recordId=rec_14/commentText含系统/地点/准确日期起止及已安排)，不声称完成维护，不改来源审批表。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：cal_ops, primary。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_maint_windows：Maintenance Windows；工作表 ws_windows（Windows）, ws_policy（Scheduling Policy）, ws_policy_q1_update（Q1 2026 Policy Update）, ws_vendor_status（Vendor Confirmation Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-10T10:00:00Z。
