import { Camera, FileBadge, ImageIcon, MonitorPlay, ShieldCheck, Sparkles } from "lucide-react";

const iconMap = {
  "passport-photo": FileBadge,
  "id-photo": Camera,
  "resident-id-photo": ShieldCheck,
  "youtube-banner": MonitorPlay,
  "favicon-maker": Sparkles,
  "photo-privacy-cleaner": ImageIcon,
};

export function PresetIcon({ id, size = 24 }: { id: string; size?: number }) {
  const Icon = iconMap[id as keyof typeof iconMap] ?? ImageIcon;
  return <Icon aria-hidden="true" size={size} strokeWidth={2.1} />;
}
