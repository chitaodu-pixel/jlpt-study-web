# jlpt-study-web

项目初衷与一期需求

## 项目初衷

`jlpt-study-web` 的目标是做一个轻量、可部署、可长期迭代的 JLPT 日语学习网站。

这个项目不是单纯展示单词表，而是希望把 JLPT N1-N5 的单词、语法、每日计划、练习、错题和收藏串成一个完整学习闭环。用户可以用邮箱注册登录，在不同设备上同步学习进度；学习资料以本地 JSON 文件保存，避免把大批量公开资料塞进数据库；数据库只保存和用户个人学习状态相关的数据。

核心设计原则：

- 手机端优先，适合日常碎片化学习。
- 不自建后端，不维护服务器。
- 前端部署到 Vercel，代码托管到 GitHub。
- Supabase 负责邮箱注册登录和用户学习数据。
- N1-N5 单词表、语法表放在 `public/data` 本地 JSON 中。
- 用户数据和学习资料分离，降低数据库复杂度。
- 页面功能先可用，再逐步补充资料质量、练习体验和复习算法。

## 一期目标

一期要完成一个可以上线使用的 JLPT 学习网站 MVP。

一期的重点不是做复杂算法，而是先打通以下主流程：

1. 用户可以注册、登录、退出。
2. 登录后可以读取或创建默认学习设置。
3. 用户可以选择目标等级 N1-N5。
4. 系统根据目标等级读取本地 JSON 学习资料。
5. 首页展示学习进度、今日任务、错题和收藏概况。
6. 用户可以按顺序学习今日单词和今日语法。
7. 系统能生成今日练习题。
8. 答错的题能进入错题本。
9. 用户可以收藏单词和语法。
10. 支持浏览器日语发音能力。
11. 项目可以稳定 `npm install`、`npm run dev`、`npm run build`。
12. 项目可以部署到 Vercel 并通过线上地址访问。

## 技术栈

- Vue 3
- Vite
- JavaScript
- Vue Router
- Supabase Auth
- Supabase PostgreSQL
- CSS 响应式布局
- Browser `speechSynthesis`
- GitHub
- Vercel

## 页面范围

一期包含以下路由：

- `/login` 登录页
- `/register` 注册页
- `/` 首页
- `/settings` 设置页
- `/words` 单词学习页
- `/grammar` 语法学习页
- `/practice` 今日练习页
- `/wrong-book` 错题本页
- `/favorites` 收藏夹页

## 数据范围

学习资料文件：

- `public/data/words/n1.json`
- `public/data/words/n2.json`
- `public/data/words/n3.json`
- `public/data/words/n4.json`
- `public/data/words/n5.json`
- `public/data/grammar/n1.json`
- `public/data/grammar/n2.json`
- `public/data/grammar/n3.json`
- `public/data/grammar/n4.json`
- `public/data/grammar/n5.json`

Supabase 表：

- `user_settings`
- `study_progress`
- `today_plans`
- `wrong_questions`
- `favorites`

一期约束：

- 单词表和语法表不放入 Supabase。
- Supabase 只保存用户设置、进度、今日计划、错题和收藏。
- Supabase URL 和 publishable/anon key 通过环境变量读取。
- 不把真实密钥硬编码进仓库。

## 一期功能需求

### 注册登录

- 支持邮箱和密码注册。
- 支持邮箱和密码登录。
- 支持退出登录。
- 未登录访问学习页面时跳转到 `/login`。
- 注册后可以直接登录。
- 登录后读取用户设置和学习进度。
- 首次登录时自动创建默认设置：
  - `target_level: N2`
  - `daily_words: 20`
  - `daily_grammar: 5`
  - `daily_questions: 25`

### 首页

- 显示当前用户邮箱。
- 显示目标等级。
- 显示单词总进度。
- 显示语法总进度。
- 显示今日任务完成情况。
- 显示错题数量。
- 显示收藏数量。
- 提供进入今日学习、单词、语法、练习、错题本的入口。

### 设置页

- 可以切换目标等级：N5、N4、N3、N2、N1。
- 可以设置每日单词数量。
- 可以设置每日语法数量。
- 可以设置每日习题数量。
- 可以设置考试日期。
- 保存后写入 Supabase `user_settings`。
- 切换等级后首页和学习页按新等级读取 JSON 数据。

### 单词学习页

- 根据 `user_settings.target_level` 读取对应单词 JSON。
- 根据 `study_progress.word_index` 顺序学习。
- 展示今日单词卡片。
- 卡片展示单词、假名、意思、例句信息。
- 支持单词发音。
- 支持收藏。
- 支持认识、模糊、不认识按钮。
- 点击完成今日单词后更新今日计划和单词进度。
- 同一天重复点击不能重复推进进度。

### 语法学习页

- 根据 `user_settings.target_level` 读取对应语法 JSON。
- 根据 `study_progress.grammar_index` 顺序学习。
- 展示今日语法卡片。
- 卡片展示语法、意思、接续、例句、备注信息。
- 支持例句发音。
- 支持收藏。
- 点击完成今日语法后更新今日计划和语法进度。
- 同一天重复点击不能重复推进进度。

### 今日计划

- 登录进入首页时检查当天是否已有 `today_plans`。
- 如果没有，则根据当前设置和学习进度创建今日计划。
- 今日计划保存：
  - `study_date`
  - `level`
  - `word_ids`
  - `grammar_ids`
  - `completed_word_ids`
  - `completed_grammar_ids`
  - `completed_question_ids`
- 今日练习只从今日计划里的单词和语法生成题。

### 今日练习

- 不依赖固定题库，自动生成练习题。
- 单词题类型：
  - 日文选中文
  - 中文选日文
  - 汉字选假名
- 语法题类型：
  - 语法选意思
  - 意思选语法
- 每题 4 个选项。
- 答题后显示正确或错误、正确答案和简单解析。
- 答错自动写入错题本。
- 错题连续答对 3 次后从错题本移除。
- 完成练习后更新今日计划。

### 错题本

- 从 Supabase `wrong_questions` 读取当前用户错题。
- 支持按等级筛选。
- 支持按类型筛选。
- 支持手动移除错题。
- 显示错误次数、最后错误答案、正确答案。

### 收藏夹

- 从 Supabase `favorites` 读取当前用户收藏。
- 支持收藏单词。
- 支持收藏语法。
- 支持取消收藏。
- 避免重复收藏。

### 发音

- 使用浏览器 `speechSynthesis`。
- `lang` 设置为 `ja-JP`。
- 支持朗读单词。
- 有例句时支持朗读例句。
- 浏览器不支持或内容为空时显示提示。

## UI 要求

- 简洁清晰。
- 手机端优先。
- 按钮适合手机点击。
- 单词和语法用卡片展示。
- 底部导航包含：
  - 首页
  - 单词
  - 语法
  - 练习
  - 我的

## 一期验收标准

- `npm install` 成功。
- `npm run dev` 成功。
- `npm run build` 成功。
- 未登录访问首页会跳转登录页。
- 注册登录流程可用。
- 登录后能创建默认设置。
- 能读取 N1-N5 JSON 数据。
- 能生成今日计划。
- 能完成今日单词并推进 `word_index`。
- 今日练习能从今日单词和语法生成题目。
- 答错能进入错题本。
- 收藏能写入 Supabase。
- 发音按钮能调用 `speechSynthesis`。
- GitHub 仓库有完整代码。
- Vercel 有可访问线上地址。

## 一期已知边界

- JLPT Sensei 列表页不提供完整例句和中文例句，因此当前抓取数据中部分 `example`、`example_cn`、`usage`、`note` 为空。
- 发音依赖用户浏览器和系统是否安装日语语音。
- 当前练习题为基础自动生成，尚未做智能间隔复习算法。
- 当前 UI 是 MVP 级学习工具界面，后续可以继续优化交互密度、学习反馈和数据可视化。

## Phase 2

- 首页轻量化：首页只读取设置、当前等级进度、当前等级今日计划、错题/收藏计数和 `public/data/index.json`。
- 登录体验优化：登录中禁用按钮，登录成功后显示同步状态，失败时展示明确错误。
- N1-N5 等级快捷切换：首页提供明显的等级按钮，切换后保存到 `user_settings.target_level` 并刷新当前等级数据。
- 多等级进度独立：`study_progress` 和 `today_plans` 都按 `user_id + level` 查询和创建，不覆盖其他等级进度。
- 当前等级按需加载：单词页、语法页、今日练习页只加载当前目标等级 JSON。
- IndexedDB 缓存：当前等级单词和语法 JSON 通过 IndexedDB 缓存，并用 `public/data/version.json` 控制失效更新。
- 单词/语法分页：默认只显示今日任务，查看全部时分页加载，每页最多 30 条，搜索结果先限制 50 条。
- Supabase 查询优化：首页错题和收藏只查 count，详情只在对应页面加载，查询字段收窄并带 `user_id` 条件。
- Loading/Error/Retry 体验优化：首页、单词、语法、练习、错题本、收藏夹、设置页都提供加载和失败重试状态。
- 手机端性能优化：避免一次性渲染大列表，底部导航保持可用，页面禁止横向溢出。

