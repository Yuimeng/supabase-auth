import { LoginForm } from '@/components/auth/login-form'
import { OAuthProviders } from '@/components/auth/oauth-providers'

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">Sign In</h1>
      <LoginForm />
      <OAuthProviders />
    </>
  )
}
