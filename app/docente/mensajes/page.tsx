'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, Send, Search, ArrowLeft, 
  Circle, CreditCard, Sun, Moon
} from "@/components/ui/proicons"
import NotificationBell from "@/components/layout/notification-bell"
import { connectSocket, getSocket } from '@/lib/socket'
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

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
      <div className="min-h-screen bg-sb-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-sb-surface rounded-[6px] p-8 max-w-md w-full text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-sb-primary/10 rounded-[6px] flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-sb-primary" />
          </div>
          <h2 className="text-xl font-bold text-sb-on-surface mb-2">
            Chat no disponible
          </h2>
          <p className="text-sb-on-surface/60 mb-6">
            El chat en tiempo real está disponible en el plan Básico o superior.
          </p>
          <button className="px-6 py-3 bg-sb-primary text-white rounded-[6px] font-medium hover:opacity-90 transition-opacity">
            Mejorar Plan
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-[25px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-black dark:bg-black">
      <div className="h-full flex">
        <div className={`w-80 bg-white dark:bg-[#17171a] flex flex-col ${
          selectedContact ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-[#E5E5E5] dark:border-[#27272a]">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-[#000] dark:text-[#f4f4f5] flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Mensajes
              </h1>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema" title="Cambiar tema" className="h-8 w-8 flex items-center justify-center rounded-full bg-[#F5F5F5] dark:bg-[#27272a] hover:opacity-80 transition-opacity relative">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#000] dark:text-[#f4f4f5]" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#000] dark:text-[#f4f4f5]" />
                </button>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F5] dark:bg-[#27272a]">
                <div className="h-6 w-6 rounded-full bg-[#E5E5E5] dark:bg-[#3f3f46] flex items-center justify-center">
                  <span className="text-[9px] font-semibold text-[#000] dark:text-[#f4f4f5]">
                    {user.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "D"}
                  </span>
                </div>
                <span className="text-sm md:text-base font-medium text-[#000] dark:text-[#f4f4f5] whitespace-nowrap">
                  {user.full_name}
                </span>
              </div>
            )}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666] dark:text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="Buscar contactos..."
                className="w-full pl-9 pr-4 py-2 bg-[#F5F5F5] dark:bg-[#27272a] border border-[#E5E5E5] dark:border-[#3f3f46] rounded-[6px] text-sm text-[#000] dark:text-[#f4f4f5] placeholder:text-[#666] dark:placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#000]/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-[#666] dark:text-[#a1a1aa]">Cargando...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-center text-[#666] dark:text-[#a1a1aa]">No hay contactos</div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => selectContact(contact)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-[#F5F5F5] dark:hover:bg-[#27272a] transition-colors text-left ${
                    selectedContact?.id === contact.id ? 'bg-[#E5E5E5] dark:bg-[#27272a]' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-[#E5E5E5] dark:bg-[#3f3f46] rounded-[6px] flex items-center justify-center">
                      <span className="text-sm font-medium text-[#000] dark:text-[#f4f4f5]">
                        {contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    {onlineUsers.includes(contact.id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-[6px] border-2 border-white dark:border-[#17171a]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#000] dark:text-[#f4f4f5] truncate">{contact.full_name}</p>
                    <p className="text-xs text-[#666] dark:text-[#a1a1aa] capitalize">{contact.role}</p>
                  </div>
                  {contact.unread_count > 0 && (
                    <span className="w-5 h-5 bg-[#000] dark:bg-white text-white dark:text-black text-xs rounded-[6px] flex items-center justify-center">
                      {contact.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#17171a]">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-[#E5E5E5] dark:text-[#3f3f46] mx-auto mb-4" />
                <p className="text-[#666] dark:text-[#a1a1aa]">Selecciona un contacto para chatear</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-white dark:bg-[#17171a] border-b border-[#E5E5E5] dark:border-[#27272a] flex items-center gap-3">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#27272a] rounded-[6px]"
                >
                  <ArrowLeft className="w-5 h-5 text-[#000] dark:text-[#f4f4f5]" />
                </button>
                <div className="w-10 h-10 bg-[#E5E5E5] dark:bg-[#3f3f46] rounded-[6px] flex items-center justify-center">
                  <span className="text-sm font-medium text-[#000] dark:text-[#f4f4f5]">
                    {selectedContact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-[#000] dark:text-[#f4f4f5]">{selectedContact.full_name}</p>
                  <p className="text-xs text-[#666] dark:text-[#a1a1aa]">
                    {onlineUsers.includes(selectedContact.id) ? 'En línea' : 'Desconectado'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F5F5] dark:bg-[#0a0a0b]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === selectedContact.id ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-[6px] ${
                      msg.sender_id === selectedContact.id
                        ? 'bg-[#E5E5E5] dark:bg-[#3f3f46] text-[#000] dark:text-[#f4f4f5]'
                        : 'bg-[#000] dark:bg-white text-white dark:text-black'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_id === selectedContact.id
                          ? 'text-[#666] dark:text-[#a1a1aa]'
                          : 'text-white/60 dark:text-black/60'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-[#E5E5E5] dark:bg-[#3f3f46] px-4 py-2 rounded-[6px]">
                      <p className="text-sm text-[#666] dark:text-[#a1a1aa]">Escribiendo...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white dark:bg-[#17171a] border-t border-[#E5E5E5] dark:border-[#27272a]">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-3 bg-[#F5F5F5] dark:bg-[#27272a] border border-[#E5E5E5] dark:border-[#3f3f46] rounded-[6px] text-[#000] dark:text-[#f4f4f5] placeholder:text-[#666] dark:placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#000]/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-[#000] dark:bg-white text-white dark:text-black rounded-[6px] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
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
