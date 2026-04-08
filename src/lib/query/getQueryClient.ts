import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

/** 서버 컴포넌트용 — 요청당 하나의 QueryClient를 생성 (React.cache로 중복 방지) */
const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
        },
      },
    }),
);

export default getQueryClient;
