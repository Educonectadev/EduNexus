'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Search, ArrowLeft, Sun, Moon } from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { connectSocket, getSocket } from '@/lib/socket'
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const FONT = "var(--app-main-font, 'DM Sans'), sans-serif"

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
  const user = useAuthStore((s) => s.user)
  const { theme, setTheme } = useTheme()
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
      <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
        <div className="p-6 md:p-8 pb-24 md:pb-8 flex items-center justify-center min-h-[60vh]">
          <div className="p-8 max-w-md w-full text-center" style={{ borderRadius: "24px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
            <div className="h-16 w-16 flex items-center justify-center mx-auto mb-4" style={{ borderRadius: "16px", background: "var(--note-fill)" }}>
              <MessageCircle className="h-7 w-7" style={{ color: "var(--note-muted)" }} />
            </div>
            <h2 className="text-[20px] font-bold mb-2" style={{ color: "var(--note-text)", fontFamily: FONT }}>
              Chat no disponible
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
              El chat en tiempo real está disponible en el plan Básico o superior.
            </p>
            <button
              className="px-6 py-3 text-[13px] font-semibold transition-opacity hover:opacity-80"
              style={{ borderRadius: "999px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}
            >
              Mejorar Plan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white dark:bg-[#1a1a1c] sb-note">
      <div className="h-full flex">

        {/* ═══════════════ CONTACTS SIDEBAR ═══════════════ */}
        <div className={`w-80 flex flex-col border-r shrink-0 ${selectedContact ? 'hidden md:flex' : 'flex'}`}
          style={{ borderColor: "var(--note-hairline)", background: "var(--note-surface)" }}
        >
          <div className="p-4" style={{ borderBottom: "1px solid var(--note-hairline)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 flex items-center justify-center" style={{ borderRadius: "10px", background: "var(--note-fill)" }}>
                  <MessageCircle className="h-4 w-4" style={{ color: "var(--note-muted)" }} />
                </div>
                <h1 className="text-[16px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>Mensajes</h1>
              </div>
              <div className="flex items-center gap-1">
                <NotificationBell />
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-10 w-10 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity relative">
                  <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" style={{ color: "var(--note-text)" }} />
                  <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ color: "var(--note-text)" }} />
                </button>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 mb-3" style={{ borderRadius: "999px", background: "var(--note-fill)" }}>
                <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--note-fill-strong)" }}>
                  <span className="text-[9px] font-semibold" style={{ color: "var(--note-text)" }}>
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: "var(--note-text)", fontFamily: FONT }}>
                  {user.full_name}
                </span>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--note-muted)" }} />
              <input
                type="text"
                placeholder="Buscar contactos..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-[13px] focus:outline-none"
                style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading ? (
              <div className="p-4 text-center text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Cargando...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-center text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>No hay contactos</div>
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
                  className="w-full p-3 flex items-center gap-3 text-left transition-colors"
                  style={{
                    background: selectedContact?.id === contact.id ? "var(--note-fill)" : "transparent",
                    borderBottom: "1px solid var(--note-hairline)",
                  }}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--note-text)" }}>
                        {contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    {onlineUsers.includes(contact.id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: "#22c55e", border: "2px solid var(--note-surface)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--note-text)", fontFamily: FONT }}>{contact.full_name}</p>
                    <p className="text-[11px] capitalize" style={{ color: "var(--note-muted)", fontFamily: FONT }}>{contact.role}</p>
                  </div>
                  {contact.unread_count > 0 && (
                    <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold" style={{ borderRadius: "999px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)", fontFamily: FONT }}>
                      {contact.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ═══════════════ CHAT AREA ═══════════════ */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selectedContact ? 'hidden md:flex' : 'flex'}`}
          style={{ background: "var(--note-fill)" }}
        >
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-16 w-16 flex items-center justify-center mx-auto mb-3" style={{ borderRadius: "16px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
                  <MessageCircle className="h-6 w-6" style={{ color: "var(--note-muted)", opacity: 0.3 }} />
                </div>
                <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Selecciona un contacto para chatear</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 flex items-center gap-3" style={{ background: "var(--note-surface)", borderBottom: "1px solid var(--note-hairline)" }}>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden h-9 w-9 flex items-center justify-center transition-opacity hover:opacity-60"
                  style={{ borderRadius: "10px", background: "var(--note-fill)", color: "var(--note-muted)" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: "12px", background: "var(--note-fill-strong)" }}>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--note-text)" }}>
                    {selectedContact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "var(--note-text)", fontFamily: FONT }}>{selectedContact.full_name}</p>
                  <p className="text-[11px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>
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
                      className="max-w-xs lg:max-w-md px-4 py-2.5"
                      style={{
                        borderRadius: "16px",
                        background: msg.sender_id === selectedContact.id ? "var(--note-surface)" : "var(--note-solid-bg)",
                        color: msg.sender_id === selectedContact.id ? "var(--note-text)" : "var(--note-solid-fg)",
                        border: msg.sender_id === selectedContact.id ? "1px solid var(--note-hairline)" : "none",
                      }}
                    >
                      <p className="text-[13px]" style={{ fontFamily: FONT }}>{msg.message}</p>
                      <p className="text-[10px] mt-1" style={{
                        color: msg.sender_id === selectedContact.id ? "var(--note-muted)" : "rgba(255,255,255,0.5)",
                        fontFamily: FONT
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2.5" style={{ borderRadius: "16px", background: "var(--note-surface)", border: "1px solid var(--note-hairline)" }}>
                      <p className="text-[13px]" style={{ color: "var(--note-muted)", fontFamily: FONT }}>Escribiendo...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4" style={{ background: "var(--note-surface)", borderTop: "1px solid var(--note-hairline)" }}>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-3 text-[13px] focus:outline-none"
                    style={{ borderRadius: "12px", background: "var(--note-fill)", color: "var(--note-text)", border: "1px solid var(--note-hairline)", fontFamily: FONT }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="h-11 w-11 flex items-center justify-center shrink-0 transition-opacity hover:opacity-80 disabled:opacity-30"
                    style={{ borderRadius: "12px", background: "var(--note-solid-bg)", color: "var(--note-solid-fg)" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
