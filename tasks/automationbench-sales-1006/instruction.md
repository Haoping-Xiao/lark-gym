只统计CRM stage精确为Closed Won的商机ARR，制作里程碑设计需求文档、提交社媒文案审核队列，并向飞书群公告。创建真实飞书设计需求文档：标题包含ARR与compact总数，正文用 display_amount: $X.XM 表示一位小数展示金额；linkedin_posts 多维表格保存待审核文案 text 与 status=Queued，不表示已外部发布。通知sales-wins。待审核文案及群消息都必须用完整$前缀千分位整数金额，LinkedIn加#ARRMilestone；仅设计允许compact舍入。原商机不改。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。

飞书文档使用 docs +create / +fetch / +update，指定 --doc-format markdown；文档标题和正文存于真实 Docs 对象，不以 Base 记录替代。
