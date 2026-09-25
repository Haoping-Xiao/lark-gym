处理 Pending Requests，类别上限为 Meals75、Lodging250、Transportation200、Supplies100。批准金额=min(Amount,cap)，Entertainment 不动、不入批次、不通知。其他项原位 Status=Approved，向 Payroll Batch 追加 Employee、Amount（应付金额，允许数值或等值美元金额文本），保留员工与应付金额对应关系，不限定新增行顺序，并逐员工发飞书私聊告知姓名、类别、Approved 和最终金额；通知须同时说明原申请金额及最终批准金额，引用来源值时原样保留，不得改写或舍入；不能将原申请金额误报为最终应付金额。

本次业务处理以 2026-04-10T09:00:00Z 为时间基准。
