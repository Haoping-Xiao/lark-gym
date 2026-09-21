按Daily Close Process Runbook运行2026-01-21日终批次。本题冻结时间18:00 UTC以涵盖当天已给出的14:00完成事件；只处理今日已完成且可执行的真实合同。更新匹配商机stage/amount，逐签署人私聊欢迎致谢，按账户备注决定是否建tasks账单设置（subject含billing和客户，related_to_id为商机，status=Not Started），最后wins合并公告每个实体、原整数金额与total contract value。原DocuSign记录只读。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-01-21T18:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_bc62a3c14fec：客户公司（来源实体 accounts）
- tbl_8e838d8ac54d：docusign_envelopes（来源实体 docusign_envelopes）
- tbl_9be34f3e549c：商机（来源实体 opportunities）
- tbl_085154084c74：工作事项（来源实体 tasks）
