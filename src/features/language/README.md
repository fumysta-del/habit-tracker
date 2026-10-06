# 本地听学工具接入

Habit Tracker 是原英语／粤语听学工具的新前端入口，仅支持本地开发，不部署。

## 调用路径

`LanguageLearningCard → getLanguageRecommendations → POST /api/language/recommendations → server/listening_bridge.py`

- 前端发送 language、topic、duration，以及用于去重的本地学习记录摘要。
- 后端直接导入 `E:\AI-Skills\listen-language-content\scripts\material_pool.py`，使用原 `query`、`load_pool`、`remember`；读取原 `E:\MediaCrawler\data` 全部素材和 Skill 的偏好／去重记录。
- 本地匹配足够则直接返回；不足则按小红书 → B站 → 抖音补搜。按结构化条件展开同义关键词，不要求素材预先人工标注 topic。
- 小红书复用已运行的 localhost:18060 MCP 服务；B站、抖音沿用原 probe_mcp.py 所读的 Codex 注册配置及运行环境，不新建平台爬虫。
- 标准化后统一按语言证据、主题词、时长范围、内容质量筛选；过滤明确营销、合集等内容，按 ID、链接及标题去重，每种语言目标 2 条。
- 每平台初次最多 5 条候选，必要时补一次关键词扩展；只读取元信息，缺少时长时按需读取详情，不下载、转录或进行账号互动。
- 原 Skill 的自由自然语言理解由聊天助手执行；本地桥接层处理本页面明确的八类条件，语言及主题基于标题／简介等元信息，不宣称已试听。

## 边界与失败状态

- 原 Skill/连接器源码和原素材文件保持只读；新索引与补搜候选缓存写在测试项目 `.listening-cache`，不提交、不通过 Vite 对外提供。
- 原素材不足且外部搜索全部有效完成仍无匹配项，才显示「暂时没有找到符合当前条件的内容」。
- 登录、验证、安全软件拦截、服务不可用、超时均作为补搜未完成报告；继续尝试下一平台，不伪装成无结果，也不绕过限制。
- 原静态 catalog.json 已移除，前端不会退回固定清单。只读预览或部署后的静态页面没有本地 API；此轮仅供 npm run dev 使用。
- 所有接口只允许本机、同源调用；平台注册配置和登录凭据不传至浏览器，返回候选不携带 xsec_token。

## 前端状态

语言、时长、topic 在开始按钮前单选。topicPreference 保存最近选中的分类；lastLanguageSession 保存上次实际提交的三个条件。旧记录缺少 topic 时按 daily 兼容。

只有「就听这个了」通过 saveLanguageLearningRecord 写入 languageLearningHistory。「听完了」和评分通过 updateLanguageLearningRecord 更新；同一天同一内容复用记录，正在听的内容跨天复用。评级仅保留 getRecommendationScore 扩展接口，未增加复杂偏好算法或 Supabase 接入。
