今天是 2026-02-10，本轮处理周明确为滚动7天2026-02-04至02-10（含端点），按收件日筛选真正的供应商发票。源只有邮件文本、没有附件或Drive文件，因此在 invoice_archive 飞书台账保存 invoice_number、file_name（YYYY-MM_VendorName_InvoiceNumber，保留Vendor空格）、source_message_id、content原邮件正文，不伪造PDF。向 Registry 按收件日、同日source id排序追加原有 Invoice/Vendor/Amount，加 Date Filed、Invoice #、Drive Link；Invoice和Invoice #同源号，Amount保留美元原文，Drive Link用lark-gym://invoice/InvoiceNumber作为台账逻辑引用。向ap-lead@company.example.com私聊按上月格式报告 Invoices filed: N, Total amount: $X 与逐发票 Vendor | Invoice | Amount | 发票日期。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_inv_registry：Invoice Registry；工作表 ws_registry（Registry）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-10T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_77a5313f0483：invoice_archive（来源实体 invoice_archive）
