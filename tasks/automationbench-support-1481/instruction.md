处理ss_gdpr待处理请求，先查ws_legal_hold。非hold存在用户：其工单subject完整替换为Anonymization_Subject_Prefix，不保留旧标题，description/requester_id清空、comments清空JSON数组，保留非隐私业务状态并追加gdpr-purged；然后通过base +record-delete --yes实际删除该support_users记录，不以deleted标记代替。hold不得改用户/工单，缺失用户不伪造。每请求更新Status及追加ws_compliance_log，Action/Status取Purged、Legal Hold或Account Not Found，Date=2026-02-14。privacy-ops含Batch_Reference、<N> purged（用户数）、匿名工单数、legal hold数、account not found数及请求ID/涉及姓名或未找到邮箱。合规日志按原要求保留请求邮箱；只删除Mock业务实体，不声称清除运行审计/备份。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_gdpr：GDPR Processing；工作表 ws_requests（Erasure Requests）, ws_legal_hold（Legal Hold）, ws_compliance_log（Compliance Log）, ws_config（Report Config）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-14T09:00:00Z。
