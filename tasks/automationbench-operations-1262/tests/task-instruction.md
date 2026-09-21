处理Jan27–Feb2到期、Active且NDA Signed=Yes的合同中End Date最早者，同日Security Clearance High>Standard>None。DocuSign替换signature_requests(template_id/template_name/signer_email/cc_emails JSON数组/status=Sent)，向本人发签署请求，HR/Legal分别私聊抄送。创建trello_cards(board=brd_hr/list=Offboarding/name=Offboard: <Name>)和notion_pages(parent_page=pg_offboarding/title=Offboarding: <Name>/content)。通知hr-ops及源Manager ID对应用户，正文和页面保留End Date、Security Clearance、Equipment List。只是开始offboarding，不终止账号或声称签署完成。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_contractors：Contractors；工作表 ws_active（Active）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-01-29T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_67e8f5b89016：docusign_templates（来源实体 docusign_templates）
- tbl_281832285f98：成员资料（来源实体 lookup_users）
- tbl_73488a54c9a2：notion_pages（来源实体 notion_pages）
- tbl_b7e9da2f823c：signature_requests（来源实体 signature_requests）
- tbl_f242d5ad9e59：trello_cards（来源实体 trello_cards）
