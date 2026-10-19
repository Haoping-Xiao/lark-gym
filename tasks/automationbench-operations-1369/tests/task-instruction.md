审计 chemical inventory，先查 audit policies 及供应商邮件。标记 SDS Expiry Date 早于 2026-02-09 的化学品及同一 Storage Location 内 A、B Compatibility Group 共存问题；排除 In Transit、Pending Disposal。为每个被标记化学品在 SAFETY 创建安全工单，包含名称、问题类型、位置，SDS 过期时 summary 含逾期天数。向 ehs.manager@company.example.com 汇总且正文仅含被标记化学品，不提 In Transit、Pending Disposal 或 de minimis 排除项；向 safety-critical 通知存储不兼容问题。Jira 适配为 jira_issues（project、issuetype、chemical、location、summary），同名库存行用来源行号区分。引用来源值时原样保留，不改写或取整。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
