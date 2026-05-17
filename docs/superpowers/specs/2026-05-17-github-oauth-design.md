# GitHub OAuth Login & Account Binding Design

## 概述

在现有邮箱密码认证系统基础上，接入 GitHub OAuth 登录，并支持与已有账号绑定。

## 技术栈

- **认证**: Supabase Auth (SSR 模式)
- **OAuth Provider**: GitHub
- **框架**: Next.js 16 (App Router)

## 认证流程

### GitHub 登录（新用户/首次）

```
用户点击 "Sign in with GitHub" → signInWithGithub() Server Action
    → supabase.auth.signInWithOAuth({ provider: 'github' })
    → 跳转 GitHub 授权页面
    → 授权成功 → 回调 /auth/callback?code=xxx
    → exchangeCodeForSession(code)
    → Supabase 创建 auth.users
    → 触发器自动创建 profiles (GitHub username → username, 冲突加后缀)
    → 跳转首页
```

### GitHub 登录（已有账号，邮箱匹配）

```
同上流程
    → 回调 exchangeCodeForSession(code)
    → Supabase 自动关联身份 (Automatically linking accounts)
    → 登录已有账号
    → 跳转首页
```

### 手动绑定 GitHub（已登录用户）

```
用户进入 /settings → 点击 "Link GitHub Account"
    → linkGithub() Server Action
    → supabase.auth.linkIdentity({ provider: 'github' })
    → 跳转 GitHub 授权
    → 回调 /auth/callback → 身份关联到当前 Session 用户
    → 返回 /settings
```

## 数据模型变更

### profiles 表新增字段

```sql
alter table public.profiles
  add column github_username text,
  add column updated_at timestamptz default now() not null;
```

### 更新触发器

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_username text;
  final_username text;
  suffix int := 1;
begin
  -- 优先使用 GitHub 用户名 (preferred_username), 否则用 metadata 中的 username
  raw_username := coalesce(
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  );

  -- 处理用户名冲突
  final_username := raw_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := raw_username || suffix::text;
    suffix := suffix + 1;
  end loop;

  insert into public.profiles (id, username, avatar_url, github_username)
  values (
    new.id,
    final_username,
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ? 'preferred_username'
         then new.raw_user_meta_data ->> 'preferred_username'
         else null
    end
  );
  return new;
end;
$$;
```

## 文件变更清单

### 新增文件

| 文件 | 用途 |
|------|------|
| `src/app/auth/callback/route.ts` | OAuth 回调路由 |
| `src/app/(authenticated)/settings/page.tsx` | 设置页（关联 GitHub） |
| `supabase/migrations/002_github_oauth.sql` | profiles 表扩展 + 触发器更新 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/auth/oauth-providers.tsx` | 替换占位符为实际 GitHub 按钮 |
| `src/actions/auth.ts` | 新增 signInWithGithub() 和 linkGithub() |
| `.env.local` | 新增 NEXT_PUBLIC_SITE_URL |

## 组件设计

### OAuthProviders (修改)

```tsx
'use client'

import { signInWithGithub } from '@/actions/auth'

export function OAuthProviders() {
  return (
    <div className="space-y-2">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>
      <form action={signInWithGithub}>
        <button type="submit" className="w-full rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
          Sign in with GitHub
        </button>
      </form>
    </div>
  )
}
```

### Auth 回调路由

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
```

### 新增 Server Actions

```typescript
export async function signInWithGithub() {
  const supabase = await createClient()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (data.url) {
    redirect(data.url)
  }
}

export async function linkGithub() {
  const supabase = await createClient()
  const { data } = await supabase.auth.linkIdentity({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (data.url) {
    redirect(data.url)
  }
}
```

### Settings 页面

- 展示当前用户信息 (email, username)
- 显示 GitHub 绑定状态 (已绑定则显示 github_username, 未绑定则显示 Link GitHub 按钮)
- 使用 Server Action 调用 linkGithub()

## 环境变量

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # 开发环境
```

## Supabase Dashboard 配置

1. Authentication → Providers → GitHub: 启用, 填入 Client ID/Secret
2. 开启 Automatically linking accounts
3. GitHub OAuth App: Authorization callback URL 设为 Supabase 回调
