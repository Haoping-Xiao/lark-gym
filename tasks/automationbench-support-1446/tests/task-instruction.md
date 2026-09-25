按ss_migration配置将reamaze_conversations的unresolved/pending迁移intercom_tickets，其余状态不迁移且标题URGENT/CRITICAL不覆盖；skip-migration邮箱完全排除。按email去重contact复用，新增intercom_contacts(name/email/role=user/external_id=email:<email>/tags JSON)，已存在仅追加migrated-from-reamaze；vip override另加vip。每个合格源会话新ticket(title原subject/body按messages原body换行串接/contact_email/state按category表/external_id=reamaze:<id>)。同人不同票都保留，不关闭来源。platform-migration群汇报迁移票、创建/复用contact计数和实际subject/name。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
