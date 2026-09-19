按Quality Audit给有agent回复的票逐票评分；源未指定多轮合成，补定greeting/resolution/长度取最后一条agent回复（不能误取最后customer），professional_tone审查该票全部agent历史，后续礼貌回复不能抹去先前粗俗。greeting需开头独立Hi/Hello/Hey；length>=50字符；resolution需确定的解决或具体可执行步骤，i guess式猜测或just call back later不算；slang含表中整词及idk、man式随意称呼（不要把u子串误判you）。日志Score数字文本，Details固定greeting=N; resolution=N; length=N; tone=N，全部有回复者都记，包括无benchmark者。按agent所有票平均低于其benchmark才创建gorgias_tickets(subject=coaching - <邮箱>/agent_email/status=open/description含平均与建议)，并lead邮箱IM；无benchmark只报告unbenchmarked不猜lead。quality-assurance发完整逐票及逐agent平均两位小数/票数/benchmark状态，原票不改或补coaching消息。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_quality：Quality Audit；工作表 ws_rubric（Rubric）, ws_agent_benchmarks（Agent Benchmarks）, ws_quality_log（Quality Log）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
