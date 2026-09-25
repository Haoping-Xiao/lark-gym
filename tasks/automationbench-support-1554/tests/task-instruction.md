源未提供当前时点，本次固定2026-02-07T09:00UTC。按ss_audit审计open/pending；每失败规则独立记录ws_findings，不是一票只记一条。must_be_recent只适用于open，距updated_at>7*24小时失败；closed不审计，不能把resolved文字标签当closed。仅记录发现，不自动分配、加tags或刷新updated_at。发ws_config report_recipient邮箱IM，含audit、失败会话数/违规项数、逐ID/subject/Rule Violated/Severity。

本次业务处理以 2026-02-07T09:00:00Z 为时间基准。
