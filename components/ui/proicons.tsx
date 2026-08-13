"use client"

import * as React from "react"
import materialSymbols from "@iconify-json/material-symbols/icons.json"

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  className?: string
  style?: React.CSSProperties
  color?: string
}

export type LucideIcon = React.ComponentType<IconProps>

function make(name: string): LucideIcon {
  const data = (materialSymbols as any).icons[name]
  return function GoogleIcon({ size = 24, className, style, color, ...rest }: IconProps) {
    return (
      <svg
        {...(rest as any)}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        style={{ color, ...style }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: data.body }}
      />
    )
  }
}

const Activity = make("monitoring")
const AlertCircle = make("error")
const AlertTriangle = make("warning")
const AlignCenter = make("align-center")
const AlignLeft = make("format-align-left")
const AlignRight = make("format-align-right")
const ArrowDownRight = make("south-east")
const ArrowLeft = make("arrow-left")
const ArrowLeftRight = make("swap-horiz")
const ArrowRight = make("arrow-right")
const ArrowUpDown = make("swap-vert")
const ArrowUpRight = make("north-east")
const Award = make("military-tech")
const BadgeCheck = make("verified")
const BarChart3 = make("bar-chart")
const Bell = make("notifications")
const BellRing = make("notifications-active")
const Bold = make("format-bold")
const BookMarked = make("bookmark")
const BookOpen = make("menu-book")
const Bot = make("smart-toy")
const Briefcase = make("work")
const Building2 = make("apartment")
const Calendar = make("calendar-month")
const CalendarDays = make("calendar-today")
const Check = make("check")
const CheckCircle = make("check-circle")
const CheckCircle2 = make("check-circle")
const CheckIcon = make("check")
const CheckSquare = make("check-box")
const ChevronDown = make("expand-more")
const ChevronDownIcon = make("expand-more")
const ChevronLeft = make("chevron-left")
const ChevronLeftIcon = make("chevron-left")
const ChevronRight = make("chevron-right")
const ChevronRightIcon = make("chevron-right")
const ChevronUpIcon = make("expand-less")
const Circle = make("circle")
const CircleDot = make("radio-button-checked")
const CircleIcon = make("circle")
const ClipboardList = make("checklist")
const Clock = make("schedule")
const CloudCog = make("cloud-sync")
const Code2 = make("code")
const Coffee = make("coffee")
const Coins = make("paid")
const Columns = make("view-column")
const Command = make("keyboard-command-key")
const Copy = make("content-copy")
const CreditCard = make("credit-card")
const Database = make("database")
const DollarSign = make("attach-money")
const Download = make("download")
const Dumbbell = make("fitness-center")
const Edit = make("edit")
const Edit3 = make("edit-square")
const ExternalLink = make("open-in-new")
const Eye = make("visibility")
const EyeOff = make("visibility-off")
const File = make("article")
const FileArchive = make("archive")
const FileCheck = make("task-alt")
const FileImage = make("photo")
const FileSignature = make("signature")
const FileSpreadsheet = make("table-chart")
const FileText = make("description")
const Filter = make("filter")
const Fingerprint = make("fingerprint")
const Flame = make("whatshot")
const FolderOpen = make("folder-open")
const FormatQuote = make("format-quote")
const Gem = make("diamond")
const Globe = make("globe")
const GraduationCap = make("school")
const GripVerticalIcon = make("drag-indicator")
const Handshake = make("handshake")
const Home = make("home")
const HardDrive = make("hard-drive")
const Hash = make("tag")
const Heading1 = make("looks-one")
const Heading2 = make("looks-two")
const HeadphonesIcon = make("headphones")
const Heart = make("favorite")
const HelpCircle = make("help")
const Image = make("image")
const Inbox = make("inbox")
const Info = make("info")
const Italic = make("format-italic")
const Key = make("key")
const KeyRound = make("key")
const Landmark = make("account-balance")
const Layers = make("layers")
const LayoutDashboard = make("dashboard")
const LayoutGrid = make("grid-view")
const Library = make("local-library")
const Link = make("link")
const Link2 = make("link-2")
const List = make("list")
const ListChecks = make("task-alt")
const ListOrdered = make("format-list-numbered")
const Loader2 = make("progress-activity")
const Loader2Icon = make("progress-activity")
const Lock = make("lock")
const LogIn = make("login")
const LogOut = make("logout")
const Mail = make("mail")
const MapPin = make("location-on")
const Megaphone = make("campaign")
const Menu = make("menu")
const MessageCircle = make("comment")
const MessageSquare = make("chat")
const Minus = make("remove")
const MinusIcon = make("remove")
const Monitor = make("monitor")
const Moon = make("dark-mode")
const MoreHorizontal = make("more-horiz")
const MoreHorizontalIcon = make("more-horiz")
const MoreVertical = make("more-vert")
const Palette = make("palette")
const PanelLeft = make("view-sidebar")
const PanelLeftClose = make("left-panel-close")
const PanelLeftIcon = make("view-sidebar")
const PartyPopper = make("celebration")
const Pause = make("pause")
const Pencil = make("edit-note")
const Phone = make("call")
const PieChart = make("pie-chart")
const Pin = make("pin")
const PinOff = make("pin-drop")
const Play = make("play-arrow")
const Plus = make("add")
const Power = make("power-settings-new")
const Printer = make("print")
const Receipt = make("receipt")
const RefreshCw = make("sync")
const Save = make("save")
const School = make("domain")
const Search = make("search")
const SearchIcon = make("search")
const Send = make("send")
const Server = make("storage")
const Settings = make("settings")
const Settings2 = make("tune")
const Share = make("share")
const Shield = make("shield")
const ShieldOff = make("gpp-bad")
const SlidersHorizontal = make("tune")
const Smartphone = make("mobile")
const Sparkles = make("auto-awesome")
const Square = make("square")
const Star = make("star")
const StarOutline = make("star-outline")
const StickyNote = make("sticky-note")
const Sun = make("sunny")
const Table = make("table")
const Table2 = make("table-view")
const Terminal = make("terminal")
const ToggleLeft = make("toggle-off")
const ToggleRight = make("toggle-on")
const Trash2 = make("delete")
const TrendingDown = make("trending-down")
const TrendingUp = make("trending-up")
const Type = make("text-fields")
const Underline = make("format-underlined")
const Unlink = make("link-off")
const Upload = make("upload")
const User = make("person")
const UserCheck = make("person-check")
const UserCircle = make("account-circle")
const UserPlus = make("person-add")
const UserRound = make("person-rounded")
const Users = make("group")
const UserX = make("person-remove")
const Video = make("video-camera-front")
const Wallet = make("wallet")
const X = make("close")
const XCircle = make("cancel")
const XIcon = make("close")
const Zap = make("bolt")

export {
  Activity,
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownRight,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  BellRing,
  Bold,
  BookMarked,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckIcon,
  CheckSquare,
  ChevronDown,
  ChevronDownIcon,
  ChevronLeft,
  ChevronLeftIcon,
  ChevronRight,
  ChevronRightIcon,
  ChevronUpIcon,
  Circle,
  CircleDot,
  CircleIcon,
  ClipboardList,
  Clock,
  CloudCog,
  Code2,
  Coffee,
  Coins,
  Columns,
  Command,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Dumbbell,
  Edit,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileArchive,
  FileCheck,
  FileImage,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Filter,
  Fingerprint,
  Flame,
  FolderOpen,
  FormatQuote,
  Gem,
  Globe,
  GraduationCap,
  GripVerticalIcon,
  Handshake,
  HardDrive,
  Hash,
  Heading1,
  Heading2,
  HeadphonesIcon,
  Heart,
  HelpCircle,
  Home,
  Image,
  Inbox,
  Info,
  Italic,
  Key,
  KeyRound,
  Landmark,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Library,
  Link,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Loader2Icon,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Minus,
  MinusIcon,
  Monitor,
  Moon,
  MoreHorizontal,
  MoreHorizontalIcon,
  MoreVertical,
  Palette,
  PanelLeft,
  PanelLeftClose,
  PanelLeftIcon,
  PartyPopper,
  Pause,
  Pencil,
  Phone,
  PieChart,
  Pin,
  PinOff,
  Play,
  Plus,
  Power,
  Printer,
  Receipt,
  RefreshCw,
  Save,
  School,
  Search,
  SearchIcon,
  Send,
  Server,
  Settings,
  Settings2,
  Share,
  Shield,
  ShieldOff,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Square,
  Star,
  StarOutline,
  StickyNote,
  Sun,
  Table,
  Table2,
  Terminal,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingDown,
  TrendingUp,
  Type,
  Underline,
  Unlink,
  Upload,
  User,
  UserCheck,
  UserCircle,
  UserPlus,
  UserRound,
  Users,
  UserX,
  Video,
  Wallet,
  X,
  XCircle,
  XIcon,
  Zap,
}
