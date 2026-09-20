按精确customer_email聚合全部会话（含closed），Conversation Count全部计数，Total Replies仅thread_type=reply。原题无定量阈值，本题公开口径：HIGH为同一问题域反复求助且至少一会话>=5线程，或reassigned反复转交；其余有同问题跨会话再求助为MEDIUM，其他LOW。主题需读正文，不能将无关问题仅按同人拼成复发。ws_scores所有客户都写含四列的记录；high-effort只加到HIGH客户>=5线程或reassigned的高负担会话，非该条件会话不标。仅HIGH客户各一条邮箱IM致歉及指出实际问题域，不发客服agent。cx-insights含Report_Reference、high人数及所有客户邮箱/会话数/reply数/等级。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_effort：Customer Effort Tracker；工作表 ws_scores（Effort Scores）, ws_config（Report Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
