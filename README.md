# Feishu single-case environment

最小闭环：**Codex TypeScript SDK → shell → 真实 lark-cli → 本地 HTTP Mock → 内存 world → 确定性评分**。

本项目只实现一个跨应用 case，不含训练、自动合成流水线或分布式调度。代码模块：

```text
src/run.mjs           Codex SDK / 参考解运行器，记录轨迹与评分
cli/main.go           upstream CLI 的公开 credential + transport 扩展
src/mock.mjs          HTTP 路由、状态变更、权限与调用记录
src/verify.mjs        独立程序评分器
src/oracle.mjs        人工参考解，只供验收，不交给 Agent
cases/maintenance-notice/
  instruction.md     用户任务
  tools.md           Agent 可见的工具范围与参数说明
  seed.json          初始业务数据（Agent 工作目录不包含）
  provenance.json    原题、版本及迁移差异
```

## Case

改编自 AutomationBench `operations.calendar_airtable_gmail_maintenance_notice`，example **1236**，上游 commit `4a8e1061254004d9dac807054eed33fad7d1ff14`。

Agent 读取维护计划和另一张表里的排期规则，在 6 个候选行中排除草稿、安全审核阻塞、供应商合同问题、已被替代窗口、其他系统的维护计划。随后：

1. 在飞书 Calendar 创建正确窗口的 Data Closet 维护日程。
2. 写入指定 Bitable 记录的 `Maintenance log`。
3. 向 IT Operations 群发通知，原样保留源数据起止时间。

Google Sheets/Calendar 分别映射到 Feishu Sheets/Calendar；Airtable comment 改为 Bitable 字段；Gmail 改为 IM 群消息。加入已有会议和另一条记录作为误改检查对象。**这不是原版 AutomationBench 分数**，也不是飞书线上兼容性认证。

## Run

依赖 Node.js >= 20、npm、Git、Go >= 1.23；Codex 有可用登录态。

```bash
npm ci
npm run build:cli
npm test
(cd cli && go test ./... && go vet ./...)
npm run oracle
# 如果尚未登录：codex login（项目不会要求复制 token）
npm run run
```

SDK 固定在 `@openai/codex-sdk@0.154.0`，默认使用它附带的 Codex CLI 和已有登录态。本机实测为 ChatGPT 登录；不会注入 `OPENAI_API_KEY`，额度是否可用仍取决于该账号。可选 `EVAL_MODEL=<model>`、`EVAL_TIMEOUT_MS=600000`、`CODEX_EXECUTABLE=/path/to/codex`。不指定 model 时使用 Codex 配置默认值。

CLI 源码固定在 `0493db0cd1a10d6dd8a2295128bec3e319c7fbb0`，build 脚本下载到 `.deps/lark-cli`，不修改上游。每次 run 启动独立 server/随机端口并深拷贝 seed。相同初态互不污染；固定业务时间，但模型输出和 wall-clock 耗时不保证确定。

`bin/lark-cli` 是公开扩展接口组装的真实 upstream command tree：命令解析、schema、shortcut、HTTP 编解码及输出走上游代码。它不是伪造 CLI stdout 的脚本，也不是本机全局安装二进制；此最小 host 未打包上游嵌入式 skills/affordance 文档，且未加载内部 Aily 插件。

## Outputs

每次生成 `runs/<timestamp>-<mode>/`：

- `trajectory.jsonl`：Codex SDK 原始事件，包含真实 shell 命令和输出。
- `api.jsonl`：后端 API 请求/响应和资源变更记录，不记录认证 header。
- `final-state.json`：最终业务状态。
- `result.json`：逐项断言、状态、耗时、SDK token usage、线程 ID。
- `answer.md`：Agent 最终回复；oracle 模式改为 `commands.jsonl`。

`pass` 需要全部断言通过；`fail` 表示已覆盖环境下未达成；`environment_incomplete` 表示出现未实现端点/后端异常；`execution_error` 表示 SDK/进程未正常结束。非 pass 退出码为 1。`success` 不依据 Agent 自述。

评分检查读完规则后才写、恰好一个正确会议、从未创建错误时间窗口、记录/通知完整、已有会议及其他记录未被修改。取消错误会议不能抵消违规。API 调用次数包含 CLI 自动发起的用户信息请求。

## Boundaries

- 已实现的 API 范围列于 `cases/maintenance-notice/tools.md`。常规读、列表、分页、事件增改删、记录修改和消息写后读共享同一个 world。未知接口返回 HTTP 501，不能静默成功。
- 权限只实现本题的读写日历角色；验证基本字段/时间、ID 和原子拒绝。不模拟完整 OAuth、飞书所有业务边界、重复请求幂等键、并发事务、通知送达、搜索索引或服务延迟。范围内的行为通过测试，但未与飞书测试租户做差分验证。单次成功不能证明整个 CLI 都有覆盖。
- CLI 只接受 `http://127.0.0.1:<port>` Mock 地址，注入无效于线上的 synthetic token，并阻断 transport 中非飞书主机。没设置 Mock 地址会直接退出。这里的飞书写操作不触达线上。
- Codex 工作目录在独立临时目录，仅放工具说明及 CLI 链接；seed、oracle、grader 不放进去，world 在父进程内存中。采用 `workspace-write` + 网络允许，以执行本地 HTTP；**这不是对恶意 Agent 的强读取隔离**，同用户仍可能越界读文件。该 MVP 面向合作式评测，不应直接宣称为防作弊训练沙箱。
- SDK 子进程只继承必要系统变量、已有 Codex home（如设置）和本机代理，排除 Raft/其他服务凭据。已有 Codex 用户配置仍可影响 model 和工具行为。临时工作目录与运行产物保留供排查，可在审查后删除。

## Sources

- [Codex SDK 官方文档](https://developers.openai.com/codex/sdk/)
- [AutomationBench 原题](https://github.com/zapier/AutomationBench/blob/4a8e1061254004d9dac807054eed33fad7d1ff14/automationbench/domains/operations/tasks.py#L6877)：种子中的业务行和规则源于此，许可证见 case 目录 `UPSTREAM-LICENSE`。
- [lark-cli 扩展接口](https://github.com/larksuite/cli/tree/0493db0cd1a10d6dd8a2295128bec3e319c7fbb0/extension)：MIT，上游依赖保留各自许可证。
