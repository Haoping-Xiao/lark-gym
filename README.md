# LarkGym

**Every failure becomes a training ground.**

通过真实 lark-cli，在独立、有状态的飞书 Mock 中评测办公 Agent。任务采用 Harbor 原生格式，包含中文要求、初始业务数据、CLI 参考解和独立评分器。

目前包含 **800 道 AutomationBench 改写任务**（600 道正式题、200 道 simple 辅助题），以及一个维护通知示例。当前任务版本 0.2.0 引入分表、环境不足策略及语义评分；完整模型与容器验收尚待执行。旧版本的 800 题容器证据见下方验证边界，不能用于证明新评分已通过。本项目是飞书业务改写，不是官方 AutomationBench 分数复现。

```text
tasks/<name>/
  instruction.md          中文业务请求
  task.toml               Harbor 资源、超时、后端产物及独立评分配置
  environment/            镜像、Compose、seed、操作指南与环境不足策略
  solution/               真实 CLI 参考解，只提供给 oracle
  tests/                  独立评分镜像、test.sh、评分代码与期望条件
gyms/lark-cli/            Go CLI 接入、TypeScript Mock、公共基础镜像
experiments/              Harbor job 配置
scripts/                  CLI/镜像构建、迁移与 CI 验收
tests/                   仓库回归测试
```

## 本地验证

需要 Node.js 24、Go 1.23+、Git、Python 3。

```bash
npm ci
npm run build:cli
npm run check
npm run oracle
```

`check` 包含类型、格式、Node 与 Go 检查。`oracle` 是维护通知示例的本地服务/参考解/独立评分冒烟测试，无模型调用。全部迁移任务的本地验证可单独执行：

```bash
node --test tests/migration.test.ts
```

这些检查使用真实 CLI 访问 Mock，验证结构性缺失、禁止通知、无关数据误改以及语义检查的交接。文本含义检查需要真实 judge；例如 sales-703 的空操作也必须经过语义判定。它们不能代替模型或 Harbor 容器验收。

## Harbor 运行

使用固定 Harbor 提交 `2993946dd5b64a46dac3aa766d03065f432a1468`（0.23.0）及 Docker：

```bash
pip install 'harbor @ git+https://github.com/harbor-framework/harbor.git@2993946dd5b64a46dac3aa766d03065f432a1468'
bash scripts/build-images.sh
harbor run --ve OPENAI_API_KEY="$OPENAI_API_KEY" --path tasks/automationbench-simple-3001 --agent oracle
harbor run --ve OPENAI_API_KEY="$OPENAI_API_KEY" --path tasks/automationbench-simple-3001 --agent nop
harbor run --ve OPENAI_API_KEY="$OPENAI_API_KEY" --config experiments/eval/oracle.yaml
```

任务自己的 Dockerfile 决定环境，可以使用共享基础镜像，也可以自行扩展。Compose 为每次 trial 启动独立 agent 和 Mock，通过 `FEISHU_MOCK_URL` 配置连接。CLI 二进制直接位于 PATH，没有命令包装器、SDK 运行器或第二套 task 注册表；任务内环境不足 hook 处理工具错误、审计和运行中断。

Agent 镜像不包含 seed、后端状态、参考解或评分器。Mock 记录每次请求及状态变化；Harbor 采集后端 `state.json`，在独立 verifier 容器中评分。正常结果写 `/logs/verifier/reward.txt` 和诊断文件；未知接口始终记录环境覆盖不足；默认排除样本，任务策略可以选择保留并扣分。

单元格写入支持普通值及字符串的 `cell_styles.number_format="@"` 文本格式，格式保存在共享状态并通过单元格/类型化表格读回，前导零和长编号保持原文。其他数字/日期/视觉格式与样式单独写入仍未支持。

Sheet AI 批量写入目前仅支持所有子操作均可成功的普通 `set_cell_range` 值写入，按顺序处理且可跨同一工作簿内的子表。任何失败、未知选项或混合操作均在写入前返回 501 并排除样本；这不是对真实后端失败回滚语义的实现。失败批次的部分生效规则仍需后端证据确认。

Base 的 `+base-block-list` 与 URL 定位可读取同一份平铺数据表目录；仅返回任务已有数据表，不虚构文件夹、文档或仪表盘。嵌套目录及未知选项继续记录 501。

Wiki 空间的列表和详情读取使用 seed 中可选的 `wiki_spaces`（当前模拟身份可访问的空间）；未配置表示没有可访问空间，不会从 Drive 文件虚构知识库。支持团队/个人空间默认列表、分页、离职文档库筛选，以及 `my_library` 的详情别名。个人文档库不出现在默认列表。列表与详情共用状态；未知节点操作、写入和未实现的本地化名称/筛选继续报告 501。此范围不代表完整 Wiki 或真实租户权限实现。

多维表记录列表支持 `filter={logic, conditions}` 的标量比较子集：`and/or`、文本/数字相等与不等、数字大小比较；不隐式转换文本和数字。记录搜索按指定字段做不区分大小写的子串匹配，可组合过滤、字段投影及分页，读取共享实时状态。复杂数组/布尔过滤、排序和视图查询仍记录 501，不代表与真实飞书所有查询语义等价。

评论读取从任务的 `drive_comments` 状态提供文档内列表、按 ID 批量读取和回复分页，并校验资源类型及过滤已解决/全文评论。未提供评论的 seed 表示初始无评论；未知文档或跨文档评论 ID 返回错误。评论写入、表情和关系展开仍不支持，保持 501。

联系人查询将现有成员资料和邮箱命名的私聊收件人映射为模拟目录。`ou_mock_` ID 由来源 ID 确定生成，资料读取、群成员读写和群搜索使用同一映射，群内仍保存来源 ID；不会把模拟 ID 当作真实飞书 ID。未知姓名、邮箱和部门不补造；目录中的账号激活/租户标记仅描述模拟账号，不代表来源业务中的雇佣关系或现实租户归属，搜索结果带有说明。离职和组织关系筛选仍返回 501。

示例 Agent 配置提供通用 CLI 工具入口说明，不包含任务答案。使用已有 Codex 登录时，可设置 `CODEX_AUTH_JSON_PATH` 指向本机登录文件；不要在此固定 Harbor 版本设置 `CODEX_FORCE_AUTH_JSON=1`，其敏感值脱敏会把产物中的数字 1 一并替换，导致 JSON 损坏。选手认证与 RewardKit 裁判认证是独立配置。

模型评测使用 Harbor 内置 Agent，例如 `harbor run --config experiments/maintenance-codex.yaml`；需要单独配置该 Agent 的认证，运行可能产生模型费用。普通 CI 不调用模型；手动启用完整验收会运行语义 judge，oracle/nop 也可能产生模型费用。原生任务也可作为兼容 Harbor 的训练系统输入，本仓库不自建训练调度器，尚未验证实际 RL 训练。

## 数据与改写

AutomationBench 固定上游提交 `4a8e1061254004d9dac807054eed33fad7d1ff14`，完整清单见 [automationbench.json](scripts/migration/automationbench.json)，语义调整见 [迁移说明](scripts/migration/README.md)，许可见 [LICENSES/AutomationBench.txt](LICENSES/AutomationBench.txt)。按领域和原始 ID 联合标识任务。

原 SaaS 实体映射为飞书多维表格业务台账，Slack 通知映射为飞书消息；历史邮件到 IM 的替代正在逐题恢复为原生邮件，计划写入飞书电子表格或日历。保留原始 ID、数值、政策与干扰数据；题面用中文并公开必要的歧义处理规则。外部发券、财务付款或社交发布等以明确说明的业务台账承载，不执行真实外部操作。

维护通知示例源自 AutomationBench operations-1236，重点检查读规则、选择批准窗口、记录和通知完整以及过程中的误操作。先创建错误日程再取消，仍不能通过。

## 验证边界

CLI 固定版本 `0493db0cd1a10d6dd8a2295128bec3e319c7fbb0`，构建时下载上游代码，使用本项目 Go host 接入 Mock。没有 Mock 地址时直接失败；raw API 命令禁用。构建时复用同一上游版本的文档嵌入代码，将 skills 及命令指导文档打包进二进制；`lark-cli skills list/read` 无需源码目录即可使用。未加载 Aily 插件。

Mock 实现任务需要的共享业务状态和部分权限规则；尚未与真实飞书租户做差分验证，也不模拟完整 OAuth、线上通知送达或全部接口。未知端点返回 501。只使用本地合成凭据，不向生产系统写入。

历史验证版本为 `e4c2848c1c7cfd676d95f28839a9f539693e645a`：[完整 CI 与产物](https://github.com/Haoping-Xiao/lark-gym/actions/runs/35478351128)。本地 813 项测试、Go 测试和 vet 通过；全部 25 组容器产物已下载复核，任务集合恰好覆盖 800 题。第 12 组首次因 Docker 构建器异常中断，同一提交重跑通过，其余组首次通过。逐题 `container_verified` 对应此验证版本，详细证据记录在 `scripts/migration/automationbench.json`；后续业务代码修改需要重新验证。

## 业务与评分整理

当前任务按业务实体分表，用户请求与操作环境说明分开。环境不足经 task 内 hook 留下请求与处置日志；默认 `execution: "abort"`：保存证据后封住业务接口，由任务容器内的 PID 1 终止当前选手进程，后端继续存活供独立评分；最终排除样本、扣分默认 0。设置 `execution: "continue"` 可继续探索并接收反馈。策略支持累计扣分上限、负分下限及样本有效性配置。该执行中断实现针对 Docker 中安装式 agent；不要配置共享/宿主 PID namespace 或 Docker init，环境保活程序要求自己是私有容器的 PID 1。

评分保留对象、数量、数值状态、权限和无关数据保护等代码检查；文本含义交给 Reward Kit rubric，避免禁词或参考措辞误杀。`tests/test.sh` 执行完整评分；单独运行 `verify.ts` 只得到程序检查的中间结果。judge 失败不生成最终分数。需要在独立 verifier 中配置模型接入。

[实现及运行说明](scripts/task-support/README.md) · [逐题检查清单](reports/task-audit.json)。普通 CI 不运行付费 judge；全量容器加语义验收需显式启动工作流。历史 800 题 oracle/nop 结果不能替代本次语义评分或 Astra 探索验收，测试租户对照仍需单独执行。

### 只读资源身份和元数据

当前支持固定评测用户的邮箱profile和accessible_mailboxes，以及Base详情。用户和bot使用可区分的合成凭据，调用记录保留身份；仅用户能查询自己的profile，bot查询可访问邮箱时必须明确指定该评测用户地址。不会从业务邮件的收件人推导公共邮箱或任意用户权限。显式配置 seed.mail 的任务支持下文所述原生邮件操作；未配置的任务仍将相关请求记为覆盖缺口。Base名称与Drive目录共用同一数据来源，可由seed.base.name设置，默认沿用既有“业务台账”名称；不编造owner、revision或时间等元数据。

响应结构按固定CLI版本的目录与原始测试核对，尚未完成真实用户租户对照；本地拒绝使用模拟错误诊断，不声称已复现提供方所有错误码、OAuth scope或权限矩阵。新镜像为CLI 0.2.1、Mock 0.2.2；旧实验继续使用其已固定镜像。

IM text addressing uses the same fixture directory for contact lookup, user open_id sends and existing P2P chat resolution. The user-only `chat_p2p/batch_query` path used by the pinned CLI can resolve existing chats; it does not create chats for unknown users. Both user and bot text sends to known open_id recipients update the same message collection read via chat_id. Mock image `0.2.3` includes this support. Text sends also honor exact UUID retries for one hour of the fixture clock, returning the original response without another write. The cache belongs to one run; changing the payload or actor under an active UUID is explicitly unsupported. Other receiver namespaces, non-text messages and unknown send options remain explicitly unsupported (501), rather than silently ignoring options or incorrectly treating supported CLI features as malformed input. These are bounded simulator behaviors, not a claim of complete tenant permissions or live API parity.

Mock image `0.2.4` recognizes the pinned CLI's calendar event-search action as an unsupported operation and records a 501 coverage gap before resource lookup. The real-CLI regression covers owner, reader and absent-calendar fixtures; supported reads of missing events still return 404. Calendar event search itself is not implemented. Mock `0.2.5` additionally supports the current user’s primary-calendar lookup (a POST read in the pinned API), using the same calendar state as list and detail reads. Alternate actors and unsupported lookup options remain explicit coverage gaps. Mock `0.2.6` keeps attendee IDs distinct across deletion and re-addition, and attendee creation returns the complete resulting attendee list. Unsupported attendee types remain coverage gaps.

Mock `0.2.7` adds an opt-in, task-seeded native mailbox (`seed.mail`), separate from IM. The pinned CLI can read/list/search messages, create/edit/read/delete drafts, send or reply, inspect delivery status and change system folders/labels. Drafts and sent mail share message state and mutation history; sending removes the draft. MIME is decoded with pinned `emailjs-mime-parser` 2.0.7; HTML-only bodies use `html-to-text` 9.0.5 for the plain-text API projection. Scheduled sends, custom labels/folders and unimplemented operations remain explicit coverage gaps. Ordinary attachments are opt-in in Mock 0.2.11 as described below. Real-CLI regressions cover Unicode headers/body, reply threading, independent instances, pagination, metadata projections and rollback after rejected operations. Task `automationbench-simple-3175` now requires native mail separately from its IM announcement, with original recipient, subject and body checks. Tasks `automationbench-simple-3153` and `3155` read their original incoming mail from an explicitly accessible support mailbox; `3155` sends a native email reply. Tasks `3151`, `3170`, `3177` and `3183` also use native incoming or outgoing mail, including read-before-create and complete-sheet-before-send checks where required. This does **not** establish restoration of the other Gmail-derived tasks; the remaining migration is still in progress.

Mock `0.2.10` additionally supports task-enabled rich posts with text, links, standalone member mentions and Markdown nodes. Task `3187` now has a successful native rich-post run with verified manager identity. Images, cards, unknown nodes and embedded mention markup inside Markdown remain explicit coverage gaps. Native-mail tasks `3001`–`3006` verify that the original email was read before contact updates, without requiring a separate contact lookup. Thread reads, seeded primary calendars and calendar search remain supported; recurrence expansion and unsupported filters remain coverage gaps.

Mock `0.2.11` supports task-enabled ordinary MIME attachments through draft, send and metadata reads, retaining exact bytes internally. Inline CID, nested multipart and attachment downloads remain coverage gaps. Task `3067` provides an explicitly synthetic invoice PDF because the upstream export contains no file; verification checks its actual bytes, not a filename in the body. Task `3066` explicitly corrects the source year to 2025 to reconcile Thursday February 27. Native-mail restoration through tasks `3061`–`3070` has been validated, while other Gmail-derived tasks remain in progress.

Native-mail tasks `3073`, `3077`, `3082`, `3087`, `3091`, `3095`, `3098` and `3102` now use mailbox state and enforce source reads before their business writes. The source-relative Date field is explicit in mail logging tasks, and equivalent date formats are accepted. Final native runs include one retained failure under the upstream literal funding-string assertion and one excluded `3102` run due to workspace discovery; those are not reported as successful task runs. Reinstalling task environments now selects complete image tags without corrupting `0.2.10` prefixes.

Mock `0.2.12` adds task-enabled workspace entity discovery from the same Base state. Unknown workspaces return 404 without inventing resources from business fields. The final `3102` rerun now passes; the earlier 501 exclusion remains recorded. Native-mail bug tasks `3108` and `3112` also pass fresh runs, with explicitly requested full issue titles checked deterministically. Across these three final tasks, 37 independent CLI controls match expectations; 1230 full checks and oracle pass. Other mail restoration and 33 historical candidates remain unfinished.

Mock `0.2.13` adds task-enabled missing-Base classification for table catalog discovery, allowing recovery from a business board ID used as a Base token. Tasks `3118`, `3122` and `3128` now use original mail and pass final native runs; the earlier board discovery exclusions remain recorded. Correct list mapping must be read before card creation. Manager feedback permits faithful English or Chinese summaries, and rejects missing actions or fabricated completion. The 49 independent controls match expectations; 1234 full checks and oracle pass.

Calendar-mail tasks `3133`, `3139` and `3144` now read their original mail and pass final native runs. When the source omits duration, the reference hour is no longer mandatory: exact start time remains structural and an independent judge checks reasonable duration. The explicitly requested 45 minutes and user-hosted video meeting remain strict in `3144`. All 46 controls match expectations, including alternative durations, source-read order and false descriptions; 1237 full checks and oracle pass.

Native-mail combinations `3157`–`3159` now create their business records and send actual replies or the engineering notice. Replies must remain linked to the source; drafts and separate same-subject messages fail. Optional record enrichment is checked for truth rather than forced verbatim copying. Final native runs and all 45 controls pass their expected outcomes; 1240 full checks and oracle pass. The earlier incorrect message-literal configuration is retained in the report and corrected in the final bug-notification task.

Native-mail followups `3160`–`3162` restore welcome-contact extraction, legal ticket routing and feedback recording with real source-linked replies. Original group IDs are discoverable; optional feedback dates accept supported source or processing dates. All 43 controls match expectations and final native runs pass; 1243 full checks and oracle pass. Remaining mail restoration and 33 historical candidates are unfinished.

Native-mail tasks `3163`–`3165` now cover meeting confirmation, partnership records and project progress replies. All 40 controls match expectations, including valid Chinese next-step replies and rejection of acknowledgments that rely on quoted source text. Final native runs pass with no HTTP errors; 1246 full checks and oracle pass. Other mail restoration and 33 historical candidates remain unfinished.

Native outbound tasks `3167`, `3168` and `3171` restore actual onboarding, video invitations and resolution emails. All 40 independent controls match expectations; regenerated meeting references use the CLI-returned join URL. Onboarding and resolution native runs pass. Both meeting runs remain excluded for unsupported discovery/share requests and are not autonomous successes. Full checks: 1249 plus oracle; remaining mail restoration and 33 historical candidates are unfinished.

Native-mail tasks `3180`, `3188` and `3190` restore project details, subscriber welcome messages and CSAT logging/alerts. All 39 independent controls match expectations, and final native runs pass with no HTTP errors. Optional CSAT dates now explicitly allow the source or processing date; the earlier ambiguous rejection is retained. Full checks: 1252 plus oracle. Other mail restoration, video discovery coverage and 33 historical candidates remain unfinished.

Native digest, invoice and story tasks `3191`, `3192` and `3194` now use original mail and all five digest recipients. Their 45 independent controls match expectations; digest and invoice native runs pass. The final story run preserves a valid original-literal failure for its Chinese summary. The earlier missing-feedback acceptance is corrected; 1255 full checks and oracle pass. Formal mail, video discovery coverage and 33 historical candidates remain unfinished.

Pricing and signed-customer onboarding tasks `3198` and `3199` restore native mail; 32 independent controls match expectations. Onboarding passes its frozen native run, while pricing retains an original-literal failure for its Chinese ticket subject. All 71 simple Gmail-source tasks now have native mail adaptation, without claiming all native runs pass. Full checks: 1257 plus oracle; formal mail and 33 historical candidates remain open.

Formal webinar task `marketing-1006` restores all 17 source emails and native confirmation delivery. Real CLI evidence permits omission only for the three source-empty fields; null remains rejected. All 21 independent controls match expectations. The native run correctly creates seven contacts but retains a literal `7 contact` failure in its confirmation. Full checks: 1258 plus oracle. Historical open candidates: 32; remaining formal mail and coverage are unfinished.

Formal cleanup, news routing and churn check-ins now use native mail. Source unread flags, HTML assertions, renewal scope and JSON tag-set comparison are covered by 152 independent controls. Cleanup, news, campaign attribution and fraud review pass their final frozen native runs; webinar confirmation and churn check-in retain original body-literal failures. Full checks: 1264 plus oracle. Six historical candidates close, leaving 26; remaining formal mail and environment coverage are unfinished.
