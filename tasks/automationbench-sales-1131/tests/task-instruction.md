请按 lead-processing 中的分类计分和路由政策，处理本批带 Inbound 标签的未读询盘。根据来信判断 intent、urgency、budget_signal、company_size 并计算得分，在销售线索台账创建记录，保留联系人签名中的邮箱、姓名、公司、title（缺失留空）、status、score 和四项分类，通知相应频道。每封邮件成功处理后，将邮件台账中的 is_read 更新为 true。最后在 lead-processing 汇报 processed 总数及 hot、warm、cold 数量。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
