为 Data Closet 安排已批准的断电维护。当前时间固定为 2026-02-14T09:00:00Z。

先读取 Maintenance Plan（电子表格 ss_maint_plan）中所有 scheduling guidelines，然后选出可执行的 Data Closet 窗口；在 Operations 日历 cal_ops 创建一个维护日程，将安排写入多维表格 base_ops / tbl_maintenance 的 rec_200 的 Maintenance log 字段，并向 IT Operations 群 oc_it_ops 发一条文本通知。

记录和通知必须原样包含源数据中的 System、Start、End；不要改写或舍入时间。不得安排草稿、仍受限制或已失效的窗口，不得修改其他会议、其他维护记录或向其他群发通知。

使用真实 lark-cli 领域命令完成任务，通过 --help 查询参数。环境已配置连接地址。支持 Sheets 读取、Calendar 日程读写、Base 记录查询更新和 IM 消息读写。原始业务数据必须通过 CLI 获取；不得使用 raw api、HTTP 客户端、后端文件或查找参考解与评分器。若必要接口尚未支持，应报告环境缺失。
