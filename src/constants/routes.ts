export const ROUTES = {
  HOME: "/",
  EMOTION: "/emotion",
  QUESTION: "/question",
  RECOMMEND: "/recommend",
  QUEST: "/quest",
  REFLECT: "/reflect",
  PROFILE: "/profile",
  SHOP: "/shop",
} as const;

/** progressStore 진행 플로우 순서 */
export const PROGRESS_FLOW: string[] = [
  ROUTES.HOME,
  ROUTES.EMOTION,
  ROUTES.QUESTION,
];

/** NavMenu / BottomBar를 숨길 경로 */
export const HIDE_NAV_ROUTES: string[] = [ROUTES.RECOMMEND];

/** BottomBar만 숨길 경로 */
export const HIDE_BOTTOM_BAR_ROUTES: string[] = [ROUTES.QUEST, ROUTES.REFLECT, ROUTES.PROFILE, ROUTES.SHOP];
