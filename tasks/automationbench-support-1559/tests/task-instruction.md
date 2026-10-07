按ss_coaching配置逐roster agent统计closed/全部会话；status非active、tenure低于New_Agent_Tenure_Days、Notes含coaching-exempt、样本不足Min_Conversations先排除。未舍入resolution rate低于阈值者才记录ws_recommendations并通过 agent@company.example.com 原生邮箱向其 Manager Email 发邮件，所有显示rate四舍五入为整数百分比（带%），ws_recommendations沿用原三列，仅登记待指导人员姓名、整数百分比和总会话数，不新增建议列；经理邮件包含姓名/closed数/总数、整数百分比和具体指导建议。不发agent本人，不通知合格者或排除者，也不修改会话。只汇报实际处理事项，不列举或解释跳过、排除、豁免的对象。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
