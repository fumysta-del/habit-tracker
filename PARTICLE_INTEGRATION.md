# 首页粒子背景接入结果

日期：2026-10-05。仅在测试副本完成，不部署、不提交、不继续调整视觉。

## 交付

1. `E:\habit-tracker` 未写入；记录的62个原项目源码、public资源和根配置文件SHA256全部一致。
2. 测试副本：`E:\habit-tracker-particle-test`。
3. 原组件的10个文件哈希全部一致。复制到 `src/lib/particle-effect/` 的 `ParticleEffect.js`、`config.js`、`index.js`、`shaders/index.js` 四个文件与原组件逐字相同。
4. 新增薄 React Wrapper：`src/components/ParticleBackground.tsx`；只负责ref、初始化和卸载时destroy，不参与每帧更新。
5. 原有文件仅修改 `src/App.tsx`：增加import和首页条件挂载。新增 `ParticleBackground.css`、粒子核心四文件及 `index.d.ts` 最小类型声明。存储、页面结构、导航和业务处理函数未改。
6. 没有新增npm依赖。通过 `pnpm install --frozen-lockfile` 安装原锁定版本；package.json与pnpm-lock.yaml哈希未变。
7. 核心背景透明，未引入组件Demo深色背景；保留Habit Tracker当前实际主题。
8. 无需点击即可交互，测试所有鼠标移动buttons=0。
9. 左右上下方向正常；本轮快划峰值1.3994，慢划0.8818；停止后1秒场强从1.0327降至0.01594。保留原算法的轨迹、衰减和恢复。
10. 添加按钮、任务打卡、导航及日期控件操作通过。
11. 输入和hover正常。
12. 原浏览器滚动正常；没有新增滚动库或滚轮拦截。
13. 新增任务、完成记录、history与刷新后的localStorage持久化检查通过；storage.ts及AppData结构未修改。测试完成后恢复测试浏览器的原本地数据。
14. 最终检查无React运行错误，WebGL getError=0。
15. 本机1280×720浏览器rAF采样：集成前约195 FPS，集成后约221 FPS，未见明显下降。采样会随设备负载变化，不代表性能提升或其他设备保证；页面无FPS面板。
16. 启动：在本目录执行 `pnpm dev --host 127.0.0.1 --port 5180 --strictPort`。交付时服务已运行，无需重复启动。
17. 地址：<http://127.0.0.1:5180/>。
18. 仅首页显示，背景容器fixed/inset:0，位于现有装饰背景之后、主体UI之前；粒子z-index:0，内容z-index:1。Canvas及容器pointer-events:none。切换任务/成长/个人页面不显示粒子。
19. 与独立Demo相比，颜色、尺寸、DPR、方向和速度场算法没有变化。背景改为现有页面，UI会按层级遮挡其下粒子；浅色背景下白点更柔和。未改变颜色、透明度、力度、Shader或粒子数量。

## 验证范围

副本集成前、集成后 `pnpm build` 均通过。没有建立compare.js、lifecycle harness或新测试框架。仅完成页面集成检查；最终截图一次：`integration-preview.png`。

业务交互检查期间在测试浏览器内使用了Supabase接口模拟响应，验证的是前端交互与本地持久化，未把此次新增测试任务提交到真实云端；没有修改项目的网络或业务代码，也未重新验证真实云同步服务。

原有Supabase配置原样复制。因此你正常打开副本时，它仍会使用原有云端服务；新端口隔离localStorage，但不隔离云数据。粒子模块自身没有API、远程资源或新增网络依赖。任何原项目已有的接口或凭证均未打印或重构。

完整性记录：`reference-hashes.json` 只保存参考文件路径及哈希，不保存凭证值。两个参考项目均保持只读。
