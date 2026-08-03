'use client'

interface ChatMessageProps {
  message: {
    id: string
    sender_id: string
    sender_name: string
    message: string
    message_type: string
    created_at: string
    is_read: boolean
  }
  isOwn: boolean
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
        isOwn
          ? 'text-sb-on-primary bg-sb-primary'
          : 'bg-sb-on-surface/10 text-sb-on-surface'
      }`}>
        {!isOwn && (
          <p className="text-xs font-medium mb-1 opacity-80">{message.sender_name}</p>
        )}
        <p className="text-sm">{message.message}</p>
        <p className={`text-xs mt-1 ${
          isOwn ? 'text-white/60' : 'text-sb-on-surface/60'
        }`}>
          {new Date(message.created_at).toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  )
}
