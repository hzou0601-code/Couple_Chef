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

## 真实数据库验证与CI（T001V）
- 默认H2仅作快速回归；TEST_DB_*显式指定独立测试库，真实PG测试必须检查数据库产品为PostgreSQL，关闭/重开应用与连接池读取持久化库存。
- 外部数据库状态不由源文件决定，因此其测试禁用Gradle跳过/缓存；URL参与任务输入，不将密码作为输入或写入证据。
- Gradle严格依赖锁与wrapper分发校验；CI分两个干净Ubuntu job运行H2和PG16，固定action SHA、只读仓库权限，不部署。
- 本地已有PG16.4二进制，创建项目内临时独立测试集群；测试结束停止，只保留忽略目录中的数据/日志。CI使用一次性服务和示例凭据，无产品数据或真实密钥。
- 当前Spring Boot管理的Flyway对PG16有上游未测试提示，本地PG16.4已实测通过；依赖支持维护由T006评估，不通过关闭迁移校验处理警告。

## 库存只读页（T002B）
页面只持有输入草稿/已应用query与单份服务器列表状态；无新增全局状态库/请求缓存。独立loader使用generation防止旧响应覆盖新筛选，并在隐藏/卸载时失效。复用原生Taro Button和PageState；Sass变量编译为微信rpx，使用margin而非依赖flex gap。列表不按前端时区猜测日期，只展示后端ISO日期与临期筛选含过期的说明；不隐式扣减库存。
