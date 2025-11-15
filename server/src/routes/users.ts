import { Router } from 'express';
import { db } from '../db/schema';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getCurrentPrice } from '../utils/amm';

const router = Router();

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const user = db.prepare(
      'SELECT id, username, email, balance, created_at FROM users WHERE id = ?'
    ).get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/positions', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const positions = db.prepare(`
      SELECT p.*, m.question, m.resolved, m.outcome, m.yes_pool, m.no_pool
      FROM positions p
      JOIN markets m ON p.market_id = m.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(userId) as any[];

    const positionsWithValue = positions.map(pos => {
      let currentValue = 0;

      if (pos.resolved) {
        // If resolved, value is shares if you won, 0 if you lost
        currentValue = pos.outcome === pos.outcome ? pos.shares : 0;
      } else {
        // Calculate current market value
        const price = getCurrentPrice({
          yesPool: pos.yes_pool,
          noPool: pos.no_pool
        });
        const sharePrice = pos.outcome ? price.yesPrice : price.noPrice;
        currentValue = pos.shares * sharePrice;
      }

      const totalCost = pos.shares * pos.avg_price;
      const profitLoss = currentValue - totalCost;

      return {
        ...pos,
        currentValue,
        profitLoss,
        profitLossPercent: (profitLoss / totalCost) * 100
      };
    });

    res.json(positionsWithValue);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
