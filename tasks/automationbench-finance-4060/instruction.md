准备给定2025供应商的1099-NEC工作底稿。本次工作底稿的纳入标准：Individual、Sole Proprietor、LLC (Single Member) 且年度付款≥600才纳入，C/S-Corporation和低于门槛者排除；tax_form_preparation 飞书台账记录 vendor、year=2025、amount数值、tax_id原文、status=Ready/Missing W-9；源中掩码税号视为已提供，不尝试补全。W-9或税号缺失者向供应商邮件索取，tax@company.example.com 收全部在范围项 Vendor | 原金额 | 状态摘要。只是底稿，不提交税表。

来信读取及向邮箱地址发送通知均使用飞书邮件；手机号及员工账号对应的通知使用已提供的飞书私聊，群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-01-20T09:00:00Z 为时间基准。
