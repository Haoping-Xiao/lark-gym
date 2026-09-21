按本周Interview Schedule、申请来信及panel偏好准备面试包。LinkedIn只提供离线姓名和URL快照，不能声称已验证履历；外部候选人交叉核对该快照和申请，内部转岗只用内部摘要。撤回者不准备、不通知，来源Status改Cancelled；源无日历实例不伪造取消会议。每个有效候选人在interview_dossiers台账保存candidate、role、interview_date、body；将同份brief分别私聊给各panel成员，保留履历数字、经验、偏好问题。源未标finalist，本题仅将仍Confirmed外部候选人作为本批finalist，给bgcheck-coord@company.example.com一条姓名/Role申请，不自行背调。body不得编造资料未给出的竞争项目，需说明未提供。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_interview_prep：Interview Schedule - Week of March 25；工作表 ws_schedule（Schedule）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-03-25T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_2970e75f6481：interview_dossiers（来源实体 interview_dossiers）
- tbl_fc0f24bafbae：linkedin_profiles（来源实体 linkedin_profiles）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
