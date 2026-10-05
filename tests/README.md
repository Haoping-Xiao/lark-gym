# 测试在保证什么

LarkGym 的持续目标是**环境行为正确、任务可执行、评分正确**。导入历史数据只是构建任务的一种手段，不是任务验收的目的。

**两个 `tests/` 的区别：** `tasks/<题目>/tests/` 是实际判卷程序，Harbor 每次运行该题时用它给做题者打分；仓库根目录的 `tests/` 是开发者回归测试，用正确、错误和等价结果检查判卷程序，并检查 Mock 环境行为。例如任务评分器判断是否向指定收件人发信，根目录测试则检查“发对人能通过、发错人或没发会失败”。它不额外定义一套选手评分标准。

以下命令从仓库根目录执行。首次运行先 `npm ci && npm run build:cli`。`npm run check` 包含类型、格式、下表全部本地测试与 Go 检查；`npm test` 只包含五组本地 Node 测试。普通 CI 按同样的组分别显示步骤，便于看出失败原因。

| 验证目的                 | 位置 / 命令                                                         | 实际检查                                                                                              | 不证明什么                                         |
| ------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 环境行为正确             | `environment/`；`npm run test:environment`                          | 真实 CLI 与 Mock 的读写一致性、权限、分页、失败回滚、跨运行隔离和未支持接口处理                       | 不证明与线上飞书完整等价，也不穷尽所有组合         |
| 每题可执行且满足评分约定 | `task-contracts/`；`npm run test:tasks`                             | 800 题的参考解、空操作、结构性错误、允许的替代结果和语义交接                                          | 不运行模型选手或模型裁判；程序通过不是完整业务验收 |
| 评分规则正确             | `grading/`；`npm run test:grading`                                  | 业务规则的正反例、收件人/对象/顺序/数值约束、等价表达、证据和评分流水线                               | 样例有限；裁判被替身代替的测试不能证明模型判断质量 |
| 本地打包与入口正确       | `packaging/`；`npm run test:packaging`                              | CLI 内置资源、任务输入边界、镜像标签生成、参考解与评分入口脱离仓库运行时后仍能交接后端产物            | 不启动 Docker/Harbor；不能证明容器连接正确         |
| 保留的导入工具正确       | `import-tools/`；`npm run test:import-tools`                        | 在临时目录用小样例检查邮件导入保留已读状态、线程及正文                                                | 不导入整库、不重建当前任务、不参与任务评分         |
| CLI 自身代码正确         | `gyms/lark-cli/cli/**/*_test.go`；`npm run test:go`                 | Go 单元测试及 `go vet` 静态检查                                                                       | 不能代替 CLI → Mock → 评分器的业务流程测试         |
| 容器能完整运行           | `.github/workflows/ci.yml` 的 `container` job                       | Harbor 实际运行维护通知参考解和空操作；`scripts/check-harbor-results.py` 核对分别为 1/0、无异常和漏项 | 一个示例不代表 800 题已通过容器验收                |
| 模型评分配置可加载       | 同一 job 的离线配置步骤；`scripts/check-rewardkit-configs.py`       | 在断网评分镜像中让 RewardKit 加载各题配置、构造评分项                                                 | 不调用模型、不检查评分是否合理                     |
| 模型裁判能完成验收       | 手动工作流 `run_model_judges=true`；`harbor_plan` / `native-harbor` | 对全量任务运行参考解和空操作，必要时调用语义裁判，检查最终评分                                        | 会产生模型费用；不是模型选手的自主解题评测         |

## 每题验收为什么拆成这些文件

原 `migration.test.ts` 没有执行迁移，它是在每次代码变更后检查现有任务。现在拆成：

- `task-contracts/reference-solution.ts`：执行该题参考解，断言程序检查通过。
- `task-contracts/no-op.ts`：初始状态必须失败，或明确保留待语义判断的条件，不能把结构通过当作完整通过。
- `task-contracts/structural-scoring.ts`：构造漏操作、错误顺序、成员缺失、误改时间等反例，也检查声明允许的替代值。
- `task-contracts/semantic-handoff.ts`：需要理解文字含义的禁止内容必须交给语义裁判，不能退化成子串判定。
- `task-contracts/task-acceptance.test.ts`：只负责为每题组织上述四个具名子测试，失败报告直接显示验证目的。
- `helpers/task-fixture.ts`：只负责临时目录、独立 Mock、参考脚本执行和评分文件读写，不定义通过条件。

每题只执行一次参考解，复用其结果构造反例；不会为了分文件重复执行 800 题参考解。语义交接与结构评分子测试之间恢复状态和调用记录。部分反例直接改测试中的状态/历史，检验的是评分器，不代表这些错误全部来自真实 CLI 轨迹。`grading/` 还包含通过 CLI 变换操作路径的业务专项样例。

## 排错与添加测试

按被验证的行为选目录，不按来源批次或开发版本选目录。单个文件围绕一个接口能力或一条业务评分规则组织，允许把该规则的正例、反例、等价写法放在一起。跨目的的通用初始化放入 `helpers/`；数据样例放入 `fixtures/`；编译期接口约束放入 `types/`（由 `typecheck` 检查）。

例如检查文档状态一致性看 `environment/native-documents.test.ts`；检查合同发出前的状态约束看 `grading/contract-state-before-update.test.mjs`；检查语义裁判失败时如何处理看 `grading/evaluator-pipeline.test.ts`。版本号文件已改为业务名，例如原 `native-formal-v400` 现在是 `grading/coaching-metrics.test.mjs`。

只运行一个文件：

```bash
npx tsx --test tests/environment/native-documents.test.ts
```

`npm run oracle` 是 `packaging/standalone-entrypoints.test.mjs` 的兼容快捷命令，已被 `npm run check` 覆盖。完整容器入口见根 README 的 Harbor 运行说明。任务本身的隐藏评分代码仍由 `tasks/<name>/tests/` 拥有；本目录是开发者用来验证环境和评分代码的测试，不是另一套评分标准。
