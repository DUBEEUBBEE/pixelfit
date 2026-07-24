import { Camera, Clapperboard, FileBadge, Film, ImageIcon, Images, Maximize2, MonitorPlay, PanelsTopLeft, Repeat2, ShieldCheck, Sparkles } from "lucide-react";

const iconMap = {
  "passport-photo": FileBadge,
  "id-photo": Camera,
  "resident-id-photo": ShieldCheck,
  "youtube-banner": MonitorPlay,
  "favicon-maker": Sparkles,
  "photo-privacy-cleaner": ImageIcon,
  "image-compressor": PanelsTopLeft,
  "image-resizer": Maximize2,
  "image-converter": Repeat2,
  "social-image-pack": Images,
  "youtube-thumbnail": Clapperboard,
  "four-cut-photo": PanelsTopLeft,
  "film-photo": Film,
};

export function PresetIcon({ id, size = 24 }: { id: string; size?: number }) {
  const Icon = iconMap[id as keyof typeof iconMap] ?? ImageIcon;
  return <Icon aria-hidden="true" size={size} strokeWidth={2.1} />;
}
