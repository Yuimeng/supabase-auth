import { LoginForm } from '@/components/auth/login-form'
import { OAuthProviders } from '@/components/auth/oauth-providers'

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-2 text-center font-heading text-2xl font-light tracking-tight text-text-primary">
        Sign In
      </h1>
      <p className="mb-7 text-center text-sm text-text-muted">Welcome back to Studio</p>
      <LoginForm />
      <div className="mt-5">
        <OAuthProviders />
      </div>
    </>
  )
}
