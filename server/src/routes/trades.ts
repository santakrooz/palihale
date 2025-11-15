import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/schema';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { calculateSharesOut, calculateSellPayout } from '../utils/amm';

const router = Router();

const buySharesSchema = z.object({
  marketId: z.number().int().positive(),
  outcome: z.boolean(),
  amount: z.number().positive()
});

const sellSharesSchema = z.object({
  marketId: z.number().int().positive(),
  outcome: z.boolean(),
  shares: z.number().positive()
});

router.post('/buy', authenticateToken, (req: AuthRequest, res) => {
  const transaction = db.transaction((userId: number, data: any) => {
    const { marketId, outcome, amount } = data;

    // Get user balance
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;

    if (!user || user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Get market
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId) as any;

    if (!market) {
      throw new Error('Market not found');
    }

    if (market.resolved) {
      throw new Error('Market already resolved');
    }

    if (new Date(market.end_date) < new Date()) {
      throw new Error('Market has ended');
    }

    // Calculate shares
    const { shares, avgPrice, newPool } = calculateSharesOut(
      { yesPool: market.yes_pool, noPool: market.no_pool },
      outcome,
      amount
    );

    // Update user balance
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);

    // Update market pools
    db.prepare('UPDATE markets SET yes_pool = ?, no_pool = ? WHERE id = ?')
      .run(newPool.yesPool, newPool.noPool, marketId);

    // Record trade
    const tradeResult = db.prepare(`
      INSERT INTO trades (user_id, market_id, outcome, shares, price, total_cost, trade_type)
      VALUES (?, ?, ?, ?, ?, ?, 'BUY')
    `).run(userId, marketId, outcome ? 1 : 0, shares, avgPrice, amount);

    // Update or create position
    const existingPosition = db.prepare(
      'SELECT * FROM positions WHERE user_id = ? AND market_id = ? AND outcome = ?'
    ).get(userId, marketId, outcome ? 1 : 0) as any;

    if (existingPosition) {
      const totalShares = existingPosition.shares + shares;
      const totalCost = (existingPosition.shares * existingPosition.avg_price) + amount;
      const newAvgPrice = totalCost / totalShares;

      db.prepare(`
        UPDATE positions
        SET shares = ?, avg_price = ?
        WHERE user_id = ? AND market_id = ? AND outcome = ?
      `).run(totalShares, newAvgPrice, userId, marketId, outcome ? 1 : 0);
    } else {
      db.prepare(`
        INSERT INTO positions (user_id, market_id, outcome, shares, avg_price)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, marketId, outcome ? 1 : 0, shares, avgPrice);
    }

    return {
      tradeId: tradeResult.lastInsertRowid,
      shares,
      avgPrice,
      totalCost: amount
    };
  });

  try {
    const result = transaction(req.userId!, buySharesSchema.parse(req.body));
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Buy shares error:', error);
    res.status(500).json({ error: (error as Error).message || 'Internal server error' });
  }
});

router.post('/sell', authenticateToken, (req: AuthRequest, res) => {
  const transaction = db.transaction((userId: number, data: any) => {
    const { marketId, outcome, shares } = data;

    // Get position
    const position = db.prepare(
      'SELECT * FROM positions WHERE user_id = ? AND market_id = ? AND outcome = ?'
    ).get(userId, marketId, outcome ? 1 : 0) as any;

    if (!position || position.shares < shares) {
      throw new Error('Insufficient shares');
    }

    // Get market
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId) as any;

    if (!market) {
      throw new Error('Market not found');
    }

    if (market.resolved) {
      throw new Error('Market already resolved');
    }

    // Calculate payout
    const { payout, avgPrice, newPool } = calculateSellPayout(
      { yesPool: market.yes_pool, noPool: market.no_pool },
      outcome,
      shares
    );

    // Update user balance
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payout, userId);

    // Update market pools
    db.prepare('UPDATE markets SET yes_pool = ?, no_pool = ? WHERE id = ?')
      .run(newPool.yesPool, newPool.noPool, marketId);

    // Record trade
    const tradeResult = db.prepare(`
      INSERT INTO trades (user_id, market_id, outcome, shares, price, total_cost, trade_type)
      VALUES (?, ?, ?, ?, ?, ?, 'SELL')
    `).run(userId, marketId, outcome ? 1 : 0, shares, avgPrice, payout);

    // Update position
    const newShares = position.shares - shares;
    if (newShares > 0.001) {
      db.prepare(
        'UPDATE positions SET shares = ? WHERE user_id = ? AND market_id = ? AND outcome = ?'
      ).run(newShares, userId, marketId, outcome ? 1 : 0);
    } else {
      db.prepare(
        'DELETE FROM positions WHERE user_id = ? AND market_id = ? AND outcome = ?'
      ).run(userId, marketId, outcome ? 1 : 0);
    }

    return {
      tradeId: tradeResult.lastInsertRowid,
      shares,
      avgPrice,
      payout
    };
  });

  try {
    const result = transaction(req.userId!, sellSharesSchema.parse(req.body));
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Sell shares error:', error);
    res.status(500).json({ error: (error as Error).message || 'Internal server error' });
  }
});

router.get('/history', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = '50', offset = '0' } = req.query;

    const trades = db.prepare(`
      SELECT t.*, m.question as market_question
      FROM trades t
      JOIN markets m ON t.market_id = m.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(limit as string), parseInt(offset as string));

    res.json(trades);
  } catch (error) {
    console.error('Get trade history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
