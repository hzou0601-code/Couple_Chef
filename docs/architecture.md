# 架构与决策

## 基线（2026-10-08）
单仓库：frontend/couplechef-frontend 为 Taro 4.1.7、React 18、TypeScript；backend 为 Spring Boot 3.2、Java 17、Gradle 8.14.3。保留选择，微信 project.config.json 为平台证据，AppID 是 touristappid。

## 本轮决策
- 服务边界：Taro 经 HTTP API 访问 Spring Boot；只有后端访问数据库。不另拆仓库。
- 开发/部署采用独立 PostgreSQL 服务；H2 仅测试。Flyway 版本迁移、Hibernate validate，不使用运行时自动改表。
- 库存以批次保存，名称/单位/位置/到期日组成重复边界；重复返回409，由用户编辑原记录，避免隐式合并不同保质期。分类为受控字段，数量允许0表示空批次。
- 单位先限定 g/kg/ml/l/个，仅将相同维度单位转换（推荐任务实现）；禁止把个数与重量直接比较。
- MVP 无账户与多租户：暂按单个家庭后端数据集运行。正式共享部署前确认访问控制与家庭隔离（T008），不能暴露公共可写API。
- 推荐用结构化数据和纯规则；做饭扣减需数据库事务、并发保护和请求幂等记录，后续独立任务实现。
- 新基础设施仅数据库与迁移，满足用户独立数据库要求，不增加队列或付费AI。

## 恢复与运行锁
每轮使用 scripts/iteration-lock.ps1 acquire/renew/release；.iteration/active.lock 记录 runId/startedAt/expiresAt，默认2小时。未过期直接退出不修改；长任务续租。guard互斥序列化操作，完整临时JSON通过不覆盖Move发布新锁或File.Replace原子续租。过期先查看检查点/Git，不回滚，再归档旧锁并获取。释放必须匹配runId。损坏锁默认拒绝，先检查Git/检查点且最后写入已超过最大租约240分钟后才可acquire -RecoverCorrupt隔离并恢复。运行数据不入Git。
