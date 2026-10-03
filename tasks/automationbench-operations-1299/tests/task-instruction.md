检查Champion/Decision Maker，交叉LinkedIn和Contact Management Policy、内部邮件。源联系人关联的主要accounts缺失，本适配明确原公司映射：acc_oldco=OldCompany，acc_stable=StableCompany LLC，acc_current=CurrentCo，acc_partner=PartnerCo，acc_legacy=LegacyCorp，acc_globalsoft=GlobalSoft Inc；这是补齐的比对基线，不创建account。只有确认永久换公司者更新contacts.company和title，保留旧account_id和email避免关联到不存在账号；为原owner_id建tasks(owner_id/who_id/subject含姓名/description含新公司title)。sales-alerts报告确认姓名/新公司及N confirmed，不把借调、提前更新、更名、内部晋升作为跳槽。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T10:00:00Z 为时间基准。
