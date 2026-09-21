现在是 2026-01-27 20:00 UTC。按社媒负责人及 social-ops 群最新规则，为 ss_social/ws_posts 中就绪内容排期，组织 org_001。读取 buffer_channels，在 buffer_posts 飞书台账创建 organization_id、channel_id、text、scheduled_at、status=scheduled。保留源日期，默认 09:00 UTC。保留原文；追加标签固定顺序为：功能 hashtag、适用合规标签、适用思想领导标签、Twitter UTM、平台 SCH 码，最后批次码，各段一个空格。不需要的项省略；相同平台的配额按源表顺序选择，不能给禁发内容另换日期规避政策。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_social：Social Content；工作表 ws_posts（Posts）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-27T20:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_96ab8ceaf5e3：buffer_channels（来源实体 buffer_channels）
- tbl_761f835dd168：buffer_posts（来源实体 buffer_posts）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
