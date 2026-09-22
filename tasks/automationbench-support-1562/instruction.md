固定2026-02-10，处理open且needs-review票；ws_history标Cooldown跳过，未有历史者按当前group从Tier1起正常处理，不凭缺失历史拒绝。Active只升一级，group按现有support_groups映射；到Max_Tier不改group，追加max-tier。每处理票新增内部support_comments(ticket_id/body含escalated及目标Tier，满级则含maximum/public=false文本)，ws_log含From Tier/To Tier/Date/Notes（满级From=To）。保留ws_history为既往记录，不重写过去；无needs-review、pending、closed不动。support-escalations含Batch_Reference、所有本轮票ID与去向、升级和满级数。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
