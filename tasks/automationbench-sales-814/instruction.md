今天2026-02-20，按Recording Distribution Policy分发昨天已结束会议的录制；在zoom_meetings中取原recording_url，按会议类型和CRM对应关系选择收件人。原email及CC改独立飞书私聊，第一行带Recording及会议标题；Discovery需notes关联机会存链接，Training按政策发资源群。recording-log汇报每场会议名、URL及实际分发人数（含CC副本），不把未执行对象列为已发送；源CRM及会议只读，唯一CRM写入为所需note。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_recording_policy：Recording Distribution Policy；工作表 ws_dist_rules（Distribution Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-20T12:00:00Z。
