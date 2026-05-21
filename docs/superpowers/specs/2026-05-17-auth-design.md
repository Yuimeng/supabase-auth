# 用户登录注册系统设计

## 概述

在 Next.js (App Router) + Supabase + TypeScript 项目中实现用户认证系统，部署到 Vercel。

## 技术栈

- **框架**: Next.js (App Router)
- **认证**: Supabase Auth (SSR 模式, `@supabase/ssr`)
- **数据库**: Supabase PostgreSQL
- **样式**: Tailwind CSS
- **部署**: Vercel

## 架构

### 三层 Supabase 客户端

| 客户端 | 文件 | 用途 |
|--------|------|------|
| Browser Client | `lib/supabase/client.ts` | 浏览器端组件, 客户端交互 |
| Server Client | `lib/supabase/server.ts` | Server Components, Server Actions |
| Middleware Client | `lib/supabase/middleware.ts` | middleware.ts 中刷新 session |

### 数据流

```
请求 → middleware.ts (刷新 session) → 路由匹配
  ├─ (auth)/* → 公开, 已登录用户重定向至首页
  └─ (authenticated)/* → 需登录, 未登录重定向至 /login
```

## 功能需求

### 认证方式
- 邮箱 + 密码登录注册
- OAuth 第三方登录接口预留 (暂不实现)

### 用户字段
- 邮箱
- 用户名 (唯一, 展示用)

## 数据模型

```sql
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  username    text unique not null,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

-- 注册时自动创建 profile
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 路由设计

| 路径 | 访问权限 | 说明 |
|------|---------|------|
| `/login` | 公开 | 登录页 |
| `/register` | 公开 | 注册页 |
| `/` (authenticated) | 需登录 | 仪表盘/首页 |
| `/auth/callback` | 公开 | OAuth 回调 (占位) |
| `/auth/confirm` | 公开 | 邮箱确认 (占位) |

## 组件树

```
src/
├── app/
│   ├── (auth)/                  # 公开路由组 (居中卡片布局)
│   │   ├── login/page.tsx       # 登录页
│   │   ├── register/page.tsx    # 注册页
│   │   └── layout.tsx           # Auth 页面布局
│   │
│   ├── (authenticated)/         # 需登录路由组
│   │   ├── layout.tsx           # Header + 登出按钮
│   │   └── page.tsx             # 首页
│   │
│   ├── layout.tsx               # 根布局
│   └── globals.css
│
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── oauth-providers.tsx  # 接口预留
│   └── ui/
│       └── submit-button.tsx
│
├── lib/supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
│
├── actions/
│   ├── auth.ts
│   └── types.ts
│
└── middleware.ts
```

## 表单字段与校验

| 表单 | 字段 | 校验规则 |
|------|------|---------|
| 登录 | 邮箱, 密码 | 邮箱格式, 密码非空 |
| 注册 | 邮箱, 用户名, 密码, 确认密码 | 邮箱格式, 用户名 2-20 字符(字母数字下划线), 密码 ≥6 位, 两次密码一致 |

双重校验: 客户端 + 服务端。

## 认证流程

### 注册
1. 表单客户端校验
2. Server Action: 检查 username 唯一性
3. `supabase.auth.signUp()` 创建用户 (raw_user_meta_data 携带 username)
4. 数据库触发器自动创建 profiles 记录
5. 开发阶段关闭邮箱确认, 注册后直接登录跳转

### 登录
1. 表单客户端校验
2. Server Action: `supabase.auth.signInWithPassword()`
3. 成功 → 自动设置 session cookie → 跳转首页
4. 失败 → 返回错误提示

### 登出
1. Server Action: `supabase.auth.signOut()`
2. 清除 session cookies
3. 重定向至 /login

### Session 管理
- middleware.ts 每个请求自动刷新 session
- 保护性路由未认证 → 重定向至 /login
- 公开路由已认证 → 重定向至首页

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## 开发阶段配置

- Supabase Auth 中关闭邮箱确认 (Confirm email)
- Supabase 项目中使用 Development mode

## 非功能需求

- 表单加载状态 (SubmitButton)
- 服务端错误提示 (toast 或内联错误)
- 登录/注册后自动重定向
- 登出后清除缓存跳转
