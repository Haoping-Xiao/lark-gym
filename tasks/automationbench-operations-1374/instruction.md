处理 ss_mailroom/ws_packages，按 Name 和 Department 双字段匹配 ws_employees 获取 Floor、Phone，跳过查不到收件人的包裹。Refrigerated 或 Hazardous 包裹短信通知 tracking number 及领取指示，Standard 只路由不发短信。向 mailroom 群汇总所有已路由包裹及楼层。短信适配为电话号码 IM，路由以群内分配记录表达。引用来源值时原样保留，不改写或取整。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
