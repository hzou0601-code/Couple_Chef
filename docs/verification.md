# 验证与环境

本地、远程CI、部署和平台审核各自独立记录。未执行不写通过。

## 本轮计划
- Java17 + backend/gradlew.bat test bootJar：业务/接口测试、H2迁移兼容与构建。
- PostgreSQL实际迁移/重启持久化/恢复：独立服务可用时验证；H2不能代替此证据。
- 前端：下一库存页面迭代按现有yarn锁文件安装，类型/静态检查及build:weapp；微信开发者工具实际交互另验证。
- git diff --check；确认无真实密钥。

## 环境与当前限制
第一轮基线仅Java26且未发现Docker/gh、无CI；现已有项目本地Java17、系统PG16.4和Docker CLI（引擎未启动），后端GitHub CI已运行成功。前端无node_modules、微信AppID/合法API域名未配置，无产品数据库部署凭据和生产权限。网络/工具不足按步骤记录，不关闭检查。

Java17已下载到项目忽略目录.tools/jdk17/jdk-17.0.20.1+1，官方Adoptium元数据与SHA256核对记录在本轮历史。运行时仅设置当前命令JAVA_HOME，未改系统Java。

## 开发启动（待真实PostgreSQL验证）
1. Java17、Docker Compose或独立PostgreSQL16；设置DB_PASSWORD为本地秘密，DB_USER可沿用couplechef。
2. 根目录 `docker compose up -d database`，检查健康状态。Compose只包含数据库，持久卷保存库存；不使用 `down -v` 清库。
3. 同一shell设置 `DB_URL=jdbc:postgresql://localhost:5432/couplechef`、DB_USER、DB_PASSWORD、JAVA_HOME，backend内执行 `./gradlew.bat bootRun`。Spring不会自动读取backend/.env.example；需导出变量。
4. 初次空数据库由Flyway V1/V2建表；Hibernate只validate。已有非空数据库没有Flyway历史时必须先备份、审计原schema和recipe_steps类型；禁止自动baseline掩盖差异，迁移方案单独确认（T006）。
5. `scripts/test-iteration-lock.ps1`使用隔离目录验证租约生命周期与恢复，不操作当前开发锁。

## 数据库恢复
迁移只前进：先备份（pg_dump）、在测试数据库恢复并验证，再应用迁移。失败时停止写入，恢复备份到独立数据库并核对版本/行数/应用接口，切换连接后再恢复服务。不得直接删除表或修改已应用的迁移以绕过失败。详细演练列入T006。

## 20261008-inventory-api-01 本地结果
最终工作树 `test bootJar`成功（Java17/Gradle8.14.3），15项测试、0失败：上下文1、菜单回归1、库存13。锁脚本隔离集成测试通过，TOML语法通过，diff空白检查通过。证据：iterations/evidence/20261008-inventory-api-01/summary.json和gradle-final.txt；完整本地测试报告backend/build/reports/tests/test/index.html。

首轮曾因Application只扫描menu仓库失败，已修复并全部重跑；最终结果包括新增小数版本号拒绝测试。编译UTF-8明确配置。Gradle存在9.0不兼容弃用提示，当前不升级包装器。真实PostgreSQL、远程CI、前端构建/交互、迁移恢复与部署均未执行。

## 20261008-postgres-ci-02
本地真实PostgreSQL16.4全部16测试通过（不跳过），H2的15通用测试通过且仅PG专用1项跳过；两个环境均无--write-locks执行test bootJar成功。数据库服务停止/重启探针与应用上下文重启持久化均通过。actionlint1.7.12静态验证通过。证据见iterations/evidence/20261008-postgres-ci-02。

远程GitHub Actions运行37730162383已completed/success，head_sha=e2d23456375c47b4b64485fd2be833bf28687a96；H2 tests/build与PostgreSQL16 integration/persistence两个job及其test/build步骤均success，证据remote-ci.json。只代表该实现提交的后端CI；后续纯文档提交不更改被测代码，不把此结果说成其他SHA的执行。未部署、未提审，main未合并。

连接真实测试库：设置TEST_DB_URL=jdbc:postgresql://127.0.0.1:15432/couplechef_test、TEST_DB_USER和TEST_DB_PASSWORD后执行backend/gradlew.bat test bootJar --no-daemon --console=plain。仅限独立测试数据库，接口测试会清理表；不要指向现有家庭库存库。不设置TEST_DB_*时使用H2。外部DB测试禁用缓存与UP-TO-DATE；切换环境会重跑测试。更新依赖时显式--write-locks并审查锁差异，常规验证/CI禁止自动改锁。

现有PostgreSQL安装可用于本地测试，不需要启动Docker。Compose与CI使用PostgreSQL16，Flyway上游支持版本提示保留在日志，T006评估依赖维护；不把警告当失败，也不声称上游已支持该版本。数据库备份恢复、完整CI门禁、微信和部署仍未验收。
