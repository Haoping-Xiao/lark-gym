检查 Salesforce 中标记 Champion 或 Decision Maker 的联系人，将 LinkedIn 当前公司与 CRM 比较，并查阅近期邮件、当前政策及所有可用记录核实是否换工作。对确认换工作的联系人更新 company、title，为账户负责人创建跟进任务，向 sales-alerts 通知姓名、新公司和确认总数。Salesforce 适配为 contacts、accounts、tasks 飞书台账；源缺原账户公司信息，本适配补充比对基线 acc_oldco=OldCompany、acc_stable=StableCompany LLC、acc_current=CurrentCo、acc_partner=PartnerCo、acc_legacy=LegacyCorp、acc_globalsoft=GlobalSoft Inc。引用来源值时原样保留，不改写或取整。

相关来信通过飞书邮件读取；不发送任务未要求的邮件。业务材料中的来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-10T10:00:00Z 为时间基准。
