# 20261010-request-params-10
## 计划
基线6b5af72，Git仅README/compose用户修改；无活动锁，本轮已取得租约。
唯一任务T002BV-A2b：补齐缺失RequestParams，核对锁定Taro4.1.7实际拦截器链源/声明。故事：开发者能安全读取及传递拦截器参数，拒绝非法字段类型、不把未知data当成已验证库存。
范围仅缺失声明及正负合同，不改运行JS/请求调用/依赖。优先本地模块增强，避免为已打补丁文件增加迁移状态复杂度。
验收：两个RequestParams错误消失；实际公共Chain字段/回调/非法参数正负检查，库存及补丁23测试、ESLint、冻结安装/幂等、微信构建，完整诊断留存与独立只读审查。完整类型/真实微信未通过不标验收；用户改动不暂存。
本轮无UI改动，无新增前端技能。数据库不操作。下一任务A2c其余明确API声明。

## 实现
读取node_modules/@tarojs/api/dist/interceptor/chain.js.map的原src/声明：IRequestParams所有字段可选，data为unknown；公开Taro.request.Option提供更完整合法方法/回调。模块增强RequestParams extends Partial<Omit<request.Option<unknown>,data>>，data?:unknown，保留公开请求选项、未知响应和字段验证边界。合同显式包含增强文件，库存聚焦同样包含；根类型目录原本已包含。首次公共合同tsc通过。

## 验证
23测试全过；库存与公共合同tsc、ESLint/actionlint exit0；完整50→48仍exit2，RequestParams目标错误消失。冻结离线安装up-to-date和原补丁幂等，不是强制重装。上轮dd7da83远程最终证据与本轮分开。构建/最终审查运行中。

审查P2复现：初始unknown响应固定回调会拒绝合法带显式响应回调Option；已改RequestParams<T=unknown>并增加泛型proceed重载，返回沿用原interceptor返回类型，既保持默认unknown读取又允许显式响应回调安全传递。新增合法typedOptions及非法typed回调负例，公共合同重跑通过。

## 交付
P2兼容回归修复后strict_reviewer最终复审无P0–P3；独立库存/合同检查通过。微信构建exit0（5.41秒），随后仅声明改动不变运行源码；diff --check通过。A2b本地限定验收；本轮远程尚待；完整48未通过，下一A2c。提交主题fix(types): define safe interceptor request parameters；用户README/compose不暂存。
