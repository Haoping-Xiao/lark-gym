把support_organizations同步intercom_companies，遵从ss_sync_config tag与override。全部非Hold org均同步，包括无映射tag者；只有表中映射可带入，不猜premium等价enterprise。既有company按完整name复用（来源无domain也可匹配），只追加映射tag；新company保存name/首domain/external_id=zendesk:<org id>/tags JSON数组，无映射为空。不改Zendesk来源，不新增重复公司。customer-ops汇总sync数量、created/updated及处理公司名，不提Hold者。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_sync_config：Sync Configuration；工作表 ws_tag_mapping（Tag Mapping）, ws_overrides（Override Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。
