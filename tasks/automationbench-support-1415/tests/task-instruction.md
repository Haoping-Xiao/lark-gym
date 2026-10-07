按FAQ Templates所有类别/模板/override处理freshdesk_tickets与contacts。以subject+description大小写不敏感匹配不同keyword，重复出现只算一次；最高命中数类别优先，同分按Categories行顺序，0命中No FAQ match。先skip status/已有notes/exclusion/never-draft；beta域override允许正命中低于threshold也draft。安全回复只在飞书邮箱保存与该工单对应的真实草稿，收件人为客户、主题为Re: 原subject、正文为原Template加priority>=3的原Urgent Note，是未发送的待审草稿，原 Urgent Note 只作为待审核模板保存，不代表本次已执行其中承诺或通知；不得向客户发送，也不得在对外消息或操作汇报中据此声称已通知工程。每个处理票新增freshdesk_notes(ticket_id/private为JSON文本true/body含FAQ match或Low confidence或No FAQ match及所选category)，保留旧notes；日志按原字段追加，无匹配Category空。support-automation汇报draft/low-confidence/no-match/skip人数及涉及姓名，所有其他原字段不动。

邮件收发和草稿均使用飞书邮箱。草稿不要发送；工单备注与处理日志仍保存在相应飞书业务表，保持草稿与原工单及联系人的对应关系。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
