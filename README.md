# OfficeGym

**Every failure becomes a training ground.**

Turn office agent failures into stateful environments for evaluation and reinforcement learning.

把真实办公 badcase 转化为可复现、可验证的环境，用于评测与 RL 训练。

通过真实 lark-cli，在有状态的飞书 Mock 中运行和评测 Agent。当前包含一个跨 Sheets、Calendar、Base、IM 的维护通知 case。

```text
tasks/maintenance-notice/   Harbor task：任务、seed、工具说明、参考解、评分器
gyms/lark-cli/             真实 CLI 接入、共享状态服务、seed 校验
experiments/               Harbor job 范本与本地 SDK 运行配置
scripts/                   CLI 构建、Harbor 打包与容器测试
src/                       保留的本地 SDK 运行器及 Codex hook 接入
tests/                     OfficeGym 自身回归测试
```

## 本地运行

需要 Node.js 24、Go 1.23+、Git、Python 3。模型运行额外需要可用的 Codex 登录态。

```bash
npm ci
npm run build:cli
npm run check
npm run oracle                 # 无模型调用，运行参考解并评分
npm run run                    # Codex SDK 实际运行
npm run run -- --model MODEL    # 显式固定模型
```

配置位于 `experiments/local-codex.json`，可用 `--config PATH` 替换。SDK 固定为 0.154.0；CLI 固定为 `0493db0cd1a10d6dd8a2295128bec3e319c7fbb0`，构建时下载，不修改上游。未指定模型时使用 Codex 已有配置。CLI host 未打包上游内嵌 skills，也未加载 Aily 插件。

Agent 使用普通域命令，例如 `./lark-cli sheets +cells-get`。参考 [RTK](https://github.com/rtk-ai/rtk) 的宿主 hook 协议，PreToolUse 用 `updatedInput` 替换可执行文件并注入本次 Mock 地址；业务参数保留，再由 CLI transport 将请求转向本地 HTTP 服务。这里实现的是命令拦截，没有引入 RTK 二进制或输出压缩。禁止 raw `api`；缺少 Mock 地址时 CLI 直接失败。

每次运行独立服务、端口和 seed 副本。`runs/<run-id>/` 保存配置与 seed hash、模型轨迹、命令拦截、API 调用、最终状态和逐项评分。只有正常结束且全部断言通过才是 `pass`；未知接口归为 `environment_incomplete`，执行失败归为 `execution_error`。

## Harbor

Case 使用 Harbor 1.4 task 配置、`environment/Dockerfile`、`solution/solve.sh` 和 `tests/test.sh`。先生成 Docker build context：

```bash
npm run prepare:harbor
harbor run --path tasks/maintenance-notice --agent oracle
harbor run -c experiments/maintenance-codex.yaml
```

生成目录只含运行依赖、Mock 和 CLI 源码，不含参考解、评分器或登录数据。Harbor 在执行阶段挂载 solution/tests。评分器输出 `/logs/verifier/reward.txt`，服务每次请求后保存状态和操作历史。

Docker 镜像、真实 CLI 参考解和独立评分入口已在 GitHub CI 跑通；完整 Harbor 调度尚未实测。Harbor job 范本通过配置 schema 校验，执行仍需安装 Harbor 和相应 Agent 凭据。

## Task 与 Gym

维护通知改编自 [AutomationBench example 1236](https://github.com/zapier/AutomationBench/blob/4a8e1061254004d9dac807054eed33fad7d1ff14/automationbench/domains/operations/tasks.py#L6877)。原始 Google/Airtable/Gmail 操作迁移为飞书；来源、差异和许可证保存在 case 中。评分检查先读规则、选择正确窗口、通知与记录完整，以及全程没有误改其他资源；取消错误会议不能消除违规记录。

Task 绑定具体 gym：`environment/Dockerfile` 接入工具环境，seed 和评分器保留在 task。Harbor job 的 `agents` 选择执行器与模型；`task.toml` 的 `[agent]` 仅定义执行约束。切换 Agent 不应更改任务和评分器，迁移到另一套办公工具则创建 task 变体。

新增 Harbor task 使用相同目录约定即可；如需本地 SDK 调试，再实现 `task.ts` 并注册到 `src/core/catalog.ts`。新工具环境放入 `gyms/<原工具名>/`。不创建独立 bindings 层，优先使用 Harbor 内置 Agent 接入。

容器中的 `lark-cli` wrapper 和 transport 负责转发，与 Agent 无关。本地 SDK 入口保留 Codex PreToolUse hook；选择 Harbor 内置 Codex 不会自动加载这个 hook。

## 验证边界

CI 执行类型检查、格式检查、Node/Go 测试和真实 CLI 参考解，不调用收费模型。模型轨迹与评分保存在每次运行产物中；单次成功不代表覆盖整个飞书。

Mock 覆盖本场景常规操作，未知端点返回 501；尚未与真实飞书租户做差分验证，也不模拟完整 OAuth、并发事务、通知送达或全部权限规则。使用仅限本地的合成凭据，不发线上业务请求。

本地 Codex 使用临时工作目录与 `workspace-write`，允许访问本地 HTTP；自动信任本项目生成的 hook。它不是恶意 Agent 的强隔离沙箱：同用户读取范围、宿主配置及网络仍需单独隔离。Harbor 状态文件同样不是防作弊边界。
