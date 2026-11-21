import { CapabilityCard } from './CapabilityCard.js';
import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => { setEntries(data.leaderboard); setStatus('success'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." status={status === 'loading' ? 'Loading leaderboard...' : undefined}>
      {status === 'error' && <p role="alert" className="text-danger">Unable to load leaderboard.</p>}
      {status === 'success' && entries.length === 0 && <p>No leaderboard rankings available.</p>}
      {status === 'success' && entries.length > 0 && (
        <ol className="list-group list-group-numbered">{entries.map((entry) => <li className="list-group-item" key={entry.rank}>{entry.teamName}: {entry.totalPoints} points</li>)}</ol>
      )}
    </CapabilityCard>
  );
}
