今天为 2026-02-09，检查 ss_training 技能矩阵与角色必需技能，忽略 optional/nice-to-have，跳过已有培训安排者。为缺少必需技能的员工在 Training 项目创建任务，并邮件培训计划列明待学习技能及缺失技能总数。Asana 适配为 asana_tasks（project、name、email、missing_skills JSON 数组、missing_count），源未提供项目 ID 时用逻辑名称 Training。

来信读取及向邮箱地址发送通知均使用飞书邮件；群通知仍使用飞书消息。来源邮件编号保留在 Message-ID（smtp_message_id）的 @ 前缀中。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
