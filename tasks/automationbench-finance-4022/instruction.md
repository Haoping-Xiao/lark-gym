根据 vendor-requests 请求、Vendor Verification Requirements、制裁筛查表和现有 xero_contacts 飞书台账，只为通过验证且已批准的新供应商建档。新记录保存 name、email_address、tax_number、is_supplier=true（字符串）、contact_status=ACTIVE；不要设置付款条款。现有联系人无签署变更表不更新，重复/缺资料/受限请求保持静默。新建成功后在原群发来源关联确认，正文保留请求 source_message_id。

本次业务处理以 2026-02-11T10:00:00Z 为时间基准。
