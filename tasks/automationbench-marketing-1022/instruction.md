处理 ss_influencers/ws_list 的本轮合作名单，联系尚未触达且符合活动要求的创作者，并按活动经理特定指示处理需要重新联系或暂缓的对象。读取本轮沟通规范后逐人发送飞书私聊，保留产品名、跟踪码、平台和受众数量，金额/数量使用千分位；跟踪表 contacted 更新为 Yes。不联系无法获得有效邮箱的对象。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_influencers：Influencer Partnerships；工作表 ws_list（Target List）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-27T10:00:00Z。
