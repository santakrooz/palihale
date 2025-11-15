import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMarket, buyShares, sellShares, resolveMarket } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface Market {
  id: number;
  question: string;
  description: string;
  end_date: string;
  resolved: boolean;
  outcome: boolean | null;
  creator_id: number;
  creator_username: string;
  yesPrice: number;
  noPrice: number;
  yes_pool: number;
  no_pool: number;
  created_at: string;
}

const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [outcome, setOutcome] = useState<boolean>(true);
  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMarket();
  }, [id]);

  const loadMarket = async () => {
    try {
      const response = await getMarket(parseInt(id!));
      setMarket(response.data);
    } catch (error) {
      console.error('Error loading market:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setError('');
    setSuccess('');

    try {
      if (tradeType === 'buy') {
        await buyShares(parseInt(id!), outcome, parseFloat(amount));
        setSuccess(`Successfully bought ${outcome ? 'YES' : 'NO'} shares for $${amount}`);
        setAmount('');
      } else {
        await sellShares(parseInt(id!), outcome, parseFloat(shares));
        setSuccess(`Successfully sold ${parseFloat(shares).toFixed(2)} ${outcome ? 'YES' : 'NO'} shares`);
        setShares('');
      }
      await loadMarket();
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Trade failed');
    }
  };

  const handleResolve = async (resolvedOutcome: boolean) => {
    if (!window.confirm(`Are you sure you want to resolve this market as ${resolvedOutcome ? 'YES' : 'NO'}?`)) {
      return;
    }

    try {
      await resolveMarket(parseInt(id!), resolvedOutcome);
      setSuccess('Market resolved successfully');
      await loadMarket();
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Resolution failed');
    }
  };

  const formatPrice = (price: number) => {
    return (price * 100).toFixed(1) + '¢';
  };

  const estimateShares = () => {
    if (!market || !amount || parseFloat(amount) <= 0) return null;
    const investment = parseFloat(amount);
    const pool = outcome ? market.no_pool : market.yes_pool;
    const k = market.yes_pool * market.no_pool;
    const newPool = pool + investment;
    const otherPool = k / newPool;
    const currentOtherPool = outcome ? market.yes_pool : market.no_pool;
    const sharesOut = currentOtherPool - otherPool;
    return sharesOut;
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!market) {
    return <div className="container mx-auto px-4 py-8">Market not found</div>;
  }

  const canResolve = user && user.id === market.creator_id && !market.resolved;
  const isEnded = new Date(market.end_date) < new Date();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h1 className="text-3xl font-bold mb-4">{market.question}</h1>

        {market.description && (
          <p className="text-gray-700 mb-6">{market.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Creator</p>
            <p className="font-semibold">{market.creator_username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="font-semibold">
              {format(new Date(market.end_date), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        </div>

        {market.resolved ? (
          <div className="bg-gray-100 p-6 rounded-lg text-center">
            <p className="text-gray-600 mb-2">Market Resolved</p>
            <p className="text-4xl font-bold">
              {market.outcome ? 'YES' : 'NO'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-gray-600 mb-2">YES</p>
              <p className="text-4xl font-bold text-green-600">
                {formatPrice(market.yesPrice)}
              </p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <p className="text-gray-600 mb-2">NO</p>
              <p className="text-4xl font-bold text-red-600">
                {formatPrice(market.noPrice)}
              </p>
            </div>
          </div>
        )}
      </div>

      {canResolve && isEnded && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold mb-4">Resolve Market</h3>
          <p className="text-sm text-gray-700 mb-4">
            The market has ended. As the creator, you can now resolve it.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => handleResolve(true)}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Resolve as YES
            </button>
            <button
              onClick={() => handleResolve(false)}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Resolve as NO
            </button>
          </div>
        </div>
      )}

      {!market.resolved && !isEnded && user && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Trade</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTradeType('buy')}
              className={`flex-1 py-2 px-4 rounded ${
                tradeType === 'buy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTradeType('sell')}
              className={`flex-1 py-2 px-4 rounded ${
                tradeType === 'sell'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Sell
            </button>
          </div>

          <form onSubmit={handleTrade} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outcome
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOutcome(true)}
                  className={`flex-1 py-2 px-4 rounded ${
                    outcome
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  YES {formatPrice(market.yesPrice)}
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome(false)}
                  className={`flex-1 py-2 px-4 rounded ${
                    !outcome
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  NO {formatPrice(market.noPrice)}
                </button>
              </div>
            </div>

            {tradeType === 'buy' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  max={user.balance}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: ${user.balance.toFixed(2)}
                </p>
                {estimateShares() && (
                  <p className="text-sm text-green-600 mt-1">
                    ≈ {estimateShares()!.toFixed(2)} shares
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shares
                </label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              {tradeType === 'buy' ? 'Buy Shares' : 'Sell Shares'}
            </button>
          </form>
        </div>
      )}

      {!user && !market.resolved && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="mb-4">Login to start trading on this market</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketDetail;
