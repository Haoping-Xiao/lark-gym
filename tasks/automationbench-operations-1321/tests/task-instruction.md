读Vendor Insurance Tracker底部POLICY NOTES及其他policy worksheets，Active且无hold的General Liability若coverage低于门槛或证书日期早于今天则请求更新，等于门槛不算不足。按vendor+email准确区分同名联系人。DocuSign改signature_requests(template_id/template_name/signer_email/vendor/status=Sent)并实际私聊请求；随后另私聊原因通知，包含原vendor、金额、到期日和问题，额度不足需同时写政策最低金额。不要改源coverage或谎称已收到新证书。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_vendor_ins：Vendor Insurance Tracker；工作表 ws_certs（Certificates）, ws_ins_cert_policy（Insurance Cert Hold Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_8e838d8ac54d：docusign_envelopes（来源实体 docusign_envelopes）
- tbl_67e8f5b89016：docusign_templates（来源实体 docusign_templates）
- tbl_b7e9da2f823c：signature_requests（来源实体 signature_requests）
