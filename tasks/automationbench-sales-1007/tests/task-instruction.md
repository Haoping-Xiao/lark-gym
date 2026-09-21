查看Discovery Call - Acme Corp对应记录的summary和录制元数据，提取行动项，按现有用户目录逐位user_id私聊跟进，更新对应机会description并向deals-acme总结动作数、负责人和相关金额。summary是本题提供的转录替代材料，不下载或虚构音视频分析；Friday按原会议语境保留，不擅自声称任务完成或改stage。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_bc62a3c14fec：客户公司（来源实体 accounts）
- tbl_aa5af4084f37：联系人（来源实体 contacts）
- tbl_aef450dc78ea：销售线索（来源实体 leads）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
- tbl_9be34f3e549c：商机（来源实体 opportunities）
- tbl_9e393fa84b45：zoom_meetings（来源实体 zoom_meetings）
- tbl_cb83df2ddf94：zoom_recordings（来源实体 zoom_recordings）
- tbl_c1431742db67：zoom_users（来源实体 zoom_users）
