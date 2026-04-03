import { User } from "lucide-react";
import XPBar from "@/components/XPBar";

export default function UserHUD() {
  return (
    <div className="flex items-center gap-3">
      {/* 아바타 */}
      <div className="relative shrink-0">
        {/* 그라데이션 링 */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand-logo)_0%,var(--ui-button-primary)_100%)] p-[2.5px] shadow-[0_4px_14px_rgba(255,148,55,0.4)]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
            <User size={20} strokeWidth={2} color="var(--ui-button-primary)" />
          </div>
        </div>
        {/* 온라인 dot */}
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#00E676]" />
      </div>

      {/* LV 뱃지 + XP 바 */}
      <XPBar value={52} level={4} current={260} max={500} />
    </div>
  );
}
