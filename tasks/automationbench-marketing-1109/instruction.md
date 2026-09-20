今天为 2026-01-27。查看视频库和所有生产说明，按视频主管标准为合格录播生成社交片段建议，写入片段队列并指定平台。本批每个合格录播的所有 key_moments 均生成一条建议：演示片段去 Instagram、快速提示去 Twitter，其余专业内容去 LinkedIn。status=Suggested，priority 一般 Normal、明确优先片段 High；production_ref 填生产批次码，clip_description 保留原片段名及明确反应量。只规划，不实际剪辑或发布。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_videos：Video Library；工作表 ws_recordings（Recordings）
- ss_clips：Video Clip Queue；工作表 ws_queue（Queue）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-27T12:00:00Z。
