按ss_journey配置逐requester_id聚合Freshdesk，不按邮箱domain合并。Total包含全部状态，Open含配置status2和priority>=3的pending3，Resolved只status4；状态5不擅算resolved。按rules排除不足票数和QA域名。ws_map数值均文本，Open Rate两位小数，记录本轮旅程milestone；HubSpot既有contact仅更新lifecyclestage，无则创建email/lifecyclestage。被排除者包括既有CRM也不改。customer-success报告journey、参与人数、stage人数及逐人总/open/resolved/rate/stage，不触发无关VP testimonial表。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

飞书电子表格目录：

- ss_journey：Customer Journey；工作表 ws_rules（Lifecycle Rules）, ws_map（Journey Map）, ws_config（Journey Configuration）, ws_vp_testimonial_overrides（VP Testimonial Overrides）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
