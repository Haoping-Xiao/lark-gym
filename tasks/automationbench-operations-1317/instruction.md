读ABM Config和blocklist，只选Tier1且超过inactivity threshold、无partnership/legal hold的账户，CRM联系人需VP以上且用LinkedIn近期帖子个性化。LinkedIn发送改linkedin_invitations(profile_url/message/status=Pending)业务请求，不实际联网；正文包含姓名、公司及原帖子主题和百分比，不虚构合作。每账户AE创建tasks(owner_id/what_id/subject=ABM Touch - <Account Name>)；ss_abm_tracker/ws_outreach每联系人追加Account/Contact/Profile/Status=Pending。abm-team通知实际账户、联系人和主题，不列被阻断名单。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_abm_config：ABM Config；工作表 ws_outreach_policy（Outreach Policy）, ws_account_blocklist（Account Blocklist）
- ss_abm_tracker：ABM Tracker；工作表 ws_outreach（Outreach）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-28T12:00:00Z。
