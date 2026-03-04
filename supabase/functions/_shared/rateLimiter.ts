/**
 * Simple per-user rate limiter backed by the Supabase `rate_limit_calls` table.
 *
 * Usage:
 *   const limiter = new RateLimiter(serviceSupabaseClient);
 *   const { limited, remaining } = await limiter.check(userId, 'parse-receipt-image', 20, 60);
 *   if (limited) return new Response('Rate limit exceeded', { status: 429 });
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetInSeconds: number;
}

export class RateLimiter {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * @param userId      The authenticated user's ID
   * @param fnName      Logical function name used as a namespace
   * @param maxCalls    Maximum number of calls allowed in the window
   * @param windowMins  Rolling window in minutes (default 60)
   */
  async check(
    userId: string,
    fnName: string,
    maxCalls: number,
    windowMins = 60
  ): Promise<RateLimitResult> {
    const windowStart = new Date(
      Date.now() - windowMins * 60 * 1000
    ).toISOString();

    // Count calls in the current window
    const { count, error } = await this.client
      .from("rate_limit_calls")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("function_name", fnName)
      .gte("called_at", windowStart);

    if (error) {
      // Fail open — don't block users if the rate limit table is unavailable
      console.error("Rate limiter DB error:", error.message);
      return { limited: false, remaining: maxCalls, resetInSeconds: windowMins * 60 };
    }

    const callCount = count ?? 0;

    if (callCount >= maxCalls) {
      return {
        limited: true,
        remaining: 0,
        resetInSeconds: windowMins * 60,
      };
    }

    // Record this call (fire-and-forget; don't await to keep latency low)
    this.client
      .from("rate_limit_calls")
      .insert({ user_id: userId, function_name: fnName })
      .then(({ error: insertErr }) => {
        if (insertErr) console.error("Rate limiter insert error:", insertErr.message);
      });

    // Periodically clean up old records (probabilistic — ~5% of requests)
    if (Math.random() < 0.05) {
      const cutoff = new Date(Date.now() - windowMins * 2 * 60 * 1000).toISOString();
      this.client
        .from("rate_limit_calls")
        .delete()
        .eq("user_id", userId)
        .eq("function_name", fnName)
        .lt("called_at", cutoff)
        .then(() => {});
    }

    return {
      limited: false,
      remaining: maxCalls - callCount - 1,
      resetInSeconds: windowMins * 60,
    };
  }
}
