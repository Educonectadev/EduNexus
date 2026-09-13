"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Send, Loader2, GraduationCap, Users, ClipboardList, CreditCard, Search, BookOpen, FileText, ChevronRight, Bot, Zap, Plus, MessageSquare, Trash2, PanelLeft, ArrowLeft, Check, Copy, Sun, Moon, LogOut, Mic, Sparkle } from "@/components/ui/proicons"
import type { LucideIcon } from "@/components/ui/proicons"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useTheme } from "next-themes"

const iconMap: Record<string, LucideIcon> = { Users, GraduationCap, CreditCard, ClipboardList, FileText, Search, BookOpen, Sparkles }
interface Message { id:string; role:"user"|"assistant"; content:string; actions?:Action[]; timestamp:Date }
interface Action { label:string; description:string; icon:string; color:string; bg:string; command:string }
interface Conversation { id:string; title:string; messages:Message[]; createdAt:Date }

const quickActions:Action[]=[
  {label:"Registrar alumno",description:"Matricular estudiante",icon:"GraduationCap",color:"text-violet-600",bg:"bg-violet-500/10",command:"registrar alumno"},
  {label:"Buscar alumno",description:"Expediente por DNI",icon:"Search",color:"text-cyan-600",bg:"bg-cyan-500/10",command:"buscar alumno"},
  {label:"Tomar asistencia",description:"Asistencia del día",icon:"ClipboardList",color:"text-amber-600",bg:"bg-amber-500/10",command:"tomar asistencia"},
  {label:"Registrar pago",description:"Pago de pensión",icon:"CreditCard",color:"text-emerald-600",bg:"bg-emerald-500/10",command:"registrar pago"},
  {label:"Ver notas",description:"Calificaciones",icon:"BookOpen",color:"text-rose-600",bg:"bg-rose-500/10",command:"ver notas"},
  {label:"Resumen",description:"Estado general",icon:"Sparkles",color:"text-indigo-600",bg:"bg-indigo-500/10",command:"resumen"},
]
const suggestedPrompts=["¿Cómo me llamo?","Registra a Juan Pérez DNI 45678912 en 3° A","Ver pagos pendientes","Buscar alumno con DNI 45678912"]

function formatTime(d:Date){return new Intl.DateTimeFormat("es",{hour:"2-digit",minute:"2-digit"}).format(d)}

export function AIAssistantContent(){
  const router=useRouter()
  const {user,role,logout}=useAuthStore()
  const {theme,setTheme}=useTheme()
  const [conversations,setConversations]=React.useState<Conversation[]>([])
  const [activeId,setActiveId]=React.useState<string|null>(null)
  const [input,setInput]=React.useState("")
  const [loading,setLoading]=React.useState(false)
  const [sidebarOpen,setSidebarOpen]=React.useState(false)
  const endRef=React.useRef<HTMLDivElement>(null)
  const inputRef=React.useRef<HTMLTextAreaElement>(null)
  const active=conversations.find(c=>c.id===activeId)||null
  const messages=active?.messages||[]

  React.useEffect(()=>{
    if(conversations.length===0){
      const id=crypto.randomUUID()
      setConversations([{id,title:"Nueva conversación",createdAt:new Date(),messages:[{id:"welcome",role:"assistant",content:"¡Hola! Soy **Jarvis** ✨ tu copiloto de secretaría.\n\nPuedo ayudarte a matricular, buscar alumnos, tomar asistencia, registrar pagos y más. Dime **\"¿cómo me llamo?\"** para probar que te conozco, o elige una acción:",timestamp:new Date()}]}])
      setActiveId(id)
    }
  },[])
  React.useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"})},[messages,loading])
  React.useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),100)},[activeId])

  const newConversation=()=>{
    const id=crypto.randomUUID()
    setConversations(prev=>[{id,title:"Nueva conversación",createdAt:new Date(),messages:[{id:"welcome",role:"assistant",content:"¡Listo! Nueva conversación con Jarvis. ¿En qué te ayudo ahora?",timestamp:new Date()}]},...prev])
    setActiveId(id);setInput("")
  }
  const deleteConversation=(id:string)=>{setConversations(p=>p.filter(c=>c.id!==id)); if(activeId===id) setActiveId(conversations.filter(c=>c.id!==id)[0]?.id||null)}
  const updateMessages=(updater:(m:Message[])=>Message[])=>{if(!activeId) return; setConversations(prev=>prev.map(c=>c.id===activeId?{...c,messages:updater(c.messages)}:c))}
  const updateTitle=(id:string,t:string)=>setConversations(prev=>prev.map(c=>c.id===id?{...c,title:t.slice(0,38)+(t.length>38?"…":"")}:c))

  const sendMessage=async(text:string)=>{
    if(!text.trim()||loading||!activeId) return
    const isFirst=active?.messages.filter(m=>m.role==="user").length===0
    updateMessages(p=>[...p,{id:crypto.randomUUID(),role:"user",content:text.trim(),timestamp:new Date()}])
    setInput("");setLoading(true); if(isFirst) updateTitle(activeId,text.trim())
    try{
      const res=await fetch("/api/secretario/ai-assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text.trim(),history:messages.slice(-8).map(m=>({role:m.role,content:m.content}))})})
      const data=await res.json()
      updateMessages(p=>[...p,{id:crypto.randomUUID(),role:"assistant",content:data.response||"No pude procesar tu solicitud.",actions:data.actions||[],timestamp:new Date()}])
    }catch{ updateMessages(p=>[...p,{id:crypto.randomUUID(),role:"assistant",content:"Error de conexión.",timestamp:new Date()}]) } finally{ setLoading(false)}
  }
  const executeAction=(cmd:string)=>sendMessage(cmd)
  const handleKeyDown=(e:React.KeyboardEvent<HTMLTextAreaElement>)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input)}}
  const handleLogout=async()=>{await fetch("/api/auth/logout",{method:"POST"});logout();router.push("/login")}
  const roleLabel=role==="secretario"?"Secretario":role||"Usuario"

  return (
    <div className="flex h-full w-full bg-gradient-to-br from-sb-surface via-sb-surface to-violet-500/[0.04] overflow-hidden">
      <aside className={cn("flex flex-col h-full border-r border-sb-outline-variant/8 bg-sb-surface/80 backdrop-blur shrink-0 transition-[width] duration-200",sidebarOpen?"w-[240px]":"w-[64px]")}>
        <div className={cn("flex items-center h-12 shrink-0",sidebarOpen?"px-4 gap-2.5":"justify-center")}><Logo className="w-7 h-7"/><>{sidebarOpen&&<span className="text-[13px] font-bold tracking-tight">EduNexus · Jarvis</span>}</></div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 [&::-webkit-scrollbar]:hidden">
          <button onClick={()=>router.back()} className={cn("flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-sb-on-surface-variant/70 hover:bg-sb-surface-container hover:text-sb-on-surface w-full",!sidebarOpen&&"justify-center")}><ArrowLeft className="h-4 w-4"/>{sidebarOpen&&<span className="text-[13px]">Volver</span>}</button>
          <div>
            {sidebarOpen&&<p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-40">Conversaciones</p>}
            <button onClick={newConversation} className={cn("flex items-center gap-2.5 h-8 px-2.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 w-full text-[13px] font-medium shadow-sm",!sidebarOpen&&"justify-center")}><Plus className="h-4 w-4"/>{sidebarOpen&&"Nueva"}</button>
            {sidebarOpen&&<div className="mt-2 space-y-1">{conversations.map(c=>(<div key={c.id} onClick={()=>setActiveId(c.id)} className={cn("flex items-center gap-2 px-2.5 h-8 rounded-lg cursor-pointer text-[12px]",activeId===c.id?"bg-violet-500/10 text-violet-600":"hover:bg-sb-surface-container text-sb-on-surface-variant/70")}><MessageSquare className="h-3.5 w-3.5 shrink-0"/><span className="truncate flex-1">{c.title}</span><button onClick={e=>{e.stopPropagation();deleteConversation(c.id)}} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3"/></button></div>))}</div>}
          </div>
        </nav>
        <div className="border-t border-sb-outline-variant/10 p-2 space-y-2">
          <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="flex items-center gap-2.5 h-8 px-2.5 rounded-lg hover:bg-sb-surface-container w-full text-[13px]"><Sun className={cn("h-4 w-4",theme==="dark"?"hidden":"block")}/><Moon className={cn("h-4 w-4",theme==="dark"?"block":"hidden")}/>{sidebarOpen&&"Tema"}</button>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="hidden md:flex items-center gap-2 h-8 px-2.5 rounded-lg hover:bg-sb-surface-container w-full text-[13px]"><PanelLeft className="h-4 w-4"/>{sidebarOpen&&"Colapsar"}</button>
          <div className={cn("flex items-center gap-2 px-2.5 py-2 rounded-lg bg-sb-surface-container/50",!sidebarOpen&&"justify-center")}><div className="h-7 w-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{user?.full_name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"U"}</div>{sidebarOpen&&<div className="min-w-0"><p className="text-[12px] font-medium truncate">{user?.full_name}</p><p className="text-[10px] opacity-50">{roleLabel}</p></div>}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 h-8 px-2.5 rounded-lg hover:bg-sb-surface-container w-full text-[13px] opacity-70"><LogOut className="h-4 w-4"/>{sidebarOpen&&"Salir"}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between h-12 px-4 border-b border-sb-outline-variant/10 bg-sb-surface/60 backdrop-blur">
          <div className="flex items-center gap-2"><button onClick={()=>setSidebarOpen(true)} className={cn("h-7 w-7 grid place-items-center rounded-lg hover:bg-sb-surface-container",sidebarOpen&&"hidden")}><PanelLeft className="h-4 w-4"/></button>
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 grid place-items-center"><Sparkles className="h-3.5 w-3.5 text-white"/></div>
            <div><p className="text-[13px] font-semibold leading-none">Jarvis</p><p className="text-[10px] opacity-50">Siempre activo · DeepSeek</p></div>
            <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>En línea</span>
          </div>
          <button onClick={newConversation} className="hidden sm:flex items-center gap-1.5 h-7 px-3 rounded-full bg-violet-500 text-white text-[11px] font-medium hover:bg-violet-600"><Plus className="h-3 w-3"/>Nueva</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {messages.map(m=>(
              <div key={m.id} className={cn("flex gap-3",m.role==="user"?"flex-row-reverse":"")}>
                <div className={cn("h-7 w-7 rounded-lg grid place-items-center shrink-0 mt-0.5",m.role==="user"?"bg-violet-500 text-white":"bg-foreground text-background")}><>{m.role==="user"?<span className="text-[10px] font-bold">Tú</span>:<Bot className="h-3.5 w-3.5"/>}</></div>
                <div className={cn("flex-1 min-w-0 space-y-2",m.role==="user"&&"flex flex-col items-end")}>
                  <div className={cn("max-w-[88%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap",m.role==="user"?"bg-violet-500 text-white rounded-tr-md":"bg-white dark:bg-sb-surface-container border border-sb-outline-variant/10 rounded-tl-md shadow-sm")} >{m.content}</div>
                  {m.actions&&m.actions.length>0&&<div className="grid gap-1.5 w-full max-w-[88%]">{m.actions.map((a,i)=>{const I=iconMap[a.icon]||Sparkles;return <button key={i} onClick={()=>executeAction(a.command)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sb-surface-container/60 hover:bg-sb-surface-container border border-sb-outline-variant/10 text-left"><div className={cn("h-8 w-8 rounded-lg grid place-items-center",a.bg)}><I className={cn("h-4 w-4",a.color)}/></div><div className="flex-1 min-w-0"><p className="text-xs font-medium">{a.label}</p><p className="text-[10px] opacity-60">{a.description}</p></div><ChevronRight className="h-3.5 w-3.5 opacity-30"/></button>})}</div>}
                </div>
              </div>
            ))}
            {loading&&<div className="flex gap-3"><div className="h-7 w-7 rounded-lg bg-foreground grid place-items-center"><Bot className="h-3.5 w-3.5 text-background"/></div><div className="bg-sb-surface-container rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce"/><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]"/><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]"/></div></div>}
            <div ref={endRef}/>
          </div>
        </div>

        {messages.length<=1&&<div className="shrink-0 border-t border-sb-outline-variant/10 bg-sb-surface/50">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-40 mb-2 flex items-center gap-1.5"><Zap className="h-3 w-3 text-violet-500"/>Acciones rápidas</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{quickActions.map(a=>{const I=iconMap[a.icon]||Sparkles;return <button key={a.command} onClick={()=>executeAction(a.command)} className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-sb-surface border border-sb-outline-variant/10 hover:border-violet-500/30 hover:shadow-md transition-all text-left"><div className={cn("h-9 w-9 rounded-xl grid place-items-center",a.bg)}><I className={cn("h-4 w-4",a.color)}/></div><div><p className="text-[12px] font-semibold">{a.label}</p><p className="text-[10px] opacity-60">{a.description}</p></div></button>})}</div>
          </div>
        </div>}

        <div className="shrink-0 border-t border-sb-outline-variant/10 bg-sb-surface p-3">
          <div className="max-w-3xl mx-auto">
            {messages.length>1&&messages.length<=4&&<div className="flex gap-1.5 mb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">{suggestedPrompts.map(p=><button key={p} onClick={()=>sendMessage(p)} className="whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/15 hover:bg-violet-500 hover:text-white transition-colors">{p}</button>)}</div>}
            <div className="flex items-end gap-2 bg-sb-surface-container rounded-[20px] border border-sb-outline-variant/15 focus-within:border-violet-500/30 focus-within:shadow-lg focus-within:shadow-violet-500/10 p-2 transition-all">
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Pregunta a Jarvis..." rows={1} className="flex-1 bg-transparent outline-none resize-none py-2.5 px-2 text-[13px] placeholder:opacity-40 max-h-28" style={{minHeight:36}} onInput={e=>{const t=e.currentTarget;t.style.height="auto";t.style.height=Math.min(t.scrollHeight,112)+"px"}}/>
              <button onClick={()=>sendMessage(input)} disabled={!input.trim()||loading} className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 grid place-items-center text-white disabled:opacity-30 hover:shadow-md transition-all shrink-0"><Send className="h-4 w-4"/></button>
            </div>
            <p className="text-[10px] opacity-30 text-center mt-1.5">Jarvis puede cometer errores · Enter para enviar</p>
          </div>
        </div>
      </div>
    </div>
  )
}
function AIAssistant({open,onClose}:{open:boolean;onClose:()=>void}){
  return <AnimatePresence>{open&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" onClick={onClose}><motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:25,stiffness:300}} className="fixed inset-x-0 bottom-0 h-[88vh] bg-sb-surface rounded-t-2xl overflow-hidden md:inset-0 md:h-auto md:max-w-lg md:m-auto md:rounded-2xl md:max-h-[85vh]" onClick={e=>e.stopPropagation()}><AIAssistantContent/></motion.div></motion.div>}</AnimatePresence>
}
export default AIAssistant
