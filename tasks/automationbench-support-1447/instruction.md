按 ss_categories/ws_keyword_rules、ws_department_routing 为 Zoho Desk 工单分类并分到正确部门，每个已处理票加内部注释注明 category，无匹配时写 unclassified；通知部门负责人并向 support-ops 汇总。使用 zoho_desk_tickets、zoho_desk_comments（ticket_id、is_public=false、content），部门字段使用逻辑部门名称；Gmail 适配为飞书邮箱。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
