import { CapabilityCard } from './CapabilityCard.js';
import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason?: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => { setSuggestions(data.suggestions); setStatus('success'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." status={status === 'loading' ? 'Loading workout suggestions...' : undefined}>
      {status === 'error' && <p role="alert" className="text-danger">Unable to load workout suggestions.</p>}
      {status === 'success' && suggestions.length === 0 && <p>No workout suggestions found.</p>}
      {status === 'success' && suggestions.length > 0 && (
        <ul className="list-group">{suggestions.map((workout, index) => <li className="list-group-item" key={index}><strong>{workout.title}</strong>{workout.reason ? ` - ${workout.reason}` : ''}</li>)}</ul>
      )}
    </CapabilityCard>
  );
}
