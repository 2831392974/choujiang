# 抽奖网站项目说明

## 项目概述
这是一个完整的抽奖网站系统，包含前端抽奖页面和后台管理系统，使用Supabase作为数据库，高德地图API获取地理位置信息，并部署在Vercel平台。

## 项目结构
```
/frontend           # 前端抽奖页面相关文件
  /index.html       # 抽奖主页面
  /styles.css       # 样式文件
  /script.js        # 抽奖逻辑脚本
/admin              # 后台管理系统相关文件
  /index.html       # 管理页面
  /styles.css       # 管理页面样式
  /script.js        # 管理页面脚本
/api                # Vercel API函数
  /geolocation.js   # 获取地理位置信息的API
  /admin.js         # 管理后台API
  /lottery.js       # 抽奖相关API
/supabase           # Supabase配置和迁移文件
  /schema.sql       # 数据库表结构
.env                # 环境变量配置文件
vercel.json         # Vercel部署配置
README.md           # 项目说明文档
```

## 配置说明
需要修改以下文件中的个人信息：
1. `.env` 文件中的API密钥和URL
2. `/supabase/schema.sql` 中的数据库配置
3. `/frontend/script.js` 中的奖品概率设置

## 部署步骤
1. 将项目推送到GitHub仓库
2. 在Vercel中导入GitHub仓库
3. 配置环境变量
4. 部署完成后访问分配的URL

## 管理后台
访问 `域名/admin` 进入管理后台
默认账号: admin
默认密码: admin