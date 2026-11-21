import { CapabilityCard } from './CapabilityCard.js';
import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => { setActivities(data.activities); setStatus('success'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." status={status === 'loading' ? 'Loading activities...' : undefined}>
      {status === 'error' && <p role="alert" className="text-danger">Unable to load activities.</p>}
      {status === 'success' && activities.length === 0 && <p>No activities found.</p>}
      {status === 'success' && activities.length > 0 && (
        <ul className="list-group">
          {activities.map((activity, index) => <li className="list-group-item" key={index}>{activity.type}: {activity.minutes} minutes ({activity.points} points)</li>)}
        </ul>
      )}
    </CapabilityCard>
  );
}
