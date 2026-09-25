按ss_audit检查所有人工reply线程；created_by含bot（不区分大小写）或显式自动回复标记则排除，customer/note与无回复会话不评。字数按字符数含空白；问候/结尾按配置词或词组整词匹配（不区分大小写），不能把this中的hi误算问候。逐回复逐失败Criterion在ws_log写Conversation ID/Violation Type=Criterion原名/Agent=created_by；问题会话追加quality-issue，其他字段原样。quality@ourcompany.example.com邮箱IM报告audit、人工回复总数/问题会话数/违规数、逐会话ID/subject/失败标准。

本次业务处理以 2026-02-24T09:00:00Z 为时间基准。
