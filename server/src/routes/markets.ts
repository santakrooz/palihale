import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/schema';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getCurrentPrice } from '../utils/amm';

const router = Router();

const createMarketSchema = z.object({
  question: z.string().min(10).max(200),
  description: z.string().max(1000).optional(),
  endDate: z.string().datetime()
});

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { question, description, endDate } = createMarketSchema.parse(req.body);
    const userId = req.userId!;

    const result = db.prepare(
      `INSERT INTO markets (creator_id, question, description, end_date, yes_pool, no_pool)
       VALUES (?, ?, ?, ?, 100, 100)`
    ).run(userId, question, description || '', endDate);

    const marketId = result.lastInsertRowid;

    const market = db.prepare(`
      SELECT m.*, u.username as creator_username
      FROM markets m
      JOIN users u ON m.creator_id = u.id
      WHERE m.id = ?
    `).get(marketId);

    res.json(market);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create market error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', (req, res) => {
  try {
    const { resolved, limit = '50', offset = '0' } = req.query;

    let query = `
      SELECT m.*, u.username as creator_username
      FROM markets m
      JOIN users u ON m.creator_id = u.id
    `;

    const params: any[] = [];

    if (resolved !== undefined) {
      query += ' WHERE m.resolved = ?';
      params.push(resolved === 'true' ? 1 : 0);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const markets = db.prepare(query).all(...params) as any[];

    const marketsWithPrices = markets.map(market => {
      const price = getCurrentPrice({
        yesPool: market.yes_pool,
        noPool: market.no_pool
      });

      return {
        ...market,
        currentPrice: price.yesPrice,
        yesPrice: price.yesPrice,
        noPrice: price.noPrice
      };
    });

    res.json(marketsWithPrices);
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const marketId = parseInt(req.params.id);

    const market = db.prepare(`
      SELECT m.*, u.username as creator_username
      FROM markets m
      JOIN users u ON m.creator_id = u.id
      WHERE m.id = ?
    `).get(marketId) as any;

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const price = getCurrentPrice({
      yesPool: market.yes_pool,
      noPool: market.no_pool
    });

    res.json({
      ...market,
      currentPrice: price.yesPrice,
      yesPrice: price.yesPrice,
      noPrice: price.noPrice
    });
  } catch (error) {
    console.error('Get market error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/resolve', authenticateToken, (req: AuthRequest, res) => {
  try {
    const marketId = parseInt(req.params.id);
    const userId = req.userId!;
    const { outcome } = z.object({ outcome: z.boolean() }).parse(req.body);

    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId) as any;

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    if (market.creator_id !== userId) {
      return res.status(403).json({ error: 'Only market creator can resolve' });
    }

    if (market.resolved) {
      return res.status(400).json({ error: 'Market already resolved' });
    }

    db.prepare(
      'UPDATE markets SET resolved = 1, outcome = ?, resolution_date = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(outcome ? 1 : 0, marketId);

    // Pay out winners
    const positions = db.prepare(
      'SELECT * FROM positions WHERE market_id = ?'
    ).all(marketId) as any[];

    const updateBalance = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');

    for (const position of positions) {
      if (position.outcome === (outcome ? 1 : 0)) {
        // Winner - gets shares as payout (each share = $1)
        updateBalance.run(position.shares, position.user_id);
      }
    }

    const updatedMarket = db.prepare(`
      SELECT m.*, u.username as creator_username
      FROM markets m
      JOIN users u ON m.creator_id = u.id
      WHERE m.id = ?
    `).get(marketId);

    res.json(updatedMarket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Resolve market error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
