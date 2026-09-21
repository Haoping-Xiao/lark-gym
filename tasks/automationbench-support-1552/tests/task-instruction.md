按ss_satisfaction的Analysis_Period自然日期含首尾累加event权重，未配置事件记0，enterprise仅以ws_plans完整邮箱判定；Satisfied Min和Dissatisfied Max都含等号。非neutral追加对应tag，satisfied给客户邮箱IM感谢并含Batch_Reference/姓名/公司/score；dissatisfied只创建tasks(subject含Batch_Reference、姓名、公司/description含score及分类/status=Not Started/source_customer_id)，不发客户IM；neutral不改tags、不触达。源未提供结果sheet，公开用satisfaction_results(batch_reference/customer_id/email/company/score数字/classification/customer_type/analysis_period)为全部客户登记结果，保留原events。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_satisfaction：Satisfaction Analysis；工作表 ws_weights（Signal Weights）, ws_thresholds（Score Thresholds）, ws_plans（Enterprise Customers）, ws_config（Analysis Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_98b83ca845cc：helpcrunch_customers（来源实体 helpcrunch_customers）
- tbl_541a32577a57：satisfaction_results（来源实体 satisfaction_results）
- tbl_085154084c74：工作事项（来源实体 tasks）
