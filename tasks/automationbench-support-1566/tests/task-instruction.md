固定2026-02-07，按ss_csat各规则处理未Processed的有效评分，票不存在/评分非数字/已处理不动。七天冷却按运行前已发CSAT记录判断，整位客户全部跳过；本批同人多票分别做工单动作、合并一条客户IM，不让本批首条通知阻止后续票。VIP以精确邮箱区分：个人电话接管者跳过全部自动动作，明确Email-only者仅免消息仍可记注/调优先级。低分priority按规则，低/中分新增freshdesk_notes(ticket_id/body含CSAT分数及原反馈/private=true文本)，中分补改善计划不升级；高分请求testimonial，VP例外改个人感谢并注明VP Email和Custom Subject，不能再发testimonial。处理成功行Processed=Yes，跳过行保留No。邮件改邮箱IM；摘要只列处理数Low/Medium/High，不写Skipped或被跳过客户。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_csat：CSAT Survey Results；工作表 ws_responses（Responses）, ws_followup_rules（CSAT Followup Rules）, ws_vip_exclusions（VIP Exclusions）, ws_vp_testimonial_overrides（VP Testimonial Overrides）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-07T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_77c87bf8e743：freshdesk_contacts（来源实体 freshdesk_contacts）
- tbl_27c7d448fabc：freshdesk_notes（来源实体 freshdesk_notes）
- tbl_1984cace9e49：freshdesk_tickets（来源实体 freshdesk_tickets）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
