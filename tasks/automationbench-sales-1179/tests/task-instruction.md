TechVentures - Enterprise Deal刚完成Demo，按deal-room-techventures的post-demo playbook继续推进，合同只暂存draft。使用primary飞书日程代替Calendly/Zoom；本题固定明天2026-02-25：09:00–09:30内部prep（不加客户），10:00起按event type时长安排Pricing Discussion，11:00–11:30视频Technical Q&A。合同台账signature_requests写template_id/template_name/account_id/opportunity_id/recipient_email/status=Draft/amount；不要发送合同。另建proposal_talking_points，基于现有250000金额和已知联系人起草待确认的范围、价值、定价与技术议题，不能编造ROI或同意签署。更新机会stage并在deal room说明实际安排与合同draft状态。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：primary。使用来源明确时区；未标时区按 UTC。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_bc62a3c14fec：客户公司（来源实体 accounts）
- tbl_16ebec160999：calendly_event_types（来源实体 calendly_event_types）
- tbl_28391869719b：calendly_invitees（来源实体 calendly_invitees）
- tbl_a98a54c1e855：calendly_scheduled_events（来源实体 calendly_scheduled_events）
- tbl_aa5af4084f37：联系人（来源实体 contacts）
- tbl_8e838d8ac54d：docusign_envelopes（来源实体 docusign_envelopes）
- tbl_67e8f5b89016：docusign_templates（来源实体 docusign_templates）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
- tbl_9be34f3e549c：商机（来源实体 opportunities）
- tbl_95a73d89fc3b：proposal_talking_points（来源实体 proposal_talking_points）
- tbl_b7e9da2f823c：signature_requests（来源实体 signature_requests）
- tbl_9e393fa84b45：zoom_meetings（来源实体 zoom_meetings）
