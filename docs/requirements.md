# JLPT Study Web Requirements

This document collects project requirements in batches.

Workflow:
- When the user sends `追加需求：...`, append the content here without analysis.
- When the user sends `需求输入完毕`, read this document, analyze the full requirement, and start implementation.

## Requirements

### Batch 1

你现在要从零开发一个 JLPT 日语学习网站。

项目名称：
jlpt-study-web

开发目标：
开发一个可以部署到 GitHub + Vercel 的 JLPT 学习网站。网站支持邮箱注册登录，登录后可以同步学习进度。N1-N5 单词表和语法表使用本地 JSON 文件，不放数据库。数据库只保存用户设置、学习进度、今日计划、错题本和收藏。

技术栈：
1. Vue3
2. Vite
3. JavaScript
4. Vue Router
5. Supabase Auth
6. Supabase PostgreSQL
7. CSS 自适应移动端
8. 浏览器 speechSynthesis 实现日语发音

项目要求：
1. 创建 Vue3 + Vite 项目。
2. 项目必须可以 npm install、npm run dev、npm run build。
3. 必须适配手机端，优先竖屏体验。
4. 不使用后端服务。
5. 不使用自建服务器。
6. 不把单词表和语法表存入 Supabase。
7. 所有 N1-N5 学习资料放在 public/data 目录。
8. 用户数据使用 Supabase。
9. 必须使用 .env 文件读取 Supabase URL 和 anon key。
10. 不要把真实 key 写死在代码里。
11. 开发完成后执行 npm run build，必须修复所有报错。

页面结构：
1. /login 登录页
2. /register 注册页
3. / 首页
4. /settings 设置页
5. /words 单词学习页
6. /grammar 语法学习页
7. /practice 今日练习页
8. /wrong-book 错题本页
9. /favorites 收藏夹页

登录注册功能：
1. 注册页支持邮箱和密码注册。
2. 登录页支持邮箱和密码登录。
3. 使用 Supabase auth.signUp 实现注册。
4. 使用 Supabase auth.signInWithPassword 实现登录。
5. 支持退出登录。
6. 未登录用户访问学习页面时，自动跳转到 /login。
7. 登录后读取用户设置和学习进度。
8. 如果用户第一次登录，没有 user_settings，则自动创建默认设置：
   - target_level: N2
   - daily_words: 20
   - daily_grammar: 5
   - daily_questions: 25

数据文件目录：
public/data/words/n5.json
public/data/words/n4.json
public/data/words/n3.json
public/data/words/n2.json
public/data/words/n1.json

public/data/grammar/n5.json
public/data/grammar/n4.json
public/data/grammar/n3.json
public/data/grammar/n2.json
public/data/grammar/n1.json

请先创建示例 JSON 数据，方便页面能运行。

单词 JSON 格式：
[
  {
    "id": "n2_word_0001",
    "level": "N2",
    "word": "明らか",
    "kana": "あきらか",
    "meaning": "明显，清楚",
    "example": "原因は明らかです。",
    "example_cn": "原因很明显。"
  }
]

### Batch 2

首页功能：
1. 显示当前用户邮箱。
2. 显示目标等级。
3. 显示单词总进度，例如 20 / 2000。
4. 显示语法总进度，例如 5 / 300。
5. 显示今日任务：
   - 今日单词 0/20
   - 今日语法 0/5
   - 今日习题 0/25
6. 显示错题数量。
7. 显示收藏数量。
8. 提供按钮：
   - 开始今日学习
   - 单词学习
   - 语法学习
   - 今日练习
   - 错题本

设置页功能：
1. 可以选择目标等级：N5、N4、N3、N2、N1。
2. 可以设置每日单词数量。
3. 可以设置每日语法数量。
4. 可以设置每日习题数量。
5. 可以设置考试日期。
6. 点击保存后写入 Supabase user_settings。
7. 切换目标等级后，首页和学习页按新等级读取 JSON 数据。

单词学习页功能：
1. 根据 user_settings.target_level 读取对应单词 JSON。
2. 根据 study_progress.word_index 顺序学习。
3. 例如 word_index = 20，daily_words = 20，则今日单词从第21个开始。
4. 页面展示今日单词卡片。
5. 每张卡片显示：
   - 日语单词
   - 假名
   - 中文意思
   - 例句
   - 例句中文
6. 支持按钮：
   - 单词发音
   - 例句发音
   - 收藏
   - 认识
   - 模糊
   - 不认识
7. 点击“完成今日单词”后：
   - 更新 today_plans.completed_word_ids
   - 更新 study_progress.word_index
8. 不能重复推进进度。如果今天已经完成，重复点击不能让 word_index 再增加。

语法学习页功能：
1. 根据 user_settings.target_level 读取对应语法 JSON。
2. 根据 study_progress.grammar_index 顺序学习。
3. 每张语法卡片显示：
   - 语法
   - 中文意思
   - 接续
   - 例句
   - 例句中文
   - 易错点
4. 支持例句发音。
5. 支持收藏。
6. 点击“完成今日语法”后：
   - 更新 today_plans.completed_grammar_ids
   - 更新 study_progress.grammar_index
7. 不能重复推进进度。

今日计划功能：
1. 登录后进入首页时，检查今天是否已有 today_plans。
2. 如果没有，则根据当前 study_progress 和 user_settings 自动创建。
3. today_plans 保存：
   - study_date
   - level
   - word_ids
   - grammar_ids
   - completed_word_ids
   - completed_grammar_ids
   - completed_question_ids
4. 今日练习必须只从 today_plans.word_ids 和 today_plans.grammar_ids 生成题目。

今日练习页功能：
1. 只从今天学过的单词和语法出题。
2. 单词题自动生成，不需要题库。
3. 语法题自动生成，不需要题库。
4. 单词题类型：
   - 日文选中文
   - 中文选日文
   - 汉字选假名
5. 语法题类型：
   - 语法选意思
   - 意思选语法
6. 题目选项为4个。
7. 正确答案来自今日学习内容。
8. 错误选项可以从当前等级的全部单词或语法里随机抽取。
9. 用户答题后立即显示：
   - 正确/错误
   - 正确答案
   - 简单解析
10. 答错自动写入 Supabase wrong_questions。
11. 答对错题时，correct_count_after_wrong + 1。
12. 错题连续答对3次后，从错题本中删除。
13. 完成今日练习后，更新 today_plans.completed_question_ids。

错题本功能：
1. 从 Supabase wrong_questions 读取当前用户错题。
2. 支持按等级筛选。
3. 支持按类型筛选：
   - word_meaning
   - word_kana
   - grammar_meaning
4. 支持重新练习。
5. 支持手动移除错题。
6. 显示错误次数、最后错误答案、正确答案。

收藏夹功能：
1. 从 Supabase favorites 读取当前用户收藏。
2. 支持收藏单词。
3. 支持收藏语法。
4. 支持取消收藏。
5. favorites 表 unique(user_id, type, source_id)，避免重复收藏。

发音功能：
1. 使用浏览器 speechSynthesis。
2. lang 设置为 ja-JP。
3. 支持朗读单词。
4. 支持朗读例句。
5. 如果浏览器不支持，显示提示。

Supabase 表：
假设我已经在 Supabase 创建以下表：
1. user_settings
2. study_progress
3. today_plans
4. wrong_questions
5. favorites

请在代码中创建以下 service：
1. src/services/supabase.js
2. src/services/authService.js
3. src/services/dataService.js
4. src/services/progressService.js
5. src/services/planService.js
6. src/services/questionService.js
7. src/services/speechService.js
8. src/services/favoriteService.js
9. src/services/wrongQuestionService.js

环境变量：
创建 .env.example：
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

创建 .gitignore，必须忽略：
.env
node_modules
dist

UI要求：
1. 简洁清晰。
2. 手机端优先。
3. 底部导航栏：
   - 首页
   - 单词
   - 语法
   - 练习
   - 我的
4. 按钮大一点，适合手机点击。
5. 单词和语法用卡片展示。

测试要求：
1. npm install 成功。
2. npm run dev 成功。
3. npm run build 成功。
4. 未登录访问首页应跳转登录。
5. 注册登录流程可用。
6. 登录后能创建默认设置。
7. 能读取示例 JSON 数据。
8. 能生成今日计划。
9. 能完成今日单词并推进 word_index。
10. 今日练习能从今日单词和语法生成题。
11. 答错能进入错题本。
12. 收藏能写入 Supabase。
13. 发音按钮能调用 speechSynthesis。

Git要求：
1. 初始化 git。
2. 创建 main 分支。
3. 首次开发完成后提交：
   git add .
   git commit -m "Initial JLPT study web app"
4. 提醒我把 GitHub 远程仓库地址提供给你。
5. 如果我提供 GitHub 仓库地址，请 push 到 main。

语法 JSON 格式：
[
  {
    "id": "n2_grammar_0001",
    "level": "N2",
    "grammar": "わけではない",
    "meaning": "并不是说……",
    "usage": "普通形 + わけではない",
    "example": "日本語が嫌いなわけではない。",
    "example_cn": "并不是讨厌日语。",
    "note": "表示部分否定。"
  }
]
