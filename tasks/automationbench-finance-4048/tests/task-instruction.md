今天2026-02-12。依Vendor Credit Application Policy与授权时效更新处理供应商credit，并核对Notes。最旧bill按Due Date排序；本轮不能改采购独占的Vendor Info评级，虽然原请求提出了评级更新。写credit_applications台账credit_number、bill_number、vendor、amount数值；Open Credits新增Remaining Credit，成功项Status=Applied，待确认项Status=Needs Verification且不改Amount；Open Bills新增Remaining Balance，不覆盖原Amount，有应用但未结清写Partially Paid。每个成功供应商只发一条私聊列credit、bill、原额度、应用金额和全批总计Total credits applied: $X。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_vendor_credits：Vendor Credits & Bills；工作表 ws_credits（Open Credits）, ws_open_bills（Open Bills）, ws_vendor_info（Vendor Info）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-12T10:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_cf60bfdface5：credit_applications（来源实体 credit_applications）
