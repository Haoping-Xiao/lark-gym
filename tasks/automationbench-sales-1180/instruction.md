处理AI Innovation Summit高参与者，研究现有LinkedIn资料并据seniority与company_size转入pipeline。原题未给高参与及seniority边界，本题明确attendance_duration>=45分钟且职位Director/VP/C-level，company_size必须>=50；简介中的定性声明不改数字门槛。合格者建leads(status=Qualified、姓名/email/company/title/source)、accounts(account_name、external_id为account:<公司名>)、opportunities(name包含公司与webinar、account_external_id关联账户、stage=Discovery、source)。金额未给则不编造。创建primary飞书Discovery Call并邀请，原题未定时刻统一2026-02-25 10:00 UTC按event type时长；私聊个性化跟进并marketing-qualified汇总。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：primary。使用来源明确时区；未标时区按 UTC。

当前时间固定为 2026-02-24T09:00:00Z。
