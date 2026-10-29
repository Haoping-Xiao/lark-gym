# Mock 新建对象的 ID 范围

检查对象为 `gyms/lark-cli/src/mock/domains/` 中实际注册的新建路由，不将未实现能力算作已覆盖。此表只核对 ID 生成，不宣称完整接口保真。

| 对象                                     | 实现             | ID 方式与已有数据处理                                                                           |
| ---------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| IM 消息                                  | im/routes.ts     | om_N，分配前跳过 world.messages 已有 ID；seed 和序列化状态重载都有读回回归                      |
| 群                                       | im/chats.ts      | oc_created_N，查现存 chats 后分配                                                               |
| Base 记录（单条/批量）                   | base/routes.ts   | rec_created_N，查全部 Base 记录后分配                                                           |
| Calendar 日程                            | calendar.ts      | evt_N，查全部现存 events 后分配                                                                 |
| Calendar 参与人                          | calendar.ts      | att_N，查所有事件参与人后分配；相同邮箱复用                                                     |
| Docs 文档                                | docs.ts          | doxcnMockN，查文档集合后分配                                                                    |
| Drive 文件夹                             | drive.ts         | fldMockN，查文件夹集合后分配                                                                    |
| 邮件草稿及对应消息                       | mail-messages.ts | randomUUID；更新草稿复用原 ID，发送复用关联消息。不使用重启归零计数器；未进行 UUID 碰撞注入测试 |
| 邮件标签                                 | mail-messages.ts | UUID 的 56 bit 片段转十进制；没有显式碰撞重试。未复现碰撞，此表不将其声称为已修复缺陷           |
| Sheets 工作簿/子表、Wiki 节点、Base 字段 | 对应域路由       | 未实现资源新建；单元格写入、元数据读出不等于创建资源                                            |
| 联系人                                   | contact.ts       | 从来源身份构建确定性映射，不提供新建联系人路由                                                  |

IM 回归使用真实 HTTP 服务：既检查列表与详情指向新消息，也检查历史消息未被覆盖。其他顺序 ID 路径为源码核对，本轮未逐一新加重启回归；跨组件全操作读写一致性属于后续审计范围。
