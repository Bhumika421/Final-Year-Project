// Tier-based loyalty system — matches backend get_user_loyalty_tier() in bookings_controller.php
import { api, getToken } from '../api/client';

export const LOYALTY_LEVELS = [
  {
    level: 1,
    name: 'Explorer',
    minBookings: 0,
    discount: 0.10,
    color: '#a8d96b',
    bg: 'rgba(168,217,107,0.15)',
    border: 'rgba(168,217,107,0.35)',
  },
  {
    level: 2,
    name: 'Adventurer',
    minBookings: 5,
    discount: 0.15,
    color: '#60c3f5',
    bg: 'rgba(96,195,245,0.15)',
    border: 'rgba(96,195,245,0.35)',
  },
  {
    level: 3,
    name: 'Elite Traveler',
    minBookings: 10,
    discount: 0.20,
    color: '#f5c842',
    bg: 'rgba(245,200,66,0.15)',
    border: 'rgba(245,200,66,0.35)',
  },
];

/**
 * Get current loyalty level info based on completed booking count
 */
export function getLoyaltyLevel(completedBookings) {
  let current = LOYALTY_LEVELS[0];
  for (const lvl of LOYALTY_LEVELS) {
    if (completedBookings >= lvl.minBookings) current = lvl;
  }
  return current;
}

/**
 * Get next level info (null if already max)
 */
export function getNextLevel(completedBookings) {
  const current = getLoyaltyLevel(completedBookings);
  return LOYALTY_LEVELS.find(l => l.level === current.level + 1) || null;
}

/**
 * Calculate discounted price
 */
export function calcDiscountedPrice(originalUSD, completedBookings) {
  const lvl = getLoyaltyLevel(completedBookings);
  const original = Number(originalUSD);
  const discounted = original * (1 - lvl.discount);
  return {
    original,
    discounted: Math.round(discounted * 100) / 100,
    savings: Math.round((original - discounted) * 100) / 100,
    discountPct: Math.round(lvl.discount * 100),
  };
}

/**
 * Fetch loyalty status from backend (server is source-of-truth).
 * Returns: { ok, completed_bookings, current_tier, next_tier } or null on error.
 * Returns null immediately if user is not logged in — no API call made.
 */
export async function fetchLoyaltyStatus() {
  // Guard: don't call API if not logged in
  if (!getToken()) return null;

  try {
    const res = await api.get('/api/loyalty/status');
    return res.data?.ok ? res.data : null;
  } catch (err) {
    console.error('Loyalty fetch failed:', err);
    return null;
  }
}

/**
 * Get completed bookings count from backend.
 * Returns 0 if not logged in or on error — always resolves to a number, never a Promise.
 */
export async function getBookingsCount() {
  const status = await fetchLoyaltyStatus();
  return status?.completed_bookings ?? 0;
}