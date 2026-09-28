'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Search, ArrowLeft } from "@/components/ui/proicons"
import { SbSectionHeader, SbBtn } from "@/components/ui/sb"
import { connectSocket, getSocket } from '@/lib/socket'

interface Contact {
  id: string
  full_name: string
  role: string
  unread_count: number
  last_message_at: string | null
}

interface Message {
  id: string
  sender_id: string
  sender_name: string
  receiver_id?: string
  message: string
  message_type: string
  created_at: string
  is_read: boolean
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [planError, setPlanError] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typing, setTyping] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<any>(null)

  const initSocket = () => {
    const socket = connectSocket()
    if (!socket) return
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to chat server')
    })

    socket.on('message:new', (message: Message) => {
      if (selectedContact &&
          (message.sender_id === selectedContact.id || message.receiver_id === selectedContact.id)) {
        setMessages(prev => [...prev, message])
      }
      fetchContacts()
    })

    socket.on('user:online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => [...prev, userId])
    })

    socket.on('user:offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId))
    })

    socket.on('typing:start', ({ userId }: { userId: string }) => {
      setTyping(userId)
    })

    socket.on('typing:stop', () => {
      setTyping(null)
    })

    socket.connect()
  }

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/messages')
      if (res.status === 403) {
        setPlanError(true)
        return
      }
      const data = await res.json()
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async (contactId: string) => {
    try {
      const res = await fetch(`/api/messages?contact_id=${contactId}`)
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact)
    fetchMessages(contact.id)
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return

    const socket = getSocket()
    if (!socket) return
    socket.emit('message:send', {
      receiverId: selectedContact.id,
      message: newMessage,
      messageType: 'text'
    })

    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (planError) {
    return (
      <div className="space-y-5">
        <SbSectionHeader title="Mensajes" description="Conversaciones con docentes y personal de la institución" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="p-8 max-w-md w-full text-center rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
            <div className="h-16 w-16 flex items-center justify-center mx-auto mb-4 rounded-2xl bg-sb-primary/10">
              <MessageCircle className="h-7 w-7 text-sb-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-sb-on-surface mb-2">
              Chat no disponible
            </h2>
            <p className="text-sm text-sb-on-surface-variant/50 mb-6">
              El chat en tiempo real está disponible en el plan Básico o superior.
            </p>
            <SbBtn variant="filled" rounded>
              Mejorar Plan
            </SbBtn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SbSectionHeader title="Mensajes" description="Conversaciones con docentes y personal de la institución" />

      <div className="rounded-2xl bg-sb-surface border border-sb-outline-variant/10 overflow-hidden">
        <div className="flex h-[calc(100vh_-_22rem)] min-h-[420px] md:h-[calc(100vh_-_16rem)]">

          {/* ═══════════════ CONTACTS SIDEBAR ═══════════════ */}
          <div className={`w-80 flex flex-col border-r border-sb-outline-variant/10 shrink-0 ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-sb-outline-variant/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-sb-surface-container-high">
                  <MessageCircle className="h-4 w-4 text-sb-on-surface-variant/60" />
                </div>
                <h1 className="text-sm font-semibold text-sb-on-surface">Mensajes</h1>
              </div>
              <div className="sb-input flex items-center gap-2">
                <Search className="w-4 h-4 shrink-0 text-sb-on-surface-variant/40" />
                <input
                  type="text"
                  placeholder="Buscar contactos..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent outline-none text-[13px] text-sb-on-surface placeholder:text-sb-on-surface-variant/40"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loading ? (
                <div className="p-4 text-center text-[13px] text-sb-on-surface-variant/50">Cargando...</div>
              ) : contacts.length === 0 ? (
                <div className="p-4 text-center text-[13px] text-sb-on-surface-variant/50">No hay contactos</div>
              ) : (
                contacts
                  .filter(c => {
                    if (!contactSearch) return true
                    const q = contactSearch.toLowerCase()
                    return c.full_name?.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q)
                  })
                  .map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => selectContact(contact)}
                    className={`w-full p-3 flex items-center gap-3 text-left transition-colors border-b border-sb-outline-variant/10 ${
                      selectedContact?.id === contact.id
                        ? 'bg-sb-surface-container'
                        : 'hover:bg-sb-surface-container/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-sb-surface-container-high">
                        <span className="text-xs font-medium text-sb-on-surface-variant/60">
                          {contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      {onlineUsers.includes(contact.id) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-sb-surface" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-sb-on-surface truncate">{contact.full_name}</p>
                      <p className="text-[11px] capitalize text-sb-on-surface-variant/50">{contact.role}</p>
                    </div>
                    {contact.unread_count > 0 && (
                      <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-semibold rounded-full bg-sb-primary text-sb-on-primary">
                        {contact.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ═══════════════ CHAT AREA ═══════════════ */}
          <div className={`flex-1 flex flex-col min-w-0 bg-sb-background ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
            {!selectedContact ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-16 w-16 flex items-center justify-center mx-auto mb-3 rounded-2xl bg-sb-surface border border-sb-outline-variant/10">
                    <MessageCircle className="h-6 w-6 text-sb-on-surface-variant/30" />
                  </div>
                  <p className="text-[13px] text-sb-on-surface-variant/50">Selecciona un contacto para chatear</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 flex items-center gap-3 bg-sb-surface border-b border-sb-outline-variant/10">
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg bg-sb-surface-container-high text-sb-on-surface-variant transition-colors hover:bg-sb-surface-container-highest"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-sb-surface-container-high">
                    <span className="text-xs font-medium text-sb-on-surface-variant/60">
                      {selectedContact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sb-on-surface">{selectedContact.full_name}</p>
                    <p className="text-[11px] text-sb-on-surface-variant/50">
                      {onlineUsers.includes(selectedContact.id) ? 'En línea' : 'Desconectado'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === selectedContact.id ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${
                          msg.sender_id === selectedContact.id
                            ? 'bg-sb-surface-container text-sb-on-surface border border-sb-outline-variant/10'
                            : 'bg-sb-on-surface text-sb-surface'
                        }`}
                      >
                        <p className="text-[13px]">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender_id === selectedContact.id ? 'text-sb-on-surface-variant/50' : 'text-sb-surface/50'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="px-4 py-2.5 rounded-2xl bg-sb-surface-container border border-sb-outline-variant/10">
                        <p className="text-[13px] text-sb-on-surface-variant/50">Escribiendo...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-sb-surface border-t border-sb-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe un mensaje..."
                      className="sb-input flex-1"
                    />
                    <SbBtn
                      variant="filled"
                      rounded
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </SbBtn>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
