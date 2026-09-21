请安排 2026-03-12 15:00 UTC 开始、持续 2 小时的 Customer Training Session 飞书视频会议。启用报名流程：在多维表格报名台账创建 registration 记录，name 为会议名称，registration_enabled 为 true（文本）；会议入会范围设为仅日程参与者，后续报名通过后再添加参会人。使用工作日历 cal_primary，当前主持账号为 agent@company.example.com。

# 操作环境

使用 Mock 版 lark-cli 的 calendar 业务命令完成任务。参会人通过邮箱邀请；未指定时长的会议默认 60 分钟。全天日程的结束日期为不包含的下一天。不要创建重复日程，不修改其他业务数据；不得直接访问 HTTP、后端文件、参考解或评分器。

业务台账按实体分表，使用下方目录定位对应业务表。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_29c9c30e0604：registration（来源实体 registration）
