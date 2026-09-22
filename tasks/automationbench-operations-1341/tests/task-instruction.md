采购三方匹配按PO Number，仅PO Date>=2026-01-01且无hold。Qty Received!=Qty Ordered则差异，Partial - Expected仅豁免数量差；Invoice Amount!=Qty Ordered*Unit Price仍检查。每一种差异独立创建monday_items(board=Procurement Issues/name=<PO> <Quantity或Amount> mismatch/description完整expected/actual/difference)，同PO两个差异两条而非混成一条。私聊procurement@supplychainco.com首行mismatch、列全部差异，不改原PO/receipt/invoice，不付款。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
