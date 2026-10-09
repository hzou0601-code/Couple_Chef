# 20261009-inventory-client-03

日期：2026-10-09 Australia/Sydney；基线592410c；分支codex/inventory-api；初始Git干净，无活动锁，已取得本轮2小时租约。

## 计划
T002拆分：T002A库存API客户端 → T002B只读列表/搜索与加载空错状态 → T002C新增编辑删除与成功反馈 → T002D微信构建/交互及视觉验收。

本轮仅T002A。故事：作为库存页面开发者，我需要小程序兼容且类型明确的API客户端，以展示真实库存和正确处理冲突。

验收：使用Taro.request；覆盖列表/单条/新增/编辑/删除及version；配置API根地址而非硬编码localhost；400/404/409、业务失败、网络/超时和损坏响应可区分；无自动重试写操作，无假数据回退；依赖注入的真实客户端逻辑自动化测试通过。本轮不修改页面或声称微信交互/完整构建已验收。

验证：Node24原生TypeScript擦除执行node:test；聚焦TypeScript严格检查；独立strict_reviewer；diff检查。前端全部依赖按锁安装与微信构建列入后续页面任务，不以局部检查替代全项目构建。

## 技能
来自finfin/awesome-frontend-skills目录的wshobson/agents react-state-management，提交46891e7e60da0e52baf1050b7b6391b64e84c6d9，已完整读取plugins/frontend-mobile-development/skills/react-state-management/SKILL.md。采用Type everything、Separate concerns、Don't duplicate server state；本轮客户端保持无状态，不引入React Query/额外状态库，不套用DOM/React Router示例。原文缓存.tools/react-state-management-SKILL.md。

## 检查点
交付完成，T002A限定范围验收通过；先前两轮验证证据保留，未更改用户已有代码。

## 实现与验证
- Taro.request轻适配器与纯无状态类型化客户端，覆盖CRUD/version、过滤编码（含0天）、规范化API根地址。请求超时10秒；不自动重试写请求、不toast、不假数据回退；返回拆出的data，错误通过Promise rejection交给页面。
- 错误保留400/404/409后端code；网络/超时统一NETWORK_ERROR；损坏响应PROTOCOL_ERROR；非法配置CONFIG_ERROR。响应检查id/version安全整数、库存非负、受控单位/分类与真实公历日期。
- strict_reviewer复现非法端口/空host/破损IPv6地址通过校验、无效日期被接受两项P2。均已修复并加回归；MVP配置明确只支持DNS/IPv4根地址，不支持IPv6字面地址。
- Node24直接执行实际.ts，10项测试通过；仅有MODULE_TYPELESS_PACKAGE_JSON解析提示，保留现有CommonJS/Babel工程配置，不为消除此提示改模块体系。
- TypeScript5.9.3与Taro4.1.7均按现有yarn.lock的完整SHA512核对下载至.tools；使用真实官方类型严格检查storageClient.ts/storage.ts与global.d.ts，通过。聚焦配置tsconfig.inventory.json可在完整依赖安装后复用，本轮临时配置只映射.tools内真实Taro类型且skipLibCheck，不声称全项目检查。
- 新增Inventory client tests CI仅Node24内置测试，不安装任何额外依赖；远程运行37875308860已按实现SHA核对成功。后端工作流不改动。
- 整个前端依赖尚未安装、微信构建/交互未执行，T002整体仍未验收。

## 交付
实现提交2978692b2c102c9c08faca4ba37c100fbb9fe879已推送codex/inventory-api。GitHub客户端运行37875308860与后端运行37875308815均completed/success；工作/步骤证据remote-ci.json。独立审查最终无剩余可行动缺陷，见evidence同目录review.md。

本轮T002A验收通过；T002整体与MVP未验收。下一轮唯一首选T002B：冻结锁安装、只读列表/搜索与加载空错状态、设计变量/组件及微信构建。完整类型检查/微信构建/实际请求与页面交互仍未执行；无部署、未合并main、未正式提审。随后纯证据文档提交不冒称已运行其他SHA的CI。

## 交付
实现提交2978692b2c102c9c08faca4ba37c100fbb9fe879已推送codex/inventory-api。客户端运行37875308860与后端运行37875308815均completed/success；工作/步骤证据在evidence同目录remote-ci.json。独立审查最终无剩余可行动缺陷，见review.md。

T002A验收通过；T002整体与MVP未验收。唯一下一任务T002B：冻结锁安装、只读列表/搜索与加载空错状态、设计变量/组件及微信构建。完整前端类型/构建/真实请求与页面交互未执行，无部署、未合并main、未正式提审。后续证据文档提交不冒称其他SHA已运行CI。
