# 20261008-inventory-api-01

日期：2026-10-08 Australia/Sydney。初始HEAD：78c3599。初始Git工作区干净，无AGENTS.md，无DELIVERY.html。

## 计划
选择T001，故事/范围/验收见 DELIVERY.html。库存API尚无实现，优先建立可验证的真实库存数据来源。保留 Taro/React 微信小程序及 Spring Boot；不将旧 available 布尔值当作库存推荐。30分钟 heartbeat couple-chef-mvp 已启用。

## 技能评估
已读取 https://github.com/finfin/awesome-frontend-skills 目录。当前任务仅后端，先不套用网页框架技能；T002应选少量React状态/组件通用技能，读取SKILL.md并固定提交后记录，DOM/Next.js特有规则不适用小程序。

## 检查点
阶段：实现完成，验证进行中。已获得 .iteration/active.lock，runId同文档编号，2小时过期并已续租。Git分支经权限审查成功创建codex/inventory-api；未回滚任何文件。

## 实现
- 库存CRUD、按名称/分类/临期筛选、显式DTO和400/404/409错误；零库存合法；精度和单位白名单。
- 同名/单位/位置/日期的DB唯一批次key，NULL日期用none；NFKC规范化后strip，防兼容空白绕过重复。编辑/删除version防止旧页面覆盖，并用JPA乐观锁保护并发。
- PostgreSQL环境配置、Flyway V1旧菜单/V2库存、Hibernate validate；H2仅测试，不将H2称PG验证。
- 菜单text映射与三个读端点EntityGraph，避免新关闭open-in-view后旧菜单懒加载回归。
- 用户新要求：建立strict_reviewer独立只读审查agent；已启动并保存.codex/agents/strict-reviewer.toml、docs/review-agent.md与AGENTS.md每轮门禁。TOML语法校验通过，项目配置自动加载尚未在新会话验证。

## 验证进行中
- Java17从Adoptium官方元数据给出的下载链接获取至.tools，SHA256已匹配e53a79c3c3d86865bd7e787903884331068e71321714ffd44f145785affc7cb0，不改系统Java。
- `JAVA_HOME=<project>/.tools/jdk17/jdk-17.0.20.1+1; GRADLE_USER_HOME=<project>/.tools/gradle; ./gradlew.bat test bootJar --no-daemon --console=plain`运行中，日志.tools/backend-validation.log。
- 运行锁续租成功；第二runId抢锁被正确拒绝（未修改现有锁）。
- 审查已发现并修复菜单懒加载回归、NBSP规范化顺序问题；均新增回归测试，待执行结果与最终复审。

## 最终验证与交付
- 首轮14项测试因Application显式只扫描menu仓库而失败，已去掉该限制，恢复com.couplechef默认实体与仓库扫描；未删除测试或忽略失败。随后14项全部通过。
- 审查新增发现：小数version可能被Jackson截断为整数。已关闭ACCEPT_FLOAT_AS_INT并新增API回归，最终再次运行test bootJar：15测试0失败，BUILD SUCCESSFUL in 28s。
- `scripts/test-iteration-lock.ps1`实际PASS：正常获取/续租/释放、未过期冲突、所有者不符、过期归档、损坏锁拒绝/超时隔离恢复。初版原子Replace因PowerShell把null路径转换为空字符串失败，改显式备份路径后测试全部通过。
- `git diff --check`通过（只有CRLF提示）；审查TOML经Python tomllib解析有效；独立agent在本会话实际执行只读审查，新会话自动加载未验证。
- 最终日志与摘要已入库：evidence/20261008-inventory-api-01/gradle-final.txt、summary.json；JAR仅保存在backend/build/libs，摘要记录SHA256，不提交构建产物。
- 只读远程检查 `git ls-remote origin HEAD`成功，远程HEAD与初始78c3599一致；未推送、未运行远程CI、未部署、未提审。
- 本轮T001实现和本地验证完成；真实PostgreSQL接口/迁移未验收，因此下一唯一任务T001V：真实PG验证和后端CI基础。前端仍待T002，不宣称主链路或MVP完成。
- 本轮关联提交通过本运行编号定位：`git log --all --grep=20261008-inventory-api-01`；提交后交付页补充提交ID。
- strict_reviewer最终复审未发现剩余P0–P3缺陷，可接受本地API/H2/构建范围；报告保存在evidence/20261008-inventory-api-01/review.md，真实PG/CI/微信仍待验收。
