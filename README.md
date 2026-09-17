# Feishu CLI environments

通过真实 lark-cli，在有状态的飞书 Mock 中运行和评测 Agent。当前包含一个跨 Sheets、Calendar、Base、IM 的维护通知 case。

```text
cases/maintenance-notice/    Harbor task：任务、seed、harness、参考解、评分器
lark-cli-mock/
  cli/                      上游 CLI host：凭据和 HTTP transport 扩展
  src/interception/         Codex PreToolUse 命令改写
  src/backends/feishu/       共享业务状态、接口和 seed 校验
  src/adapters/             Agent harness 接入
  src/runtime/              case 生命周期和运行产物
  src/harbor/               容器服务及评分状态落盘
tests/                     CLI、状态一致性、拦截与生命周期回归测试
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

配置位于 `cases/maintenance-notice/harness/codex.json`，可用 `--config PATH` 替换。SDK 固定为 0.154.0；CLI 固定为 `0493db0cd1a10d6dd8a2295128bec3e319c7fbb0`，构建时下载，不修改上游。未指定模型时使用 Codex 已有配置。CLI host 未打包上游内嵌 skills，也未加载 Aily 插件。

Agent 使用普通域命令，例如 `./lark-cli sheets +cells-get`。参考 [RTK](https://github.com/rtk-ai/rtk) 的宿主 hook 协议，PreToolUse 用 `updatedInput` 替换可执行文件并注入本次 Mock 地址；业务参数保留，再由 CLI transport 将请求转向本地 HTTP 服务。这里实现的是命令拦截，没有引入 RTK 二进制或输出压缩。禁止 raw `api`；缺少 Mock 地址时 CLI 直接失败。

每次运行独立服务、端口和 seed 副本。`runs/<run-id>/` 保存配置与 seed hash、模型轨迹、命令拦截、API 调用、最终状态和逐项评分。只有正常结束且全部断言通过才是 `pass`；未知接口归为 `environment_incomplete`，执行失败归为 `execution_error`。

## Harbor

Case 使用 Harbor 1.4 task 配置、`environment/Dockerfile`、`solution/solve.sh` 和 `tests/test.sh`。先生成 Docker build context：

```bash
npm run prepare:harbor
harbor run --path cases/maintenance-notice --agent oracle
```

生成目录只含运行依赖、Mock 和 CLI 源码，不含参考解、评分器或登录数据。Harbor 在执行阶段挂载 solution/tests。评分器输出 `/logs/verifier/reward.txt`，服务每次请求后保存状态和操作历史。

本机已验证服务→真实 CLI 参考解→状态落盘→评分器；当前开发机没有 Docker，完整 Harbor 容器运行尚未验证。不要将目录兼容视为容器实测成功。

## Case 与扩展

维护通知改编自 [AutomationBench example 1236](https://github.com/zapier/AutomationBench/blob/4a8e1061254004d9dac807054eed33fad7d1ff14/automationbench/domains/operations/tasks.py#L6877)。原始 Google/Airtable/Gmail 操作迁移为飞书；来源、差异和许可证保存在 case 中。评分检查先读规则、选择正确窗口、通知与记录完整，以及全程没有误改其他资源；取消错误会议不能消除违规记录。

增加 case 时复制 task 布局，提供 `case.ts` 中定义的 seed 校验、backend、oracle、verify，在 `lark-cli-mock/src/core/catalog.ts` 注册。业务评分属于 case；运行器不包含题目条件。新接口放在共享 backend，并测试交叉读取、写后读、拒绝写入和状态隔离。

## 验证边界

CI 执行类型检查、格式检查、Node/Go 测试和真实 CLI 参考解，不调用收费模型。模型轨迹与评分保存在每次运行产物中；单次成功不代表覆盖整个飞书。

Mock 覆盖本场景常规操作，未知端点返回 501；尚未与真实飞书租户做差分验证，也不模拟完整 OAuth、并发事务、通知送达或全部权限规则。使用仅限本地的合成凭据，不发线上业务请求。

本地 Codex 使用临时工作目录与 `workspace-write`，允许访问本地 HTTP；自动信任本项目生成的 hook。它不是恶意 Agent 的强隔离沙箱：同用户读取范围、宿主配置及网络仍需单独隔离。Harbor 状态文件同样不是防作弊边界。
