import React from 'react';
import {
  Dumbbell,
  BookOpen,
  Code2,
  Droplet,
  Sparkles,
  Brain,
  Flame,
  Zap,
  CheckCircle,
  FolderPlus,
  ThumbsUp,
  Trophy,
  Check,
  Plus,
  Trash2,
  Edit,
  Archive,
  User,
  LayoutDashboard,
  BarChart2,
  Settings,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  RotateCcw,
  Upload,
  Clock,
  Compass,
  HelpCircle,
  Activity,
  Award,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

// Map key to Actual icon component
const iconMap: { [key: string]: React.ComponentType<{ className?: string; size?: number }> } = {
  Dumbbell,
  BookOpen,
  Code2,
  Droplet,
  Sparkles,
  Brain,
  Flame,
  Zap,
  CheckCircle,
  FolderPlus,
  ThumbsUp,
  Trophy,
  Check,
  Plus,
  Trash: Trash2,
  Trash2,
  Edit,
  Archive,
  User,
  LayoutDashboard,
  BarChart2,
  Settings,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  RotateCcw,
  Upload,
  Clock,
  Compass,
  HelpCircle,
  Activity,
  Award,
  TrendingUp,
  TrendingDown,
  Info
};

export const LucideIcon: React.FC<LucideIconProps> = ({ name, className = '', size }) => {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
};

export default LucideIcon;
