# Couple Chef

库存管理、按库存推荐晚餐和确认做饭后扣减库存的微信小程序。技术栈：Taro 4.1.7 / React 18 / TypeScript，Spring Boot 3.2 / Java 17，独立 PostgreSQL 16 / Flyway。

**MVP 开发中。** 当前库存 API 支持新增、编辑、删除、查询、搜索、分类和临期筛选；小程序库存页目前为只读列表。表单、晚餐推荐、确认扣库存仍待实现。完整 TypeScript 检查尚有 59 条已知诊断；微信真实交互、端到端链路及数据库恢复尚未验收。最新状态以 [DELIVERY.html](DELIVERY.html) 为准。

以下命令面向 Windows PowerShell。除首次克隆外，使用 `D:\Couple_Chef` 作为项目路径；每个终端的环境变量独立。命令失败时先解决错误，再执行下一步。

## 1. 获取项目与准备环境

已有项目直接进入目录，不要重新克隆覆盖改动。新机器执行：

```powershell
git clone https://github.com/hzou0601-code/Couple_Chef.git D:\Couple_Chef
Set-Location D:\Couple_Chef
git status --short
git branch --all
```

当前开发成果位于 `codex/inventory-api`，尚未合并 main。新克隆且工作树干净时执行：

```powershell
git switch codex/inventory-api
```

准备 Git、JDK 17、Node.js 24.x（测试直接读取 TypeScript）、Yarn 1.22.22、Docker Desktop 的 Linux 容器引擎，以及微信开发者工具。已有独立 PostgreSQL 16 可替代 Docker 数据库。将 JDK 的安装目录配置为 `JAVA_HOME`，并将其 `bin` 加入 PATH；检查：

```powershell
java -version
node --version
npm install --global yarn@1.22.22
yarn --version
docker version
docker compose version
Set-Location D:\Couple_Chef\backend
.\gradlew.bat --version
```

Gradle Wrapper 自动使用项目固定版本，不需要全局 Gradle。首次安装需要网络。工具下载入口：[Java 17](https://adoptium.net/temurin/releases/?version=17)、[Node.js](https://nodejs.org/en/download)、[Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/)、[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。

## 2. 启动独立数据库

先启动 Docker Desktop，确认引擎可用。在终端 A 执行：

```powershell
Set-Location D:\Couple_Chef
$env:DB_USER = 'couplechef'
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host '设置本地数据库密码' -AsSecureString)).Password
docker compose up -d database
docker compose ps
docker compose logs --tail 50 database
```

等待数据库显示 healthy。数据库名为 `couplechef`，端口仅映射 `127.0.0.1:5432`，数据保存在命名卷中。已有卷的密码不会因更改环境变量自动更新，重启时使用原密码。若 5432 已被已有 PostgreSQL 占用，直接使用该服务，并通过其管理工具创建独立 `couplechef` 数据库和用户，不同时启动此容器。

配置示例在 [backend/.env.example](backend/.env.example)，不包含真实密钥。Spring Boot 不会自动加载这个示例文件；按下面步骤设置终端环境变量。不要把真实密码提交到仓库。

## 3. 启动后端

继续使用终端 A（保留上一步的 DB_USER / DB_PASSWORD）：

```powershell
Set-Location D:\Couple_Chef\backend
$env:DB_URL = 'jdbc:postgresql://127.0.0.1:5432/couplechef'
$env:SERVER_ADDRESS = '127.0.0.1'
.\gradlew.bat bootRun --no-daemon --console=plain
```

应用监听 `http://127.0.0.1:8080`，启动时自动执行 Flyway 版本化迁移，Hibernate 只校验结构。新数据库无需手工建业务表。已有非空数据库若缺少 Flyway 历史，应先备份和核对迁移，不要直接 baseline 或删除历史。

终端 B 验证：

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/storage'
```

成功响应包含 `success=true` 和 `data`；空库存的 data 为数组 `[]`。后端用 Ctrl+C 停止。也可在完成第 6 节构建后、同样配置数据库环境变量的终端执行：

```powershell
Set-Location D:\Couple_Chef\backend
java -jar .\build\libs\demo-0.0.1-SNAPSHOT.jar
```

当前 API 尚无账户/家庭隔离，默认只用于本机开发。测试环境的访问边界待 T008，生产发布与小程序正式提审待授权。

## 4. 安装前端并构建微信小程序

终端 B 执行：

```powershell
Set-Location D:\Couple_Chef\frontend\couplechef-frontend
yarn install --frozen-lockfile --non-interactive
$env:TARO_APP_API_BASE_URL = 'http://127.0.0.1:8080/api'
yarn build:weapp
```

输出为 `frontend/couplechef-frontend/dist`。API 地址必须带 `/api`，在构建时写入产物；更换地址后重新构建。地址为空会显示配置错误，不自动使用 localhost。[前端环境示例](frontend/couplechef-frontend/.env.example)仅供参考，按上面步骤显式设置变量。

开发时以持续构建替换一次性构建：

```powershell
yarn dev:weapp
```

用 Ctrl+C 停止监听。不混用 npm install / Yarn 安装，也不更新锁文件来绕过安装错误。若默认 registry 网络不可达，可在保留冻结锁的前提下使用：

```powershell
yarn install --frozen-lockfile --non-interactive --registry https://registry.npmjs.org
```

安装生命周期会应用固定版本、带 SHA 校验的 Taro 声明修补，详见 [type-patches/README.md](frontend/couplechef-frontend/type-patches/README.md)。不要关闭 postinstall 或哈希保护；版本/内容不匹配应先调查。

## 5. 微信开发者工具操作

1. 打开微信开发者工具并登录，选择“导入项目”。
2. 项目目录选择 **`D:\Couple_Chef\frontend\couplechef-frontend`**。其中 `project.config.json` 的 `miniprogramRoot=./dist` 指向已构建产物，不要导入 `src`。
3. 当前配置为 `touristappid`，可尝试游客本地调试；若工具要求实际 AppID，使用你有权限的测试小程序 AppID，更新根 `project.config.json` 的 `appid` 后重新构建和导入。AppID 与 AppSecret 不同，不要在前端放 AppSecret。
4. 本机模拟器连接 HTTP 后端时，在项目详情的本地设置中临时启用“不校验合法域名、web-view 域名、TLS 版本以及 HTTPS 证书”（不同工具版本名称可能略有差异）。项目默认 `urlCheck=true`；此项仅用于本机调试，真实环境恢复校验。
5. 编译后进入库存页面，检查加载、空库存、已有数据、搜索/分类/临期和错误重试。使用第 7 节 API 创建测试库存；当前页面没有新增/编辑表单。调试器的 Network / Console 用于定位请求和运行错误。
6. 真机预览需工具权限、真实 AppID，以及手机可访问的 HTTPS API 和已配置的合法 request 域名。手机上的 `127.0.0.1` 指手机自身，不能连接电脑后端。配置测试环境和访问边界后，再替换 API 地址并重建；当前不以模拟器成功代替真机验收。

本机已发现工具 1.06.2504040，CLI 路径如下；其他机器按实际安装路径修改变量。CLI 的 `--help` 和 `open --help` 已核对，实际打开/交互尚未验收。工具若提示服务端口关闭，在工具设置的安全设置中开启服务端口再重试。

```powershell
$taskWeChatCli = 'C:\Users\ROG\微信web开发者工具\cli.bat'
& $taskWeChatCli --help
& $taskWeChatCli open --project 'D:\Couple_Chef\frontend\couplechef-frontend'
```

参考：[微信 CLI](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html)、[网络请求约束](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)、[Taro 项目配置](https://docs.taro.zone/docs/project-config)。当前没有已验收的微信自动化交互测试；本说明不包含生产上传或正式提审指令。

## 6. 运行检查与构建

前端，在其目录执行：

```powershell
Set-Location D:\Couple_Chef\frontend\couplechef-frontend
yarn test:inventory
yarn test:type-patches
yarn lint:inventory
yarn lint:type-patches
yarn typecheck:api
yarn typecheck
$env:TARO_APP_API_BASE_URL = 'http://127.0.0.1:8080/api'
yarn build:weapp
```

最近实现验证中，库存及修补安全测试共 22 项通过，局部类型、所列 ESLint 和微信构建通过；**完整 `yarn typecheck` 仍失败（59 条诊断）**，后续 T002BV-A/X 修复。局部检查和已有远程 CI 不等于完整门禁通过。统一格式检查和主要业务 E2E 门禁仍待 T006，不存在可宣称全部检查通过的一条命令。

后端默认测试使用 H2，无需开发数据库；先清理测试覆盖变量：

```powershell
Set-Location D:\Couple_Chef\backend
Remove-Item Env:TEST_DB_URL,Env:TEST_DB_USER,Env:TEST_DB_PASSWORD -ErrorAction SilentlyContinue
.\gradlew.bat test bootJar --no-daemon --console=plain
```

默认测试会跳过真实 PostgreSQL 专属用例。要验证 PostgreSQL，使用**独立测试库**，测试会清理业务数据，绝不能指向开发/生产库。以下创建命令只在首次创建测试库时执行；已有同名库无需重复创建：

```powershell
Set-Location D:\Couple_Chef
$env:DB_USER = 'couplechef'
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host '输入同一数据库密码' -AsSecureString)).Password
docker compose exec database createdb -U $env:DB_USER couplechef_test
Set-Location D:\Couple_Chef\backend
$env:TEST_DB_URL = 'jdbc:postgresql://127.0.0.1:5432/couplechef_test'
$env:TEST_DB_USER = 'couplechef'
$env:TEST_DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host '输入同一数据库密码' -AsSecureString)).Password
.\gradlew.bat clean test bootJar --no-daemon --console=plain
Remove-Item Env:TEST_DB_URL,Env:TEST_DB_USER,Env:TEST_DB_PASSWORD -ErrorAction SilentlyContinue
```

后端 HTML 报告：`backend/build/reports/tests/test/index.html`；可执行包：`backend/build/libs/demo-0.0.1-SNAPSHOT.jar`。最近 PostgreSQL 实际验证为 16 项通过、零跳过；详细命令、局限和远程证据见 [验证文档](docs/verification.md) / [交付页](DELIVERY.html)。本 README 更新未重跑整套构建。

GitHub Actions 定义在 [.github/workflows](.github/workflows)。查看每次提交的实际结果：[Actions](https://github.com/hzou0601-code/Couple_Chef/actions)。远程流水线成功、测试环境部署、生产上线和微信审核是不同状态。

## 7. 库存 API 操作示例

这些命令会修改**本地开发库**，请在独立测试数据上操作。完整字段、重复边界和错误契约见 [docs/api.md](docs/api.md)。示例使用 UTF-8 请求体，兼容 Windows PowerShell 中文编码。

```powershell
$taskApi = 'http://127.0.0.1:8080/api/storage'
$taskIngredient = @{
    name = '示例番茄-' + [DateTime]::UtcNow.ToString('yyyyMMddHHmmssfff')
    quantity = 500
    unit = 'g'
    location = '冷藏'
    category = '蔬菜'
    expiresOn = $null
}
$taskJson = $taskIngredient | ConvertTo-Json
$taskCreated = Invoke-RestMethod -Method Post -Uri $taskApi -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($taskJson))
$taskId = $taskCreated.data.id
Invoke-RestMethod -Uri "$taskApi/$taskId"

$taskIngredient.quantity = 300
$taskIngredient.version = $taskCreated.data.version
$taskJson = $taskIngredient | ConvertTo-Json
$taskUpdated = Invoke-RestMethod -Method Put -Uri "$taskApi/$taskId" -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($taskJson))

$taskSearch = [uri]::EscapeDataString('番茄')
$taskCategory = [uri]::EscapeDataString('蔬菜')
Invoke-RestMethod -Uri "${taskApi}?search=$taskSearch&category=$taskCategory"
Invoke-RestMethod -Uri "${taskApi}?expiringDays=3"

$taskVersion = $taskUpdated.data.version
Invoke-RestMethod -Method Delete -Uri "$taskApi/${taskId}?version=$taskVersion"
Invoke-RestMethod -Uri $taskApi
```

数量允许 0..999999999.999，最多三位小数；单位为 g/kg/ml/l/个，分类为蔬菜/肉禽/水产/蛋奶/主食/调味/其他。到期日可为空或 ISO 日期；上述无日期示例不会出现在临期结果。临期包含已过期批次，日期按 Australia/Sydney 计算。

400 为输入错误，404 为记录不存在；409 的 `INVENTORY_CONFLICT` 表示重复批次，`STALE_VERSION` 表示版本冲突。遇版本冲突重新读取记录，再决定修改；不要盲目重试写入。更新和删除必须使用最近返回的 version。当前 CRUD 不自动合并不同单位，晚餐推荐的兼容单位换算尚待实现。

## 8. 数据备份、恢复与停止

Docker 数据库可生成备份到容器临时目录，再复制到仓库外；不要用 PowerShell 文本重定向输出二进制备份。以下备份包含实际库存，按本地数据妥善保存：

```powershell
Set-Location D:\Couple_Chef
$env:DB_USER = 'couplechef'
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host '输入同一数据库密码' -AsSecureString)).Password
$taskBackupDir = Join-Path $env:USERPROFILE 'CoupleChefBackups'
New-Item -ItemType Directory -Force -Path $taskBackupDir | Out-Null
$taskBackupFile = Join-Path $taskBackupDir ('couplechef-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ') + '.backup')
docker compose exec -T database pg_dump -U $env:DB_USER -d couplechef -Fc -f /tmp/couplechef.backup
docker compose cp database:/tmp/couplechef.backup $taskBackupFile
```

恢复演练使用一个**新建且独立的库**，不要覆盖原库；沿用刚才的变量：

```powershell
$taskRestoreDb = 'couplechef_restore_' + [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
docker compose cp $taskBackupFile database:/tmp/couplechef.restore.backup
docker compose exec database createdb -U $env:DB_USER $taskRestoreDb
docker compose exec -T database pg_restore -U $env:DB_USER -d $taskRestoreDb --exit-on-error /tmp/couplechef.restore.backup
```

恢复后应核对记录、Flyway 历史，并让后端以恢复库的 DB_URL 启动做读写检查；不同实例需不同 SERVER_PORT。此恢复流程尚未执行验收，属于 T006 剩余工作。迁移失败先保存日志、备份及当前状态，按恢复检查点处理；不通过删除 Flyway 历史或清空库存来获得通过。

停止前后端分别 Ctrl+C，停止数据库：

```powershell
Set-Location D:\Couple_Chef
docker compose stop database
```

所有 Docker Compose 命令（包括 exec、cp、stop）都需当前终端已设置 DB_PASSWORD，否则配置解析会失败；停止命令可在终端 A 执行。下次按第 2 节设置同一密码，再使用 `docker compose up -d database` 继续。停止服务保留命名卷；`docker compose down -v` 会删除库存数据，不用于日常停止。

## 9. 参与开发与定时任务

每次修改前先读 [AGENTS.md](AGENTS.md)、[DELIVERY.html](DELIVERY.html) 及其链接。每 30 分钟的开发任务已配置；手动开发也应遵循同一租约，避免重叠：

```powershell
Set-Location D:\Couple_Chef
git status --short
$taskRunId = 'manual-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
.\scripts\iteration-lock.ps1 -Action acquire -RunId $taskRunId
```

获得租约后才改文件。租约默认两小时，长任务续租，完成后仅释放自己的 runId：

```powershell
.\scripts\iteration-lock.ps1 -Action renew -RunId $taskRunId
.\scripts\iteration-lock.ps1 -Action release -RunId $taskRunId
```

活动锁不能绕过；过期恢复前核对 Git 和上次检查点，脚本按规则归档旧锁。每轮只选一个依赖满足的小任务，记录故事/验收/验证，计划、实现、验证、交付各阶段更新交付页；保留用户改动。代码迭代须由 [严格审查 agent](docs/review-agent.md) 只读审查最终 diff 和证据，修复 P0/P1 后才能验收并提交。完成可追溯提交，不将未执行检查写为通过。

需求：[docs/requirements.md](docs/requirements.md)；架构：[docs/architecture.md](docs/architecture.md)；任务：[docs/backlog.md](docs/backlog.md)；运行历史：[docs/iterations](docs/iterations)。MVP 验收后停止新增功能。

## 常见问题

|现象|处理|
|---|---|
|Docker 无法连接引擎|启动 Docker Desktop 的 Linux 引擎，再运行 docker version；无 Docker 时用独立 PostgreSQL 16。|
|数据库密码缺失/认证失败|在启动后端的同一终端设置 DB_PASSWORD；已有数据库卷使用原密码。|
|后端 8080 被占用|停止旧实例，或设置 SERVER_PORT 并同步修改前端 API 地址重建。|
|微信找不到 app.json|先成功运行 build:weapp，导入前端根目录，检查 miniprogramRoot 指向 dist。|
|库存页提示配置错误|构建前设置 TARO_APP_API_BASE_URL，包含 /api，并重新构建。|
|请求失败/域名错误|先确认后端可读；检查模拟器本地设置，真机检查 HTTPS、合法 request 域名和可达性。|
|完整类型检查失败|当前已知阻塞见 T002BV-A/X；保留诊断，不关闭门禁或扩大 skipLibCheck。|
|Flyway 校验/迁移失败|保留失败日志、检查连接库和迁移历史，先备份再评估恢复；不要手工改已应用迁移。|
