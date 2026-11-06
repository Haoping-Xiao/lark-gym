# 首轮 7 题评分挑战标签

按 Oliver 0880bc8b 的 review 调整。每类别 1 题，人工选取，不是随机抽样。每项从完整合法轨迹变异，通过真实 CLI 写入 Mock；不直接修改导出状态。
共 35 个用例，每例 3 次；程序先拒绝时不调用裁判。裁判为 DeepSeek-V4-Pro，错误、翻转及费用单列。不能据此推断 800 题总体误判率。

## automationbench-finance-4001

依最新 AP 政策登记两张合格账单，阻止受限供应商，向 AP lead 报告实际合计。
seed.mail.messages 中 Updated AP Processing Guidelines 及 Threshold Change for February；ws_pending 初始仅表头。
来源：`tasks/automationbench-finance-4001/instruction.md`、`environment/seed.json`、`tests/expected.json`（文件 hash 见 labels.json）。

| 变异         | 预期 | 具体变化及依据                                                                                                                                                                                                                                           |
| ------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| noop         | fail | 不进行任何调用。 未登记账单，也未发送要求的摘要。                                                                                                                                                                                                        |
| negation     | fail | 保留正确登记及原始数字，把 AP lead 摘要写成“本批账单均未登记；以下仅为旧方案”，后附原金额和单号。 摘要必须报告实际完成，否认登记与台账矛盾。                                                                                                             |
| wrong-object | fail | 正确登记后，把应发给 ap-lead@company.example.com 的摘要改发 ar@shadowpeak.example.com，其余不变。 摘要错投供应商，不满足指定收件人。                                                                                                                     |
| partial      | fail | 登记 Acme Supplies LLC 的 ACM-2026-0412，遗漏 Global Logistics Inc. 的 GL-88210，其余通知保持参考流程。 漏掉合格账单；ws_pending 初态为空，不能借已有状态满足。                                                                                          |
| paraphrase   | pass | 将 AP lead 摘要由逐行列表改为中文段落，先说明 Global Logistics Inc. 的 GL-88210/$11,340.50 及 REVIEW - over threshold，再说明 Acme Supplies LLC 的 ACM-2026-0412/$4,750.00，保留 Logged total: $16,090.50。 题面允许解释措辞变化；原始值及总计格式不动。 |

## automationbench-hr-5008

只新增已批准 REQ-2026-042 职位并群公告，保存 careers-list 邮件草稿而不发送。
seed.spreadsheets 中 ws_approved 中 Staff Product Designer 为 Approved，Junior QA Analyst 为 Draft。
来源：`tasks/automationbench-hr-5008/instruction.md`、`environment/seed.json`、`tests/expected.json`（文件 hash 见 labels.json）。

| 变异         | 预期 | 具体变化及依据                                                                                                                                                                                                                                                                          |
| ------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| noop         | fail | 不进行任何调用。 未创建职位、公告或草稿。                                                                                                                                                                                                                                               |
| negation     | fail | 保留正确职位和草稿，将 job-openings 公告改成“该职位招聘已经取消，不接受申请”，同时保留职位原文。 公告否定已批准职位开放。                                                                                                                                                               |
| wrong-object | fail | 将新职位 req_id 改成 REQ-2026-043 并使用该 Draft 行的字段。 未批准需求不得发布。                                                                                                                                                                                                        |
| partial      | fail | 职位和群公告正确，但完全不保存 careers-list 邮件草稿。 漏掉明确要求的草稿交付物。                                                                                                                                                                                                       |
| paraphrase   | pass | 将群公告整段重写为先团队及负责人、后职位条件的中文说明：Design 团队正在招聘 Staff Product Designer，由 Maria Santos 负责招聘。该岗位位于 San Francisco，工作类型为 Full-time，薪资范围为 $160,000 - $200,000。此次开放对应已批准需求，欢迎申请。 没有要求公告固定句式；不翻译原始字段。 |

## automationbench-marketing-1003

为可处理的社媒提及提交 Queued 建议，投诉只升级，不能声称已外发。
seed.mail.messages 的 Social Engagement SOP：positive like，questions reply，complaints 不公开回复而升级；neutral/competitor/retweet 跳过。
来源：`tasks/automationbench-marketing-1003/instruction.md`、`environment/seed.json`、`tests/expected.json`（文件 hash 见 labels.json）。

| 变异         | 预期 | 具体变化及依据                                                                                                                                                                |
| ------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| noop         | fail | 不进行任何调用。 存在应处理的提及，未提交建议也未升级投诉。                                                                                                                   |
| negation     | fail | 保持建议 status=Queued，却在汇报说“已在外部平台点赞并发布全部回复”。 题面明确未实际外发，汇报虚构执行事实。                                                                   |
| wrong-object | fail | 将原本对 tw_90a1 的点赞建议改为投诉 tw_90a3，其他步骤不变。 SOP 禁止点赞投诉。                                                                                                |
| partial      | fail | 提交所有应有建议，但不发送针对 DevOpsDaily 故障投诉的 support-alerts 升级。 遗漏投诉升级。                                                                                    |
| paraphrase   | pass | 将 tw_90a2 回复改成“关于 Salesforce 集成，请说明拟同步的对象与流程，我们会先核实适用方案再跟进。”，保留 Queued，不增加能力承诺。 仍回应具体问题并先核实未知能力；未实际发布。 |

## automationbench-operations-1204

选出 Badge Readers - HQ 事件，建问题及 Docs，先通知 ops 团队再记录 notified。
seed 的 incidents 及 ws_escalation_rules：排除 duplicate/vendor investigating，按 Critical、Severity、Reported 选取。
来源：`tasks/automationbench-operations-1204/instruction.md`、`environment/seed.json`、`tests/expected.json`（文件 hash 见 labels.json）。

| 变异         | 预期 | 具体变化及依据                                                                                                                                                                           |
| ------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| noop         | fail | 不进行任何调用。 存在可升级事件但没有问题、文档或通知。                                                                                                                                  |
| negation     | fail | 保留实际邮件发送，把 jira_comments 的文本改为“ops team not notified ／ Badge readers offline - HQ”。 虽然含 notified 子串，但否认已完成的必需通知事实。                                  |
| wrong-object | fail | 把问题 external_id 从 incident:Badge Readers - HQ 改为 incident:Unrelated Location，其他字段保留。 问题引用必须对应选中的事件地点。                                                      |
| partial      | fail | 问题、邮件和评论都完成，但不创建 SP_OPS 下的 Docs 文档。 缺少明确要求的原生文档。                                                                                                        |
| paraphrase   | pass | 只把评论引导语改为“ops team successfully notified ／ Badge readers offline - HQ”，保持先邮件后评论，Docs 保持源 Summary 原文。 评论事实和 required notified 均保持，不改变文档字面要求。 |

## automationbench-sales-10

为正确 Amanda Foster 联系人整理完整纪要，按模板和公式记录事实及评分。
seed 工作表 ws_disc_sections_001 指定章节及标题格式；对应完整邮件线程和评分公式是依据。
来源：`tasks/automationbench-sales-10/instruction.md`、`environment/seed.json`、`tests/expected.json`（文件 hash 见 labels.json）。

| 变异         | 预期 | 具体变化及依据                                                                                                                                                                                                                                               |
| ------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| noop         | fail | 不进行任何调用。 没有创建所需 notes 纪要。                                                                                                                                                                                                                   |
| negation     | fail | 纪要保留所有参考术语及数字，但在正文声明“下列需求和预算已全部撤回，不是客户事实”。 否定来源事实，不能以包含术语认定完成。                                                                                                                                    |
| wrong-object | fail | 将 notes.parent_id 从 003xx000004AFT1 改成同名干扰联系人 003xx000004AFT9。 题面要求正确联系人及对应线程，禁止混入同名对象。                                                                                                                                  |
| partial      | fail | 正确纪要中删除整个 Deal Score 章节，保留其余章节。 明确要求按公式计算评分，遗漏必需内容。                                                                                                                                                                    |
| paraphrase   | pass | 只将 Pain Points 段改为：Pain Points: 部门之间存在数据孤岛，人工制作报表需要 2 days，并且缺少实时仪表盘。其他章节逐字不动。 模板允许 List as prose；保留数字 2 days，不改公司、竞品、Budget/Timeline/Decision maker 等固定章节。Oliver 0880bc8b 批准此约束。 |

## automationbench-support-1405

对有效订单逐票回复，取消订单仅依退款资格说明，写日志并汇总。
seed.sheets.ws_refund_policy：ORD-4523=Yes，ORD-4527=No；题面规定 Action Taken 和小写状态。
来源：`tasks/automationbench-support-1405/instruction.md`、`environment/seed.json`、`tests/expected.json`（文件 hash 见 labels.json）。

| 变异         | 预期 | 具体变化及依据                                                                                                                                                  |
| ------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| noop         | fail | 不进行任何调用。 未回复、登记或汇总已匹配订单。                                                                                                                 |
| negation     | fail | 将 g_103/ORD-4523 回复改成“不符合退款资格”，保留该订单号和取消时间。 与退款政策 Yes 明确矛盾。                                                                  |
| wrong-object | fail | 将 g_101 的回复关联 ticket_id 改为应跳过的 g_104，其余保持。 通知错关联工单，同时遗漏原工单回复。                                                               |
| partial      | fail | 回复正确，但省略所有 ws_order_log 写入。 缺少成功查到订单的日志。                                                                                               |
| paraphrase   | pass | 只改回复连接语为“订单信息如下”，保留订单号、tracking、日期、姓名、资格及所有来源原值；不改 Action Taken 和小写汇总状态。 不改变事实或字面值，题面未限制连接语。 |

## automationbench-simple-3151

读取 support 邮箱账单来信，新建 invoice 工单并忠实概括重复扣费问题。
seed.mail.messages[msg_3151]：Alex 的 March subscription 被扣两次，Invoice #INV-2026-031。
来源：`tasks/automationbench-simple-3151/instruction.md`、`environment/seed.json`、`tests/expected.json`（文件 hash 见 labels.json）。

| 变异         | 预期 | 具体变化及依据                                                                                                                                                                          |
| ------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| noop         | fail | 不进行任何调用。 没有新建工单。                                                                                                                                                         |
| negation     | fail | subject 保留 invoice，description 写“客户确认没有被重复扣款，账单无问题，无需处理”。 与来信重复扣费事实相反。                                                                           |
| wrong-object | fail | description 改为“另一位客户询问密码重置”，subject 仍含 invoice。 记错请求及问题对象。                                                                                                   |
| partial      | fail | 新建 invoice 工单但 description 仅写“客户有问题”，不记重复扣费或账单问题。 description 未忠实记录核心账单问题。                                                                         |
| paraphrase   | pass | subject 为 Invoice 账单问题，description 为“Alex 反馈 March subscription 被重复扣费，涉及 Invoice #INV-2026-031，请求协助核查处理。”。 题面明确允许概括；保留核心事实、对象和账单引用。 |
