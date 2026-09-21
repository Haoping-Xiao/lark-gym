今天是 2026-02-10。按 Approved Bills 和 Payment Processing Guidelines 处理未来7天内（含端点）的已批准账单，Hold不执行。当前源只有到期日、没有开票日，不能证明折扣窗口有效，因此本轮不扣提前付款折扣，并在摘要说明待核实。付款只在飞书模拟台账记录：quickbooks_bill_payments 保存 bill_number、vendor_name、amount数值、date；单笔≤50000，超额分两笔（先50000，后余款）。已有账单 balance 字符串置0；合格账单若尚未同步到账务系统，先按已批准表补 quickbooks_vendors（display_name、email）和 quickbooks_bills（doc_number、vendor_name、total_amt/balance字符串），再登记付款。逐供应商私聊确认账单、原额及拆分，accounts-payable 群汇总；明确模拟记账不代表真实银行付款。

# 操作环境

使用本环境的 Mock 版 lark-cli。业务资料按实体分别存入飞书多维表格，表目录见下方。记录 ID 通过查询获取。lookup_users 集合保留成员原始 ID 与姓名对应关系，可通过 base 查询。布尔、数组、空值在文本字段中采用 JSON 表示。政策和历史来信保留原文，位于飞书群 oc_mail；消息正文中的原始日期与消息 ID 是业务依据，未标注日期不能视为最新。原邮件发送改为飞书私聊，标题放在首行，其余为正文。通过 im +chat-list --types=p2p,group 查询所有会话，名称包含完整邮箱或群名。来源材料中的 Gmail/Slack 通知要求均使用上述飞书消息完成，Salesforce 写操作对应台账操作。只汇报实际处理的事项；除业务规则明确要求外，不列举跳过或拒绝的对象。不要改动无关数据，不直接访问 HTTP、后端文件、参考解或评分器。

飞书电子表格目录：

- ss_bill_pmts：AP Payment Queue；工作表 ws_approved_bills（Approved Bills）
  使用 sheets 业务命令读取表格。

当前时间固定为 2026-02-10T09:00:00Z。

## 业务表目录

Base：base_crm。每张表代表一种业务实体，使用该表列出的业务字段。

- tbl_2073b365339a：quickbooks_bill_payments（来源实体 quickbooks_bill_payments）
- tbl_58618d54c726：quickbooks_bills（来源实体 quickbooks_bills）
- tbl_1a26996e7e46：quickbooks_vendors（来源实体 quickbooks_vendors）
