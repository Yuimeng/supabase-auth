import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-2 text-center font-heading text-2xl font-light tracking-tight text-text-primary">
        Create Account
      </h1>
      <p className="mb-7 text-center text-sm text-text-muted">Join Studio</p>
      <RegisterForm />
    </>
  )
}
