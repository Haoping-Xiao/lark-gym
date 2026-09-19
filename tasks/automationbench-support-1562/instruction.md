固定2026-02-10，处理open且needs-review票；ws_history标Cooldown跳过，未有历史者按当前group从Tier1起正常处理，不凭缺失历史拒绝。Active只升一级，group按现有support_groups映射；到Max_Tier不改group，追加max-tier。每处理票新增内部support_comments(ticket_id/body含escalated及目标Tier，满级则含maximum/public=false文本)，ws_log含From Tier/To Tier/Date/Notes（满级From=To）。保留ws_history为既往记录，不重写过去；无needs-review、pending、closed不动。support-escalations含Batch_Reference、所有本轮票ID与去向、升级和满级数。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_escalation：Escalation Tracker；工作表 ws_history（Escalation History）, ws_log（Escalation Log）, ws_config（Escalation Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-10T09:00:00Z。
