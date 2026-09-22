今天2026-02-20，检查下周2026-02-23至03-01的团队容量。查Rep Skills的Capacity Limits，只计客户有效会议；本题超限按created_at从晚到早取消最少场次直到每项限额满足，内部会议不计也不取消，不自动转派。对取消的calendly_scheduled_events改status=cancelled、cancellation_reason含capacity，并同步对应invitee status=cancelled。私聊所有受影响客户与host，capacity-alerts汇总变更前后每位rep的Discovery/Demo/Total数，取消数量使用Cancelled: <N> meeting(s)。

本次业务处理以 2026-02-20T10:00:00Z 为时间基准。
