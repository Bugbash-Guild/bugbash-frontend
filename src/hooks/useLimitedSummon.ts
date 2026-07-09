"use client";

import { useRef, useState } from "react";

import {
  createLimitedSummonExecutor,
  LimitedSummonHttpError,
  mapLimitedSummonPullError,
  type LimitedPullCount,
  type LimitedSummonErrorPresentation,
} from "@/lib/limitedSummon";
import type { LimitedSummonResponse } from "@/types/summon";

export function useLimitedSummon() {
  const executeRef = useRef<ReturnType<
    typeof createLimitedSummonExecutor
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LimitedSummonErrorPresentation | null>(
    null,
  );

  if (!executeRef.current) {
    executeRef.current = createLimitedSummonExecutor(fetch);
  }

  function reset() {
    setError(null);
  }

  async function pull(
    pullCount: LimitedPullCount,
  ): Promise<LimitedSummonResponse> {
    setLoading(true);
    setError(null);
    try {
      return await executeRef.current!(pullCount);
    } catch (cause) {
      const presentation =
        cause instanceof LimitedSummonHttpError
          ? mapLimitedSummonPullError(cause.status, cause.message)
          : mapLimitedSummonPullError(
              null,
              cause instanceof Error ? cause.message : String(cause),
            );
      setError(presentation);
      throw cause;
    } finally {
      setLoading(false);
    }
  }

  return { error, loading, pull, reset };
}
