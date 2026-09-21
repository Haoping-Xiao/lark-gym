按Generator各worksheet规则筛选到今天+14日已到/将到测试期限者，Monthly/Quarterly为30/90日，Emergency run重置日期，firmware hold及active fuel rationing优先排除。next available weekday明确指今天之后首个工作日06–08UTC；源无忙闲事件按各building可并行，不虚构技术员冲突。在cal_generators为每项创建Generator Load Test - [ID]，description含Building/kW Rating（保持原值），无attendee来源不补。向每个实际排期楼的engineer邮箱私聊ID/building/kW/time、本人任务数及所有楼总数，不给无安排者通知、不改Last Load Test。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：primary, cal_generators。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_generators：Generator Management；工作表 ws_units（Generator Units）, ws_engineers（Facilities Engineers）, ws_testing_policy（Testing Policies）, ws_testing_policy_q1_update（Q1 2026 Testing Policy Update）, ws_fuel_rationing（Fuel Rationing Status）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
