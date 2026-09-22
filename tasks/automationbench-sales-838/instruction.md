今天2026-02-20，按Customer Health Scoring做季度体检，以最近90日已结束会议为窗口；按明确会议账户名和对应参会邮箱域匹配账户，以所有该账户参会记录的duration/会议时长取算术平均评估质量。只处理仍服务中的账户，历史保留账户不纳入。原规则可能得负分而red下限是0，本题health_score明确最低归零，再判health_status。yellow建CSM跟进task、red建urgent task并发cs-alerts；tasks关联related_to_id、owner_id为CSM、status=Not Started，red priority=High，其余Normal。VIP备注不能覆盖评分。

本次业务处理以 2026-02-20T10:00:00Z 为时间基准。
