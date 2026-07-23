import React from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Home,
  Grid3x3,
  MessageSquare,
  User,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  Check,
  AlertCircle,
  Info,
  Clock,
  Package,
  Building2,
  Trash2,
  Edit,
  Download,
  Upload,
  Image,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  MapPin,
  Phone,
  Calendar,
  Star,
  Heart,
  Share2,
  Filter,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Settings,
  LogOut,
  Zap,
  Hammer,
  Palette,
  Trash,
  Truck,
  Recycle,
  Signpost,
  Monitor,
  Waves,
  BarChart3,
  Scale,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  Send,
  Copy,
  MoreVertical,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  RefreshCw,
  Bookmark,
  Flag,
  MessageCircle,
  Paperclip,
  Type,
  Sliders,
  Clipboard,
  Coffee,
  Gamepad2,
  Utensils,
  Dumbbell,
  Store,
  Camera,
  Gift,
  Tag,
  Handshake,
  Megaphone,
  Pin,
} from "lucide-react-native";

export type IconName =
  | "mail"
  | "lock"
  | "eye"
  | "eye-off"
  | "chevron-left"
  | "home"
  | "grid"
  | "message"
  | "user"
  | "plus"
  | "search"
  | "bell"
  | "menu"
  | "x"
  | "check"
  | "alert-circle"
  | "info"
  | "clock"
  | "package"
  | "building"
  | "trash"
  | "edit"
  | "download"
  | "upload"
  | "image"
  | "file"
  | "dollar"
  | "trending-up"
  | "users"
  | "briefcase"
  | "map-pin"
  | "phone"
  | "calendar"
  | "star"
  | "heart"
  | "share"
  | "filter"
  | "chevron-down"
  | "chevron-right"
  | "arrow-right"
  | "settings"
  | "logout"
  | "zap"
  | "hammer"
  | "palette"
  | "trash-2"
  | "truck"
  | "recycle"
  | "signpost"
  | "monitor"
  | "broom"
  | "bar-chart"
  | "scale"
  | "check-circle"
  | "x-circle"
  | "alert-triangle"
  | "loader"
  | "send"
  | "copy"
  | "more-vertical"
  | "more-horizontal"
  | "maximize"
  | "minimize"
  | "refresh"
  | "bookmark"
  | "flag"
  | "message-circle"
  | "paperclip"
  | "type"
  | "sliders"
  | "clipboard"
  | "coffee"
  | "gamepad2"
  | "utensils"
  | "dumbbell"
  | "store"
  | "camera"
  | "gift"
  | "waves"
  | "tag"
  | "handshake"
  | "megaphone"
  | "pin";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const iconMap: Record<IconName, React.ComponentType<any>> = {
  "mail": Mail,
  "lock": Lock,
  "eye": Eye,
  "eye-off": EyeOff,
  "chevron-left": ChevronLeft,
  "home": Home,
  "grid": Grid3x3,
  "message": MessageSquare,
  "user": User,
  "plus": Plus,
  "search": Search,
  "bell": Bell,
  "menu": Menu,
  "x": X,
  "check": Check,
  "alert-circle": AlertCircle,
  "info": Info,
  "clock": Clock,
  "package": Package,
  "building": Building2,
  "trash": Trash2,
  "edit": Edit,
  "download": Download,
  "upload": Upload,
  "image": Image,
  "file": FileText,
  "dollar": DollarSign,
  "trending-up": TrendingUp,
  "users": Users,
  "briefcase": Briefcase,
  "map-pin": MapPin,
  "phone": Phone,
  "calendar": Calendar,
  "star": Star,
  "heart": Heart,
  "share": Share2,
  "filter": Filter,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "arrow-right": ArrowRight,
  "settings": Settings,
  "logout": LogOut,
  "zap": Zap,
  "hammer": Hammer,
  "palette": Palette,
  "trash-2": Trash,
  "truck": Truck,
  "recycle": Recycle,
  "signpost": Signpost,
  "monitor": Monitor,
  "broom": Waves,
  "bar-chart": BarChart3,
  "scale": Scale,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  "alert-triangle": AlertTriangle,
  "loader": Loader,
  "send": Send,
  "copy": Copy,
  "more-vertical": MoreVertical,
  "more-horizontal": MoreHorizontal,
  "maximize": Maximize2,
  "minimize": Minimize2,
  "refresh": RefreshCw,
  "bookmark": Bookmark,
  "flag": Flag,
  "message-circle": MessageCircle,
  "paperclip": Paperclip,
  "type": Type,
  "sliders": Sliders,
  "clipboard": Clipboard,
  "coffee": Coffee,
  "gamepad2": Gamepad2,
  "utensils": Utensils,
  "dumbbell": Dumbbell,
  "store": Store,
  "camera": Camera,
  "gift": Gift,
  "waves": Waves,
  "tag": Tag,
  "handshake": Handshake,
  "megaphone": Megaphone,
  "pin": Pin,
};

export function LucideIcon({
  name,
  size = 24,
  color = "#000000",
  strokeWidth = 2,
}: IconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}
