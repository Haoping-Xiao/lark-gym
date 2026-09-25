固定2026-02-07，按ss_csat各规则处理未Processed的有效评分，票不存在/评分非数字/已处理不动。七天冷却按运行前已发CSAT记录判断，整位客户全部跳过；本批同人多票分别做工单动作、合并一条客户IM，不让本批首条通知阻止后续票。VIP以精确邮箱区分：个人电话接管者跳过全部自动动作，明确Email-only者仅免消息仍可记注/调优先级。低分priority按规则，低/中分新增freshdesk_notes(ticket_id/body含CSAT分数及原反馈/private=true文本)，中分补改善计划不升级；高分请求testimonial，VP例外改个人感谢并注明VP Email和Custom Subject，不能再发testimonial。处理成功行Processed=Yes，跳过行保留No。邮件改邮箱IM；摘要只列处理数Low/Medium/High，不写Skipped或被跳过客户。

本次业务处理以 2026-02-07T09:00:00Z 为时间基准。
