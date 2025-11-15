/**
 * Automated Market Maker (AMM) utilities
 * Uses constant product formula: x * y = k
 */

export interface Pool {
  yesPool: number;
  noPool: number;
}

export interface PriceInfo {
  price: number;
  yesPrice: number;
  noPrice: number;
}

/**
 * Calculate the current price based on pool sizes
 */
export function getCurrentPrice(pool: Pool): PriceInfo {
  const total = pool.yesPool + pool.noPool;
  const yesPrice = pool.noPool / total;
  const noPrice = pool.yesPool / total;

  return {
    price: yesPrice,
    yesPrice,
    noPrice
  };
}

/**
 * Calculate shares received for a given investment amount
 * Using constant product AMM: (x + dx) * (y - dy) = x * y
 */
export function calculateSharesOut(
  pool: Pool,
  outcome: boolean,
  investment: number
): { shares: number; avgPrice: number; newPool: Pool } {
  const k = pool.yesPool * pool.noPool;

  let newYesPool: number;
  let newNoPool: number;
  let shares: number;

  if (outcome) {
    // Buying YES shares
    newNoPool = pool.noPool + investment;
    newYesPool = k / newNoPool;
    shares = pool.yesPool - newYesPool;
  } else {
    // Buying NO shares
    newYesPool = pool.yesPool + investment;
    newNoPool = k / newYesPool;
    shares = pool.noPool - newNoPool;
  }

  const avgPrice = investment / shares;

  return {
    shares,
    avgPrice,
    newPool: { yesPool: newYesPool, noPool: newNoPool }
  };
}

/**
 * Calculate the cost to buy a specific number of shares
 */
export function calculateCostForShares(
  pool: Pool,
  outcome: boolean,
  shares: number
): { cost: number; avgPrice: number; newPool: Pool } {
  const k = pool.yesPool * pool.noPool;

  let newYesPool: number;
  let newNoPool: number;
  let cost: number;

  if (outcome) {
    // Buying YES shares
    newYesPool = pool.yesPool - shares;
    if (newYesPool <= 0) {
      throw new Error('Not enough liquidity');
    }
    newNoPool = k / newYesPool;
    cost = newNoPool - pool.noPool;
  } else {
    // Buying NO shares
    newNoPool = pool.noPool - shares;
    if (newNoPool <= 0) {
      throw new Error('Not enough liquidity');
    }
    newYesPool = k / newNoPool;
    cost = newYesPool - pool.yesPool;
  }

  const avgPrice = cost / shares;

  return {
    cost,
    avgPrice,
    newPool: { yesPool: newYesPool, noPool: newNoPool }
  };
}

/**
 * Calculate payout when selling shares
 */
export function calculateSellPayout(
  pool: Pool,
  outcome: boolean,
  shares: number
): { payout: number; avgPrice: number; newPool: Pool } {
  const k = pool.yesPool * pool.noPool;

  let newYesPool: number;
  let newNoPool: number;
  let payout: number;

  if (outcome) {
    // Selling YES shares
    newYesPool = pool.yesPool + shares;
    newNoPool = k / newYesPool;
    payout = pool.noPool - newNoPool;
  } else {
    // Selling NO shares
    newNoPool = pool.noPool + shares;
    newYesPool = k / newNoPool;
    payout = pool.yesPool - newYesPool;
  }

  const avgPrice = payout / shares;

  return {
    payout,
    avgPrice,
    newPool: { yesPool: newYesPool, noPool: newNoPool }
  };
}
