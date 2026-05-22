'use client'

import { useActionState, useState } from 'react'
import { createMessage, deleteMessage } from '@/actions/contact'
import { SubmitButton } from '@/components/ui/submit-button'

type Message = {
  id: number
  contact_info: string
  message: string
  created_at: string
}

export function ContactForm({ initialMessages }: { initialMessages: Message[] }) {
  const [state, action] = useActionState(createMessage, { error: null })
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleteState, deleteAction] = useActionState(deleteMessage, { error: null })

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border-primary bg-bg-elevated p-6">
        <h2 className="mb-5 font-heading text-lg font-light tracking-tight text-text-primary">
          Contact &amp; Message
        </h2>

        <form action={action} className="space-y-5">
          <div>
            <label
              htmlFor="contactInfo"
              className="block text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase"
            >
              Contact Info
            </label>
            <textarea
              id="contactInfo"
              name="contactInfo"
              required
              maxLength={100}
              rows={2}
              className="mt-1.5 block w-full rounded-lg border border-border-primary bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
              placeholder="WeChat, phone, email, etc."
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-[11px] font-medium tracking-[0.1em] text-text-muted uppercase"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={1000}
              rows={3}
              className="mt-1.5 block w-full rounded-lg border border-border-primary bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
              placeholder="Write your message..."
            />
          </div>

          {state?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{state.error}</p>
            </div>
          )}

          <SubmitButton>Send</SubmitButton>
        </form>
      </div>

      <div>
        <h3 className="mb-4 font-heading text-base font-light tracking-tight text-text-primary">
          My Messages
        </h3>

        {initialMessages.length === 0 ? (
          <p className="rounded-xl border border-border-primary bg-bg-elevated px-5 py-8 text-center text-sm text-text-muted">
            No messages yet. Write one above!
          </p>
        ) : (
          <div className="space-y-3">
            {initialMessages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-border-primary bg-bg-surface p-5"
              >
                <p className="text-xs text-text-muted">
                  {(() => {
                    try {
                      return new Date(msg.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    } catch {
                      return msg.created_at
                    }
                  })()}
                </p>
                <p className="mt-2 text-sm text-text-secondary">{msg.contact_info}</p>
                <p className="mt-1 text-sm text-text-primary">{msg.message}</p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(msg.id)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border-primary bg-bg-elevated p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-base font-light tracking-tight text-text-primary">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Are you sure you want to delete this message?
            </p>

            <form action={deleteAction} className="mt-6 flex items-center justify-end gap-3">
              <input type="hidden" name="id" value={confirmDeleteId} />

              {deleteState?.error && (
                <p className="mr-auto text-xs text-red-400">{deleteState.error}</p>
              )}

              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-border-primary"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
