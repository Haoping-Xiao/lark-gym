检查飞书客服会话台账，依据 ss_triage_policy 中的全部分诊政策，把符合条件的缺陷报告转为飞书研发问题。完成筛选、严重性映射和优先级覆盖；为处理过的会话追加 triaged 标签，记录问题引用，向 engineering 群汇报实际处理的缺陷名称。来源中的名称和数值保持原样。

help_conversations 集合是原 HelpScout 会话，记录 ID 为 rec_helpscout_ 加原始会话 ID；tags、threads 为 JSON 文本。issues 为研发问题集合，写入 project、issuetype、summary、priority、conversation_id；issue_key 采用项目代码加连字符再加原始会话 ID，保证可追溯。每条处理会话新增 help_notes 记录，含 conversation_id、issue_key，代表内部问题引用备注。不要更改已有会话正文与历史。政策表中的 Jira 字段对应此研发台账。
