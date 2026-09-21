请在飞书多维表格内容排期台账中，为 org_001 的 Twitter 渠道安排本周三上午发布客户成功案例。引用 Meridian Health 的 CTO Priya Sharma 的原话：BrightPath's automation platform cut our onboarding time by 60% and our team couldn't be happier. 先查找渠道。

# 操作环境

业务资料按实体分表，表目录见下方。字段名保留原文。只新增或更新任务要求的数据，不修改其他数据，也不发送额外消息。

使用本环境提供的 Mock 版 lark-cli，通过 base、im 等正常业务命令完成任务。可用 --help 查询命令。不要直接访问 HTTP、后端文件、参考解或评分器。所有业务数据必须通过 CLI 读取。

内容排期保存在 posts 记录中，字段为 channel_id、scheduled_at（ISO 8601）、text（文案）。channels 记录提供渠道清单。排期未注明时区时使用 UTC；上午或未指定时刻为 09:00，中午为 12:00，下午为 15:00。本题完成排期登记即可，不实际发布到第三方平台。

当前时间固定为 2026-02-24T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_61ffa9c8c703：channels（来源实体 channels）
- tbl_a44f1b975171：内容排期（来源实体 posts）
