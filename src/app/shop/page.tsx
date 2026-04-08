import { Diamond, Lock, Palette, UserCircle, Award, SmilePlus, Zap } from "lucide-react";

type Currency = "points" | "xp" | "both";

interface ShopItem {
  name: string;
  description: string;
  cost: { points?: number; xp?: number };
  currency: Currency;
  icon: React.ElementType;
  category: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // 테마 — 포인트
  { name: "오션 블루", description: "시원한 블루 컬러 테마", cost: { points: 3000 }, currency: "points", icon: Palette, category: "테마" },
  { name: "포레스트 그린", description: "차분한 그린 컬러 테마", cost: { points: 3000 }, currency: "points", icon: Palette, category: "테마" },
  { name: "선셋 퍼플", description: "감성적인 퍼플 컬러 테마", cost: { points: 3000 }, currency: "points", icon: Palette, category: "테마" },
  // 테마 — 복합
  { name: "미드나잇", description: "프리미엄 다크 테마", cost: { points: 3000, xp: 200 }, currency: "both", icon: Palette, category: "테마" },

  // 아바타 — XP
  { name: "골드 프레임", description: "프로필에 골드 테두리", cost: { xp: 150 }, currency: "xp", icon: UserCircle, category: "아바타" },
  // 아바타 — 복합
  { name: "다이아 프레임", description: "프로필에 다이아 테두리", cost: { points: 2000, xp: 200 }, currency: "both", icon: UserCircle, category: "아바타" },
  { name: "불꽃 이펙트", description: "프로필에 불꽃 효과", cost: { points: 3000, xp: 300 }, currency: "both", icon: UserCircle, category: "아바타" },

  // 뱃지 — 포인트
  { name: "초보 탐험가", description: "닉네임 옆에 표시되는 뱃지", cost: { points: 1000 }, currency: "points", icon: Award, category: "뱃지" },
  // 뱃지 — XP
  { name: "감정 마스터", description: "닉네임 옆에 표시되는 뱃지", cost: { xp: 300 }, currency: "xp", icon: Award, category: "뱃지" },
  // 뱃지 — 복합
  { name: "전설의 실행러", description: "닉네임 옆에 표시되는 뱃지", cost: { points: 5000, xp: 500 }, currency: "both", icon: Award, category: "뱃지" },

  // 모바 스킨 — 포인트
  { name: "웃는 모바", description: "모바 말풍선에 웃는 표정", cost: { points: 1500 }, currency: "points", icon: SmilePlus, category: "모바 스킨" },
  // 모바 스킨 — XP
  { name: "졸린 모바", description: "모바 말풍선에 졸린 표정", cost: { xp: 100 }, currency: "xp", icon: SmilePlus, category: "모바 스킨" },
  // 모바 스킨 — 복합
  { name: "응원 모바", description: "모바 말풍선에 응원 표정", cost: { points: 1500, xp: 150 }, currency: "both", icon: SmilePlus, category: "모바 스킨" },
];

function CostBadge({ cost, currency }: { cost: ShopItem["cost"]; currency: Currency }) {
  if (currency === "points") {
    return (
      <div className="flex items-center gap-1 rounded-full bg-bg-muted px-2.5 py-1">
        <Diamond size={11} strokeWidth={2} color="var(--point-color)" />
        <span className="text-xs font-bold text-point">{cost.points!.toLocaleString()}P</span>
      </div>
    );
  }
  if (currency === "xp") {
    return (
      <div className="flex items-center gap-1 rounded-full bg-bg-muted px-2.5 py-1">
        <Zap size={11} strokeWidth={2} color="var(--point-color)" />
        <span className="text-xs font-bold text-point">{cost.xp!.toLocaleString()} XP</span>
      </div>
    );
  }
  // both
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 rounded-full bg-bg-muted px-2 py-1">
        <Diamond size={10} strokeWidth={2} color="var(--point-color)" />
        <span className="text-[0.625rem] font-bold text-point">{cost.points!.toLocaleString()}P</span>
      </div>
      <span className="text-[0.625rem] font-bold text-text-faint">+</span>
      <div className="flex items-center gap-1 rounded-full bg-bg-muted px-2 py-1">
        <Zap size={10} strokeWidth={2} color="var(--point-color)" />
        <span className="text-[0.625rem] font-bold text-point">{cost.xp!.toLocaleString()} XP</span>
      </div>
    </div>
  );
}

const CATEGORIES = ["전체", "테마", "아바타", "뱃지", "모바 스킨"];

export default function ShopPage() {
  return (
    <main className="flex min-h-dvh items-start justify-center px-4 pt-7 pb-8">
      <div className="flex w-full max-w-(--ui-content-width) flex-col gap-6">
        {/* 헤더 */}
        <h1 className="text-lg font-bold text-text-primary">상점</h1>

        {/* 준비중 배너 */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-point/30 bg-bg-muted px-6 py-6">
          <span className="text-base font-bold text-text-primary">준비중이에요</span>
          <span className="text-center text-xs text-text-muted">
            포인트와 XP로 테마, 아바타, 뱃지를 구매할 수 있어요.<br />
            조금만 기다려주세요!
          </span>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                cat === "전체"
                  ? "bg-brand-primary text-on-accent"
                  : "border border-border-default text-text-muted"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* 상품 목록 — 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          {SHOP_ITEMS.map((item) => (
            <div
              key={item.name}
              className="relative flex flex-col items-center gap-3 rounded-2xl border border-border-default bg-surface px-3 py-5 opacity-50"
            >
              <div className="absolute right-2 top-2">
                <Lock size={12} strokeWidth={2} color="var(--text-muted)" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-muted">
                <item.icon size={22} strokeWidth={1.8} color="var(--text-muted)" />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold text-text-primary">{item.name}</span>
                <span className="text-center text-xs text-text-muted">{item.description}</span>
              </div>
              <CostBadge cost={item.cost} currency={item.currency} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
