2026-02-13，分析Open实际故障，先读工单comments排除预期行为、独立问题、例行维护和Feature Request。同组件>=2条故障视待调查cluster，不能把相似关键词直接当已证实根因。匹配14天内已解决known issue仅引用现有Jira_Reference，过期known issue要新建issues；缺失Jira项目配置不造project。新issue字段external_key=RCA-组件短名-20260213（组件短名search或email）、issuetype=Bug、summary含root cause和组件、description列全部票ID说明待调查。所有cluster票新增内部zoho_desk_comments(ticket_id/content含root cause、组件与同一引用/is_public=false文本)。ws_log每cluster一行、Affected_Tickets按数字ID升序用逗号空格拼，Jira_Issue存既有引用或external_key。工程群报告全部cluster/数量/票ID/引用，保留原票历史、不改status。

本次业务处理以 2026-02-13T12:00:00Z 为时间基准。
