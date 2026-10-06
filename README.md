# LarkGym

**Every failure becomes a training ground.**

通过真实 lark-cli，在独立、有状态的飞书 Mock 中评测办公 Agent。任务采用 Harbor 原生格式，包含中文要求、初始业务数据、CLI 参考解和独立评分器。

目前包含 **800 道 AutomationBench 改写任务**（600 道正式题、200 道 simple 辅助题），以及一个维护通知示例。本项目是飞书业务改写，不是官方 AutomationBench 分数复现；支持范围和验证边界见下文。

```text
tasks/<name>/
  instruction.md          中文业务请求
  task.toml               Harbor 资源、超时、后端产物及独立评分配置
  environment/            镜像、Compose、seed、操作指南与环境不足策略
  solution/               真实 CLI 参考解，只提供给 oracle
  tests/                  独立评分镜像、test.sh、评分代码与期望条件
gyms/lark-cli/            Go CLI 接入、TypeScript Mock、公共基础镜像
experiments/              Harbor job 配置
scripts/                  CLI/镜像构建、导入与评分器维护
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

`check` 包含类型、格式、全部本地测试与 Go 检查。测试按验证目的分目录和命令，见 [测试说明](tests/README.md)。例如：

```bash
npm run test:environment  # Mock 的状态、权限、接口一致性与运行隔离
npm run test:tasks        # 800 题参考解可执行，空操作/错误结果与语义交接符合评分约定
npm run test:grading      # 专项评分规则：允许的替代做法能通过，错误/缺失操作被拒绝
npm run test:packaging    # CLI 资源、任务输入边界与独立进程入口
```

`oracle` 是 `test:packaging` 中维护通知示例的快捷入口，已包含在 `check` 中；单独执行便于排错，CI 不再重复运行。它是本地进程测试，不会启动 Harbor 容器或调用模型。

这些检查不导入或重新生成任务。它们持续检查环境与评分是否正确；历史来源名不代表验证目的。程序检查通过不等于文本含义符合要求：例如 sales-703 的空操作仍需语义判定。本地检查不能代替 Harbor 容器或模型裁判验收。

## Harbor 运行

使用固定 Harbor 提交 `2993946dd5b64a46dac3aa766d03065f432a1468`（0.23.0）及 Docker：

```bash
pip install 'harbor @ git+https://github.com/harbor-framework/harbor.git@2993946dd5b64a46dac3aa766d03065f432a1468'
bash scripts/build-images.sh
harbor run --ve OPENAI_API_KEY="$OPENAI_API_KEY" --path tasks/automationbench-simple-3001 --agent oracle
harbor run --ve OPENAI_API_KEY="$OPENAI_API_KEY" --path tasks/automationbench-simple-3001 --agent nop
harbor run --ve OPENAI_API_KEY="$OPENAI_API_KEY" --config experiments/eval/oracle.yaml
```

构建脚本会将当前 Mock 镜像标记为仓库任务引用的所有兼容版本，避免干净机器尝试从 Docker Hub 拉取不存在的本地镜像。这些标签指向当前代码构建，不是历史代码快照；复现实验仍需保存仓库提交和镜像摘要。脚本参数透传给每次 `docker build`，可用 `--build-arg HTTP_PROXY --build-arg HTTPS_PROXY` 传入当前环境的构建代理。

任务自己的 Dockerfile 决定环境，可以使用共享基础镜像，也可以自行扩展。Compose 为每次 trial 启动独立 agent 和 Mock，通过 `FEISHU_MOCK_URL` 配置连接。CLI 二进制直接位于 PATH，没有命令包装器、SDK 运行器或第二套 task 注册表。

Agent 镜像不包含 seed、后端状态、参考解或评分器。Mock 记录每次请求及状态变化；Harbor 采集后端 `state.json`，在独立 verifier 容器中评分。正常结果写 `/logs/verifier/reward.txt` 和诊断文件；未知接口始终记录环境覆盖不足，用于独立分析，不自动改变任务得分。

单元格写入支持普通值及字符串的 `cell_styles.number_format="@"` 文本格式，格式保存在共享状态并通过单元格/类型化表格读回，前导零和长编号保持原文。其他数字/日期/视觉格式与样式单独写入仍未支持。

Sheet AI 批量写入目前仅支持所有子操作均可成功的普通 `set_cell_range` 值写入，按顺序处理且可跨同一工作簿内的子表。任何失败、未知选项或混合操作均在写入前返回 501；这不是对真实后端失败回滚语义的实现。失败批次的部分生效规则仍需后端证据确认。

Base 的 `+base-block-list` 与 URL 定位可读取同一份平铺数据表目录；仅返回任务已有数据表，不虚构文件夹、文档或仪表盘。嵌套目录及未知选项继续记录 501。

Wiki 空间的列表和详情读取使用 seed 中可选的 `wiki_spaces`（当前模拟身份可访问的空间）；未配置表示没有可访问空间，不会从 Drive 文件虚构知识库。支持团队/个人空间默认列表、分页、离职文档库筛选，以及 `my_library` 的详情别名。个人文档库不出现在默认列表。列表与详情共用状态；未知节点操作、写入和未实现的本地化名称/筛选继续报告 501。此范围不代表完整 Wiki 或真实租户权限实现。

多维表记录列表支持 `filter={logic, conditions}` 的标量比较子集：`and/or`、文本/数字相等与不等、数字大小比较；不隐式转换文本和数字。记录搜索按指定字段做不区分大小写的子串匹配，可组合过滤、字段投影及分页，读取共享实时状态。复杂数组/布尔过滤、排序和视图查询仍记录 501，不代表与真实飞书所有查询语义等价。

评论读取从任务的 `drive_comments` 状态提供文档内列表、按 ID 批量读取和回复分页，并校验资源类型及过滤已解决/全文评论。未提供评论的 seed 表示初始无评论；未知文档或跨文档评论 ID 返回错误。评论写入、表情和关系展开仍不支持，保持 501。

联系人查询将现有成员资料和邮箱命名的私聊收件人映射为模拟目录。`ou_mock_` ID 由来源 ID 确定生成，资料读取、群成员读写和群搜索使用同一映射，群内仍保存来源 ID；不会把模拟 ID 当作真实飞书 ID。未知姓名、邮箱和部门不补造；目录中的账号激活/租户标记仅描述模拟账号，不代表来源业务中的雇佣关系或现实租户归属，搜索结果带有说明。离职和组织关系筛选仍返回 501。

示例 Agent 配置提供通用 CLI 工具入口说明，不包含任务答案。使用已有 Codex 登录时，可设置 `CODEX_AUTH_JSON_PATH` 指向本机登录文件；不要在此固定 Harbor 版本设置 `CODEX_FORCE_AUTH_JSON=1`，其敏感值脱敏会把产物中的数字 1 一并替换，导致 JSON 损坏。选手认证与 RewardKit 裁判认证是独立配置。

模型评测使用 Harbor 内置 Agent，例如 `harbor run --config experiments/maintenance-codex.yaml`；需要单独配置该 Agent 的认证，运行可能产生模型费用。普通 CI 不调用模型；手动启用完整验收会运行语义 judge，oracle/nop 也可能产生模型费用。原生任务也可作为兼容 Harbor 的训练系统输入，本仓库不自建训练调度器，尚未验证实际 RL 训练。

## 数据与改写

AutomationBench 固定上游提交 `4a8e1061254004d9dac807054eed33fad7d1ff14`，完整清单见 [automationbench.json](scripts/migration/automationbench.json)，语义调整见 [迁移说明](scripts/migration/README.md)，许可见 [LICENSES/AutomationBench.txt](LICENSES/AutomationBench.txt)。按领域和原始 ID 联合标识任务。

邮件使用原生 Lark Mail，群通知使用飞书消息，文档、文件和日程使用任务声明的 Docs、Drive 与日历操作；CRM 等业务实体由多维表格承载。保留来源 ID、数值、政策与干扰数据，必要的歧义处理写入中文题面。部分外部发券、付款或社交发布被改为内部登记或排队，这改变了完成目标，不属于等价迁移，也不表示原外部动作已执行；相关任务仍需单独审查。

现有任务直接维护 `tasks/<name>/`。迁移目录用于来源追溯及初始导入，不是当前任务的完整重建入口。运行报告、审计快照和临时产物放在忽略的 `runs/` 或 CI 附件中，不提交到代码仓库。

维护通知示例源自 AutomationBench operations-1236，重点检查读规则、选择批准窗口、记录和通知完整以及过程中的误操作。先创建错误日程再取消，仍不能通过。

## 验证边界

CLI 固定版本 `0493db0cd1a10d6dd8a2295128bec3e319c7fbb0`，构建时下载上游代码，使用本项目 Go host 接入 Mock。没有 Mock 地址时直接失败；raw API 命令禁用。构建时复用同一上游版本的文档嵌入代码，将 skills 及命令指导文档打包进二进制；`lark-cli skills list/read` 无需源码目录即可使用。未加载 Aily 插件。

Mock 实现任务需要的共享业务状态和部分权限规则；尚未与真实飞书租户做差分验证，也不模拟完整 OAuth、线上通知送达或全部接口。未知端点返回 501。只使用本地合成凭据，不向生产系统写入。

历史验证版本为 `e4c2848c1c7cfd676d95f28839a9f539693e645a`：[完整 CI 与产物](https://github.com/Haoping-Xiao/lark-gym/actions/runs/35478351128)。本地 813 项测试、Go 测试和 vet 通过；全部 25 组容器产物已下载复核，任务集合恰好覆盖 800 题。第 12 组首次因 Docker 构建器异常中断，同一提交重跑通过，其余组首次通过。逐题 `container_verified` 对应此验证版本，详细证据记录在 `scripts/migration/automationbench.json`；后续业务代码修改需要重新验证。

## 业务与评分整理

环境对未支持的操作返回 `ENV_UNSUPPORTED`，失败不改变业务状态，后续操作仍可执行。Agent 由 Harbor 原生适配器运行，执行超时按任务的 `[agent].timeout_sec` 控制。评分仅依据任务规则与 LLM rubrics；unsupported 不触发额外扣分或样本排除。Mock 自身故障和裁判故障仍作为运行错误报告。

评分保留对象、数量、数值状态、权限和无关数据保护等代码检查；文本含义交给 Reward Kit rubric，避免禁词或参考措辞误杀。`tests/test.sh` 执行完整评分；单独运行 `verify.ts` 只得到程序检查的中间结果。judge 失败不生成最终分数。需要在独立 verifier 中配置模型接入。

[实现及运行说明](scripts/task-support/README.md)。使用 `python scripts/task-support/audit.py` 按需生成本地逐题检查清单。普通 CI 不运行付费 judge；全量容器加语义验收需显式启动工作流。历史 800 题 oracle/nop 结果不能替代本次语义评分或 Astra 探索验收，测试租户对照仍需单独执行。

### 当前能力与验收

任务可按seed启用邮箱、通讯录、Base和工作区发现。用户与bot身份分开，资源发现与读写共享同一份业务状态；不会从邮件收件人猜测资源权限。原生邮件独立于IM，支持已实现范围内的读信、草稿、发送、回复、MIME正文及普通附件；未知选项与操作仍按覆盖不足处理。

文档 Mock 支持 Markdown 创建、全文读取、覆盖、首尾追加和唯一文本替换；Drive 支持已实现范围内的文件移动与目录创建。未知富文本操作、资源类型和权限场景继续报告环境不足，不代表与真实飞书完全兼容。

仓库回归检查参考路径、错误或缺失操作、状态一致性及评分交接。历史容器结果和子集自主轨迹只能证明各自版本与范围；程序检查通过不等于语义验收，也不等于最新提交的全量模型自主成功率。真实租户差分和完整模型评测需单独执行，结果保存在 CI 或外部运行产物中。

## 环境缺口分析

每个 trial 的 `state.json` 由 Mock 保存 `{ seed, world, calls }`，Harbor 按任务的
`artifacts` 配置收集它。分析读取这些产物，不修改 reward：

```bash
npm run --silent analyze:unsupported -- runs/harbor/<job> > runs/unsupported-analysis.json
rg -n 'ENV_UNSUPPORTED' runs/harbor/<job>/<trial>/agent/
```

报告包含已有 trial 总数、有证据的 trial 数、受影响 trial 数、unsupported 请求总数、
按 HTTP 方法与路径汇总的接口分布，以及每条失败请求。缺失或损坏的状态文件单独列出，
不当作零次 unsupported。一次任务的多次 trial 分别统计；正在运行的 job 只能得到当前快照。

`calls.seq` 是后端请求序号，不是 Agent 步数。定位 Agent 操作时，在轨迹或原生日志中
搜索 `ENV_UNSUPPORTED`，查看对应工具调用和命令。关键词匹配用于定位，不用于计数；
Agent 引用错误可能重复命中，工具输出被截断时也可能找不到标记。
