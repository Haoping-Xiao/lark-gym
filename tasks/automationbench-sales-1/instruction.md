处理 HR 发来的电话号码更新。查找 hr-updates@company.example.com 发布的最新 VERIFIED 批次（按批次编号排序，排除草稿），逐个完整邮箱匹配 CRM contacts。对同一联系人采用未取消记录中最新生效日期的号码，日期相同则 P1 优先于 P2/P3；美国日期按月/日/年解释。号码规范为 XXX-XXX-XXXX。仅更新存在且唯一匹配的联系人，为每项实际更新创建 notes，parent_id 指向原联系人 ID、title 为 Phone Update Applied，正文说明新号码和来源。

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 为 rec_ 加原业务 ID。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

当前时间固定为 2026-02-24T09:00:00Z。
