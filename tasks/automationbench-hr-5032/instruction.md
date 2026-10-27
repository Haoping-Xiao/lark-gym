处理Employee Directory中的Pending Changes：新增员工向Active Employees追加完整字段，Title Change只改Title，Termination将Active Employees对应行所有字段清空（保留物理行号，替代删除）。不改Pending Changes来源，不动无关员工。向hr-general发一条汇总，列每项姓名和变化、处理项数及更新后的有效员工数；空行不算有效员工。

本次业务处理以 2026-03-15T09:00:00Z 为时间基准。
