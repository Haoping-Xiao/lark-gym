读Server Monitoring全部阈值/policy，仅Active，严格超过阈值才告警，每server按最高触发级别归类。Critical创建jira_issues(project=INFRA/issuetype=Incident/summary=Critical: <Server>/description含全部原CPU/Memory/Disk百分比)，并infra-alerts群通知；原无项目key，本适配补定INFRA。Critical和Warning全部汇总私聊policy Contact，逐行写级别和全部指标，Warning不建票不发群。不改服务器指标或执行修复。

本次业务处理以 2026-02-09T09:00:00Z 为时间基准。
