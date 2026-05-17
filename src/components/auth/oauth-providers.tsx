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
      <button
        disabled
        className="w-full cursor-not-allowed rounded-md border px-4 py-2 text-sm text-gray-400"
      >
        GitHub / Google (Coming Soon)
      </button>
    </div>
  )
}
