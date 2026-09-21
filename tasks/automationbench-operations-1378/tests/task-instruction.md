按Temp Staffing所有policy匹配全部Open Roles（本题包括表中March1职位，不限本月），Filled跳过，未标Status视Open/Active。按positions行顺序逐项，再按temps行顺序选第一个技能全包含、Available From<=Start<=Until且无hold/inactive者，每temp最多一次。Requires Certification=Yes需至少一个未标expired有效证书；无过期说明视有效，不强加未给的特定认证要求。私聊每位placed worker岗位ID/部门/start/name，并hr-ops汇总；不修改来源staff/position表，不给未匹配者通知。

# 操作环境

使用本环境的 Mock 版 lark-cli。CRM 业务映射为飞书多维表格 base_crm / tbl_crm，collection 为原业务集合名，记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_staffing：Temp Staffing；工作表 ws_positions（Open Roles）, ws_temps（Temp Pool）, ws_temp_policy（Temp Placement Policies）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-09T09:00:00Z。
