# OfficeGym

**Every failure becomes a training ground.**

通过真实 lark-cli，在独立、有状态的飞书 Mock 中评测办公 Agent。任务采用 Harbor 原生格式，包含中文要求、初始业务数据、CLI 参考解和独立评分器。

目前包含 **800 道 AutomationBench 改写任务**（600 道正式题、200 道 simple 辅助题），以及一个维护通知示例。800 道任务均已通过本地 CLI 参考解和反例检查；当前版本的全量 Harbor 容器验收仍在进行。本项目是飞书业务改写，不是官方 AutomationBench 分数复现。

```text
tasks/<name>/
  instruction.md          中文任务与工具使用说明
  task.toml               Harbor 资源、超时、后端产物及独立评分配置
  environment/            Dockerfile、Compose、Mock Dockerfile、seed.json
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

这些检查使用真实 CLI 访问 Mock，并验证空操作、缺失必要业务操作、禁止通知和无关数据误改。它们不能代替 Harbor 容器验收。

## Harbor 运行

使用固定 Harbor 提交 `2993946dd5b64a46dac3aa766d03065f432a1468`（0.23.0）及 Docker：

```bash
pip install 'harbor @ git+https://github.com/harbor-framework/harbor.git@2993946dd5b64a46dac3aa766d03065f432a1468'
bash scripts/build-images.sh
harbor run --path tasks/automationbench-simple-3001 --agent oracle
harbor run --path tasks/automationbench-simple-3001 --agent nop
harbor run --config experiments/eval/oracle.yaml
```

任务自己的 Dockerfile 决定环境，可以使用共享基础镜像，也可以自行扩展。Compose 为每次 trial 启动独立 agent 和 Mock，通过 `FEISHU_MOCK_URL` 配置连接。CLI 二进制直接位于 PATH，没有命令包装器、SDK 运行器、自定义 hook 或第二套 task 注册表。

Agent 镜像不包含 seed、后端状态、参考解或评分器。Mock 记录每次请求及状态变化；Harbor 采集后端 `state.json`，在独立 verifier 容器中评分。正常结果写 `/logs/verifier/reward.txt` 和诊断文件；未知接口归为环境覆盖不足，不能当作正常失败样本。

模型评测使用 Harbor 内置 Agent，例如 `harbor run --config experiments/maintenance-codex.yaml`；需要单独配置该 Agent 的认证，运行可能产生模型费用。CI 仅运行 oracle/nop，不调用收费模型。原生任务也可作为兼容 Harbor 的训练系统输入，本仓库不自建训练调度器，尚未验证实际 RL 训练。

## 数据与改写

AutomationBench 固定上游提交 `4a8e1061254004d9dac807054eed33fad7d1ff14`，完整清单见 [automationbench.json](scripts/migration/automationbench.json)，语义调整见 [迁移说明](scripts/migration/README.md)，许可见 [LICENSES/AutomationBench.txt](LICENSES/AutomationBench.txt)。按领域和原始 ID 联合标识任务。

原 SaaS 实体映射为飞书多维表格业务台账，邮件和 Slack 通知改为飞书私聊与群消息，计划写入飞书电子表格或日历。保留原始 ID、数值、政策与干扰数据；题面用中文并公开必要的歧义处理规则。外部发券、财务付款或社交发布等以明确说明的业务台账承载，不执行真实外部操作。

维护通知示例源自 AutomationBench operations-1236，重点检查读规则、选择批准窗口、记录和通知完整以及过程中的误操作。先创建错误日程再取消，仍不能通过。

## 验证边界

CLI 固定版本 `0493db0cd1a10d6dd8a2295128bec3e319c7fbb0`，构建时下载上游代码，使用本项目 Go host 接入 Mock。没有 Mock 地址时直接失败；raw API 命令禁用。未加载上游内嵌 skills 或 Aily 插件。

Mock 实现任务需要的共享业务状态和部分权限规则；尚未与真实飞书租户做差分验证，也不模拟完整 OAuth、线上通知送达或全部接口。未知端点返回 501。只使用本地合成凭据，不向生产系统写入。

历史版本已有原生 Harbor oracle/nop 容器通过记录；逐题 `container_verified` 只代表明确记录的相同版本证据，不能用历史成功替代当前版本验收。最终运行产物位于 Harbor jobs 目录和 CI artifacts。
