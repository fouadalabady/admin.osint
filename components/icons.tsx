import { LucideProps, Search, LogOut, UserPlus, Settings, User, Mail, MessageSquare, Plus, CreditCard, Trash, FileSpreadsheet, CircleUser, Server, Shield, BarChart, FileText, HelpCircle, Loader2 } from "lucide-react";

export type IconProps = LucideProps;

export const Icons = {
  logo: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  search: Search,
  user: User,
  userPlus: UserPlus,
  settings: Settings,
  logout: LogOut,
  mail: Mail,
  message: MessageSquare,
  plus: Plus,
  trash: Trash,
  help: HelpCircle,
  spinner: Loader2,
  chart: BarChart,
  file: FileText,
  spreadsheet: FileSpreadsheet,
  creditCard: CreditCard,
  profile: CircleUser,
  server: Server,
  shield: Shield,
}; 