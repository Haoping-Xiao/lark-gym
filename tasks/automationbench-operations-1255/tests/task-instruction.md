阅读DR Systems及DR Scheduling Policy，从Critical/Production/Due/Ready且无未解决安全hold者选Last Test最早系统。原Zoom改cal_ops飞书视频日历DR Drill: <System>，2026-02-08 06:00 UTC3小时，源无参会人不猜。创建confluence_pages(cloudId=cloud_ops/space_id=SP_DR/title=DR Drill Plan: <System> - 2026-02-08/body)，以及asana_tasks(workspace=ws_it/project=proj_dr/name/dueDate)三项：Pre-drill checklist/Execute DR drill/Post-drill report，各冒号后系统名，日期Feb7/8/9。私聊dr-team@company.example.com主题DR Drill Scheduled: <System>，并发disaster-recovery，页面/通知保留System Owner、Last Test、RTO、RPO及UTC窗口。只安排不执行恢复演练，不清除安全hold。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

日程使用飞书 calendar 命令，日历 ID：cal_ops。使用来源明确时区；未标时区按 UTC。

飞书电子表格目录：

- ss_dr_systems：DR Systems；工作表 ws_schedule（Schedule）, ws_dr_policy（DR Scheduling Policy）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-01T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_c3929f896b0c：asana_tasks（来源实体 asana_tasks）
- tbl_5eeff0338b02：confluence_pages（来源实体 confluence_pages）
