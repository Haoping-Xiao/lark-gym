按ss_capacity分析Open负载，agent Max_Tickets用数量判断，优先移动较低优先级票（Low、Medium、High；同级ID数字升序），仅在同Department内转给有空余capacity者，最少移动到个人不超限。部门按Priority_Weight加权负载对Max_Dept_Load判断，转移不改变部门总负载，不把部门过载当已解决。每移动票新增zoho_desk_comments(ticket_id/content含redistributed及原新Agent_ID/is_public=false文本)，不改priority/department。ws_report为运行前快照：Overloaded_Agents用roster IDs逗号拼接，无则空串；Status=Overloaded/Within capacity。邮件目的地原题缺失，本题显式使用测试邮箱capacity@support.example.com的IM；它与capacity-planning报告含capacity、各部门数量/人数/加权负载、原过载者及转移后人数。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_capacity：Capacity Planning；工作表 ws_roster（Agent Roster）, ws_benchmarks（Benchmarks）, ws_report（Capacity Report）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
