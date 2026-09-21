准备给定2025供应商的1099-NEC工作底稿。本模拟规则：Individual、Sole Proprietor、LLC (Single Member) 且年度付款≥600才纳入，C/S-Corporation和低于门槛者排除；这组规则仅为本题定义。tax_form_preparation 飞书台账记录 vendor、year=2025、amount数值、tax_id原文、status=Ready/Missing W-9；源中掩码税号视为已提供，不尝试补全。W-9或税号缺失者向供应商私聊索取，tax@company.example.com 收全部在范围项 Vendor | 原金额 | 状态摘要。只是底稿，不提交税表。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_1099：1099 Preparation；工作表 ws_vendor_payments_1099（2025 Vendor Payments）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-20T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_b202d08b20ae：tax_form_preparation（来源实体 tax_form_preparation）
