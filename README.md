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

任务自己的 Dockerfile 决定环境，可以使用共享基础镜像，也可以自行扩展。Compose 为每次 trial 启动独立 agent 和 Mock，通过 `FEISHU_MOCK_URL` 配置连接。CLI 二进制直接位于 PATH，没有命令包装器、SDK 运行器或第二套 task 注册表；任务内环境不足 hook 只处理工具错误与审计。

Agent 镜像不包含 seed、后端状态、参考解或评分器。Mock 记录每次请求及状态变化；Harbor 采集后端 `state.json`，在独立 verifier 容器中评分。正常结果写 `/logs/verifier/reward.txt` 和诊断文件；未知接口始终记录环境覆盖不足；默认排除样本，任务策略可以选择保留并扣分。

Sheet AI 批量写入目前仅支持所有子操作均可成功的普通 `set_cell_range` 值写入，按顺序处理且可跨同一工作簿内的子表。任何失败、未知选项或混合操作均在写入前返回 501 并排除样本；这不是对真实后端失败回滚语义的实现。失败批次的部分生效规则仍需后端证据确认。

Base 的 `+base-block-list` 与 URL 定位可读取同一份平铺数据表目录；仅返回任务已有数据表，不虚构文件夹、文档或仪表盘。嵌套目录及未知选项继续记录 501。

多维表记录列表支持 `filter={logic, conditions}` 的标量比较子集：`and/or`、文本/数字相等与不等、数字大小比较；不隐式转换文本和数字。记录搜索按指定字段做不区分大小写的子串匹配，可组合过滤、字段投影及分页，读取共享实时状态。复杂数组/布尔过滤、排序和视图查询仍记录 501，不代表与真实飞书所有查询语义等价。

评论读取从任务的 `drive_comments` 状态提供文档内列表、按 ID 批量读取和回复分页，并校验资源类型及过滤已解决/全文评论。未提供评论的 seed 表示初始无评论；未知文档或跨文档评论 ID 返回错误。评论写入、表情和关系展开仍不支持，保持 501。

联系人查询将现有成员资料和邮箱命名的私聊收件人映射为模拟目录。`ou_mock_` ID 由来源 ID 确定生成，资料读取、群成员读写和群搜索使用同一映射，群内仍保存来源 ID；不会把模拟 ID 当作真实飞书 ID。未知姓名、邮箱和部门不补造；目录中的账号激活/租户标记仅描述模拟账号，不代表来源业务中的雇佣关系或现实租户归属，搜索结果带有说明。离职和组织关系筛选仍返回 501。

示例 Agent 配置提供通用 CLI 工具入口说明，不包含任务答案。使用已有 Codex 登录时，可设置 `CODEX_AUTH_JSON_PATH` 指向本机登录文件；不要在此固定 Harbor 版本设置 `CODEX_FORCE_AUTH_JSON=1`，其敏感值脱敏会把产物中的数字 1 一并替换，导致 JSON 损坏。选手认证与 RewardKit 裁判认证是独立配置。

模型评测使用 Harbor 内置 Agent，例如 `harbor run --config experiments/maintenance-codex.yaml`；需要单独配置该 Agent 的认证，运行可能产生模型费用。普通 CI 不调用模型；手动启用完整验收会运行语义 judge，oracle/nop 也可能产生模型费用。原生任务也可作为兼容 Harbor 的训练系统输入，本仓库不自建训练调度器，尚未验证实际 RL 训练。

## 数据与改写

AutomationBench 固定上游提交 `4a8e1061254004d9dac807054eed33fad7d1ff14`，完整清单见 [automationbench.json](scripts/migration/automationbench.json)，语义调整见 [迁移说明](scripts/migration/README.md)，许可见 [LICENSES/AutomationBench.txt](LICENSES/AutomationBench.txt)。按领域和原始 ID 联合标识任务。

原 SaaS 实体映射为飞书多维表格业务台账，邮件和 Slack 通知改为飞书私聊与群消息，计划写入飞书电子表格或日历。保留原始 ID、数值、政策与干扰数据；题面用中文并公开必要的歧义处理规则。外部发券、财务付款或社交发布等以明确说明的业务台账承载，不执行真实外部操作。

维护通知示例源自 AutomationBench operations-1236，重点检查读规则、选择批准窗口、记录和通知完整以及过程中的误操作。先创建错误日程再取消，仍不能通过。

## 验证边界

CLI 固定版本 `0493db0cd1a10d6dd8a2295128bec3e319c7fbb0`，构建时下载上游代码，使用本项目 Go host 接入 Mock。没有 Mock 地址时直接失败；raw API 命令禁用。构建时复用同一上游版本的文档嵌入代码，将 skills 及命令指导文档打包进二进制；`lark-cli skills list/read` 无需源码目录即可使用。未加载 Aily 插件。

Mock 实现任务需要的共享业务状态和部分权限规则；尚未与真实飞书租户做差分验证，也不模拟完整 OAuth、线上通知送达或全部接口。未知端点返回 501。只使用本地合成凭据，不向生产系统写入。

历史验证版本为 `e4c2848c1c7cfd676d95f28839a9f539693e645a`：[完整 CI 与产物](https://github.com/Haoping-Xiao/lark-gym/actions/runs/35478351128)。本地 813 项测试、Go 测试和 vet 通过；全部 25 组容器产物已下载复核，任务集合恰好覆盖 800 题。第 12 组首次因 Docker 构建器异常中断，同一提交重跑通过，其余组首次通过。逐题 `container_verified` 对应此验证版本，详细证据记录在 `scripts/migration/automationbench.json`；后续业务代码修改需要重新验证。

## 业务与评分整理

当前任务按业务实体分表，用户请求与操作环境说明分开。环境不足经 task 内 hook 留下请求与处置日志；默认继续执行、最终排除样本，扣分默认 0。策略支持累计扣分上限、负分下限及样本有效性配置。

评分保留对象、数量、数值状态、权限和无关数据保护等代码检查；文本含义交给 Reward Kit rubric，避免禁词或参考措辞误杀。`tests/test.sh` 执行完整评分；单独运行 `verify.ts` 只得到程序检查的中间结果。judge 失败不生成最终分数。需要在独立 verifier 中配置模型接入。

[实现及运行说明](scripts/task-support/README.md) · [逐题检查清单](reports/task-audit.json)。普通 CI 不运行付费 judge；全量容器加语义验收需显式启动工作流。历史 800 题 oracle/nop 结果不能替代本次语义评分或 Astra 探索验收，测试租户对照仍需单独执行。
