今天是 2026-02-10。按 Approved Bills 和 Payment Processing Guidelines 处理未来7天内（含端点）的已批准账单，Hold不执行。当前源只有到期日、没有开票日，不能证明折扣窗口有效，因此本轮不扣提前付款折扣，并在摘要说明待核实。本次仅做付款台账登记：quickbooks_bill_payments 保存 bill_number、vendor_name、amount数值、date；单笔≤50000，超额分两笔（先50000，后余款）。已有账单 balance 字符串置0；合格账单若尚未同步到账务系统，先按已批准表补 quickbooks_vendors（display_name、email）和 quickbooks_bills（doc_number、vendor_name、total_amt/balance字符串），再登记付款。逐供应商私聊确认账单、原额及拆分，accounts-payable 群汇总；通知中明确本次为账簿登记，未向银行发起付款。

本次业务处理以 2026-02-10T09:00:00Z 为时间基准。
