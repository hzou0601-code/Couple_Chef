# 20261010-api-declarations-09
## 恢复与计划
基线28f1c6b。上次08仅读取声明并取得锁；远程CI查询的自动审批因用量限制失败而未执行，未实现业务改动。检查Git仅README/compose用户改动与旧DELIVERY后，归档过期租约，取得09租约。
本轮唯一任务T002BV-A2a：短信返回拼写及getApp泛型约束两个明确错误。故事：开发者调用短信/获取应用实例能得到真实类型且不把错误参数静默放过。
验收：两个诊断消失；真实公共类型正负合同、修补安全/库存回归、严格库存/合同检查、ESLint、冻结安装/幂等、微信构建；完整类型记录未通过。固定Taro4.1.7官方原/后SHA，两文件原子补丁，无运行JS/依赖/编译门禁变化。A2其余声明留下一子任务。
用户README/compose保留且不提交；不触碰数据库/密码。无页面改动，不新增前端技能。严格只读审查最终diff。若审批仍不可用，保存检查点，提交/远程保持未执行。

## 实现
两个官方原文件SHA核对匹配；短信CallbackResul修正CallbackResult，getApp公共泛型传播Instance既有App约束。新增两文件manifest、精确路径白名单及公共类型正负用例；首次应用2，其他0。

## 验证检查点
冻结锁离线安装已是up-to-date，postinstall三manifest各0；非强制重装。原安全测试的sms已成为允许路径，改为other保持未知路径拒绝后重跑。上轮728ee6a两个远程运行/jobs实际completed/success，证据previous-remote-ci.json；不作为本轮远程结果。

23测试0失败；库存及公共合同tsc/ESLint/actionlint exit0；完整52→50仍exit2，两个目标诊断消失，微信构建/独立审查尚待。本轮无关闭检查。

微信构建exit0；初审无P0–P3，最终文档复审中。修正本轮末尾空行；提交主题fix(types): correct SMS and app instance declarations，保持完整门禁未通过。

## 交付
strict_reviewer最终无P0–P3，建议A2a本地限定验收；微信构建26.17秒exit0，diff --check通过。完整50仍exit2；下一A2b，MVP未验收。远程本轮待核对，上轮成功明确分开。仅暂存本轮文件，用户README/compose保留。

实现dd7da83已推送；同SHA远程状态见remote-ci.json，未将运行中标通过。最终交付页记录SHA。
