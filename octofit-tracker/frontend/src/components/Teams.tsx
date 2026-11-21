import { CapabilityCard } from './CapabilityCard.js';
import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => { setTeams(data.teams); setStatus('success'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." status={status === 'loading' ? 'Loading teams...' : undefined}>
      {status === 'error' && <p role="alert" className="text-danger">Unable to load teams.</p>}
      {status === 'success' && teams.length === 0 && <p>No teams found.</p>}
      {status === 'success' && teams.length > 0 && (
        <ul className="list-group">{teams.map((team, index) => (
          <li className="list-group-item" key={index}>
            {team.name}{team.mascot ? ` - ${team.mascot}` : ''}
            {team.members.length > 0 && ` (Members: ${team.members.join(', ')})`}
          </li>
        ))}</ul>
      )}
    </CapabilityCard>
  );
}
