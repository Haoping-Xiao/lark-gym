今天是 2026-01-27。执行 Prism 2.0 发布传播，读取 ss_lnch、业务来信和 prism-launch 群，落实最后修改，按渠道审批有效期筛选并先与群内团队协调本轮执行。合格 Social 提交 facebook_pages_posts 飞书发布队列（page_id、message 为 headline 原文、status=queued），合格 Blog 保存 content_queue（content_id、headline、channel、status=queued），合格 Email 按 notes 指定分发地址发飞书私聊。源数据只有标题，本轮不编造正文。源表状态：入队 Queued、通知发送 Sent、待重审 Needs Re-approval；过期项向 content-team@company.example.com 逐项申请重审。向 launch-ops@company.example.com 汇总每项 content_id、最终 headline、状态。队列不代表外部发布成功。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_lnch：Prism 2.0 Launch Content；工作表 ws_content（Approved Content）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-27T12:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_120390750ed1：content_queue（来源实体 content_queue）
- tbl_54d08998ca97：facebook_pages_pages（来源实体 facebook_pages_pages）
- tbl_66a5d7053325：facebook_pages_posts（来源实体 facebook_pages_posts）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
