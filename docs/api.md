# 库存 API v1

前端 → Spring Boot `/api/storage` → PostgreSQL。默认仅监听127.0.0.1；当前仅本地单家庭开发，无公网部署授权。金额/数量使用十进制，范围0..999999999.999，最多3位小数，不进行跨单位隐式合并。

成功：`{ "success": true, "message": "ok", "data": ... }`。
错误：`{ "success": false, "message": "可展示信息", "data": null, "code": "VALIDATION_ERROR" }`，使用真实HTTP状态码。当前规范作用域为库存模块；旧菜单迁移到该规范列入后续任务。

|方法|路径|行为|
|---|---|---|
|GET|`/api/storage` 或 `/api/storage/list`|返回数组，空库存为[]；可组合search（名称NFKC/大小写/首尾空白规范化后子串），category，expiringDays（0..30）|
|GET|`/api/storage/{id}`|返回单批次；未知ID 404|
|POST|`/api/storage`|创建；201；重复批次409|
|PUT|`/api/storage/{id}`|全量编辑；必须提供当前version；过期版本409|
|DELETE|`/api/storage/{id}?version=0`|删除；未知ID404；过期版本409；成功data=null|

写入字段：name（1..80），quantity，unit（g/kg/ml/l/个），location（1..40），category（蔬菜/肉禽/水产/蛋奶/主食/调味/其他），可选expiresOn（ISO YYYY-MM-DD，年份1..9999），更新时version（非负整数）。返回同字段加id/version，不暴露内部重复key。零数量合法；过期日期合法，让用户盘点；无日期不参与临期结果。

临期包含已过期批次与当天至cutoff（闭区间），今天按Australia/Sydney计算。过期不能默认为可食用；T003默认排除过期和零库存推荐。

重复边界：NFKC规范化名称、不区分大小写和首尾空白；单位相同；位置NFKC/小写/去首尾空白；同到期日（含无日期）；不同分类不绕过重复。不自动比较/合并g与kg，后续推荐按维度换算。

400 VALIDATION_ERROR；404 NOT_FOUND；409 INVENTORY_CONFLICT或STALE_VERSION。冲突均不得部分修改或新增；界面应刷新列表并提示用户编辑已有记录。

## 小程序客户端（T002A）
src/api/storage.ts使用Taro.request，返回已拆出的data（不再返回Axios response）；目前无旧库存调用方，因此未改菜单API。InventoryApiError携带code/status/message；HTTP错误保留后端稳定code，网络/超时统一NETWORK_ERROR，损坏响应PROTOCOL_ERROR，缺失/非法构建配置CONFIG_ERROR。方法始终返回Promise，错误以rejection传递，由页面显示，不自动toast或重试写请求。

构建shell设置TARO_APP_API_BASE_URL为含/api的HTTP(S)根地址，config/index.ts编译为INVENTORY_API_BASE_URL。前端.env.example只是示例，必须自行设置环境变量，不保证自动加载。支持DNS（国际域名用ASCII形式）或IPv4与有效端口；当前不支持IPv6字面地址，不使用浏览器URL/URLSearchParams。真机需HTTPS合法request域名；localhost只适用于本机开发，本客户端无默认localhost。

Node24下执行`node --test tests/storage-client.test.mjs`，直接测试实际纯TypeScript客户端，无新增运行依赖。依赖按现有yarn锁安装后可用`yarn typecheck:api`聚焦检查；全项目类型/构建/微信交互仍列T002B/D，局部类型通过不能替代其证据。
