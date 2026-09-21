读Badges全部policy，couple weeks明确今天至Feb23含第14天，仅Active且无SEC hold，已过期/Renewed/Terminated排除。Expiry支持ISO及MM/DD/YYYY，通知仍保留原日期文本；按Badge Number逐卡判断，不因姓名相同合并漏卡。对每卡Phone会话IM和Company Contact邮箱会话IM各通知姓名、badge、expiry，security群汇总同样字段。只通知不续期、不改状态。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_badges：Contractor Badges；工作表 ws_contractors（Badge Tracker）, ws_badge_hold_policy（Badge Notification Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_0c2bd90b8523：twilio_sms_messages（来源实体 twilio_sms_messages）
