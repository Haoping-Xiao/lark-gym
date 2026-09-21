按ss_sync_config同步support_organizations与hubspot_companies。域名精确匹配，不按相似公司名跨域合并；多个同域先精确name否则最高名称相似度，并检查全部匹配的churned。匹配org追加HubSpot ID及需要的Name mismatch；未匹配创建hubspot_companies(name/domain/external_id=zendesk:<原org id>)，空域用空字符串；新公司链接以external_id写HubSpot ID而非预测后端随机ID，所有新公司都回写org notes。RISK追加不改原其他字段。hold完全不动。crm-sync汇报matched/created/RISK计数与各组公司名，不把创建计入matched。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

HubSpot 集合对应 hubspot_ 加原集合名，记录 ID 为 rec_hubspot_ 加原 ID；properties 内属性展开为同名台账字段。

飞书电子表格目录：

- ss_sync_config：Zendesk-HubSpot Sync Rules；工作表 ws_sync_rules（Sync Rules）, ws_org_inventory（Org Inventory）, ws_overrides（Override Rules）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_3616546dc9c9：hubspot_companies（来源实体 hubspot_companies）
- tbl_7072fdc05820：support_organizations（来源实体 support_organizations）
