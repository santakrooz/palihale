import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserPositions } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Position {
  id: number;
  market_id: number;
  question: string;
  outcome: boolean;
  shares: number;
  avg_price: number;
  resolved: boolean;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

const Portfolio: React.FC = () => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const response = await getUserPositions();
      setPositions(response.data);
    } catch (error) {
      console.error('Error loading positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const totalCost = positions.reduce((sum, pos) => sum + (pos.shares * pos.avg_price), 0);
  const totalProfitLoss = totalValue - totalCost;

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-2">Cash Balance</p>
          <p className="text-2xl font-bold">${user?.balance.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-2">Portfolio Value</p>
          <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-2">Total Invested</p>
          <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-2">Profit/Loss</p>
          <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
          </p>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-600 mb-4">You don't have any positions yet</p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Browse Markets
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/Loss
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.map((position) => (
                <tr key={position.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      to={`/market/${position.market_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {position.question}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-sm font-semibold ${
                        position.outcome
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {position.outcome ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{position.shares.toFixed(2)}</td>
                  <td className="px-6 py-4">${position.avg_price.toFixed(3)}</td>
                  <td className="px-6 py-4">${position.currentValue.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div
                      className={`${
                        position.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <div className="font-semibold">
                        {position.profitLoss >= 0 ? '+' : ''}$
                        {position.profitLoss.toFixed(2)}
                      </div>
                      <div className="text-xs">
                        ({position.profitLoss >= 0 ? '+' : ''}
                        {position.profitLossPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {position.resolved ? (
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
