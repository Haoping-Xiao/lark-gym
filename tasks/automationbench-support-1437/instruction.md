将freshdesk status=2/3迁移reamaze业务台账；排除表Action=Excluded才阻断，Pending/Information不等于排除（源迁移断言也要求Pending迁移），Never staging优先于critical-path，后者覆盖排除tag。每位新contact写reamaze_contacts(name/email/external_id=email:<email>)，conversation保留subject/body原description/contact_email/status=unresolved/category按表/external_id=freshdesk:<源id>。源无tracking表补migration_log(source_ticket_id/target_external_id/status=Migrated)；并新增freshdesk_notes(ticket_id/private=true文本/body含Re:amaze及target_external_id)。不改原ticket状态。support-migration邮箱IM发migration报告含实际迁移数/subject/name，Information标签不禁止报告。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
