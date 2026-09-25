检查HubSpot联系人及Outreach Policy，本适配将未明确的stale定义为last_email_days_ago>=30，缺该字段不可判定。仅Lead、无opt-out、非受限行业；由agent自己撰写个性化飞书私聊（替代ChatGPT+邮件），首行作为主题，须包含公司名，可带其他相关主题文字；正文firstname、company、industry及跟进意向，不虚构产品承诺。联系人表的id是原业务联系人标识，record_id是本环境的记录定位标识；engagements.contact_id填写联系人表的id。发送后创建engagements(contact_id/type=EMAIL/body含行业及跟进事实)，type仅保留原邮件业务类型，实际发送渠道是飞书IM，不直接改last_email_days_ago。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
