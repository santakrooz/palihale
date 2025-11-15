import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMarkets } from '../api/client';
import { format } from 'date-fns';

interface Market {
  id: number;
  question: string;
  description: string;
  end_date: string;
  resolved: boolean;
  outcome: boolean | null;
  creator_username: string;
  yesPrice: number;
  noPrice: number;
  created_at: string;
}

const Markets: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filter, setFilter] = useState<'active' | 'resolved'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarkets();
  }, [filter]);

  const loadMarkets = async () => {
    setLoading(true);
    try {
      const response = await getMarkets(filter === 'resolved');
      setMarkets(response.data);
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return (price * 100).toFixed(1) + '¢';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Prediction Markets</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded ${
              filter === 'resolved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading markets...</div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12 bg-gray-100 rounded-lg">
          <p className="text-gray-600 mb-4">No markets found</p>
          {filter === 'active' && (
            <Link
              to="/create"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Create a Market
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {markets.map((market) => (
            <Link
              key={market.id}
              to={`/market/${market.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{market.question}</h3>
                  <p className="text-gray-600 text-sm">
                    By {market.creator_username} •{' '}
                    {format(new Date(market.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {market.resolved ? (
                  <div className="bg-gray-200 px-4 py-2 rounded">
                    <div className="text-sm text-gray-600">Resolved</div>
                    <div className="font-bold">
                      {market.outcome ? 'YES' : 'NO'}
                    </div>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Current Price</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(market.yesPrice)}
                    </div>
                  </div>
                )}
              </div>

              {!market.resolved && (
                <div className="flex gap-4 mt-4">
                  <div className="flex-1 bg-green-50 p-3 rounded">
                    <div className="text-sm text-gray-600">YES</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatPrice(market.yesPrice)}
                    </div>
                  </div>
                  <div className="flex-1 bg-red-50 p-3 rounded">
                    <div className="text-sm text-gray-600">NO</div>
                    <div className="text-lg font-bold text-red-600">
                      {formatPrice(market.noPrice)}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-600">
                Ends: {format(new Date(market.end_date), 'MMM d, yyyy HH:mm')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Markets;
