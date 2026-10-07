查看Maintenance Queue及Scheduling Policy，选择最紧急可安排的Open项，优先级Critical>High>Medium，同级选有Due且日期最早；空Due不猜日期、不纳入当前排期。更新brd_ops的monday_find_items实体status=Scheduled/due=源日期，并向ops-updates通知Equipment和日期。这里排期是台账安排，原题未给具体时刻，不另造日历事件或通知其他群。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
