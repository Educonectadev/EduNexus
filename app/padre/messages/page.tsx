'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, Send, Search, ArrowLeft, 
  CreditCard 
} from "@/components/ui/proicons"
import { connectSocket, getSocket } from '@/lib/socket'

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

export default function PadreMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [planError, setPlanError] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<any>(null)

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
          className="bg-sb-surface rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-sb-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-sb-primary" />
          </div>
          <h2 className="text-xl font-bold text-sb-on-surface mb-2">
            Chat no disponible
          </h2>
          <p className="text-sb-on-surface/60 mb-6">
            El chat con docentes está disponible en el plan Básico o superior.
          </p>
          <button className="px-6 py-3 bg-sb-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            Mejorar Plan
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sb-background">
      <div className="max-w-6xl mx-auto h-screen flex">
        <div className={`w-80 bg-sb-surface border-r border-sb-on-surface/10 flex flex-col ${
          selectedContact ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-sb-on-surface/10">
            <h1 className="text-xl font-bold text-sb-on-surface flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Mensajes
            </h1>
            <p className="text-sm text-sb-on-surface/60 mt-1">Contacta a los docentes</p>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-on-surface/40" />
              <input
                type="text"
                placeholder="Buscar docentes..."
                className="w-full pl-9 pr-4 py-2 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sm text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sb-on-surface/60">Cargando...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-center text-sb-on-surface/60">No hay docentes disponibles</div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => selectContact(contact)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-sb-background/50 transition-colors text-left ${
                    selectedContact?.id === contact.id ? 'bg-sb-primary/5' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-sb-on-surface/8 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-medium text-sb-on-surface">
                        {contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    {onlineUsers.includes(contact.id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sb-surface" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sb-on-surface truncate">{contact.full_name}</p>
                    <p className="text-xs text-sb-on-surface/60 capitalize">{contact.role}</p>
                  </div>
                  {contact.unread_count > 0 && (
                    <span className="w-5 h-5 bg-sb-primary text-white text-xs rounded-full flex items-center justify-center">
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
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-sb-on-surface/20 mx-auto mb-4" />
                <p className="text-sb-on-surface/60">Selecciona un docente para chatear</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-sb-surface border-b border-sb-on-surface/10 flex items-center gap-3">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden p-2 hover:bg-sb-background rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 text-sb-on-surface" />
                </button>
                <div className="w-10 h-10 bg-sb-on-surface/8 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-medium text-sb-on-surface">
                    {selectedContact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sb-on-surface">{selectedContact.full_name}</p>
                  <p className="text-xs text-sb-on-surface/60">
                    {onlineUsers.includes(selectedContact.id) ? 'En línea' : 'Desconectado'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === selectedContact.id ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      msg.sender_id === selectedContact.id
                        ? 'bg-sb-on-surface/10 text-sb-on-surface'
                        : 'bg-sb-primary text-white'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_id === selectedContact.id
                          ? 'text-sb-on-surface/60'
                          : 'text-white/60'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-sb-surface border-t border-sb-on-surface/10">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-3 bg-sb-background border border-sb-on-surface/10 rounded-xl text-sb-on-surface placeholder:text-sb-on-surface/40 focus:outline-none focus:ring-2 focus:ring-sb-primary/20"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-sb-primary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
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
