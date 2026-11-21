import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function serviceError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isObject(input)) throw serviceError('Activity input is required', 400);
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || typeof teamId !== 'string') throw serviceError('Valid userId and teamId are required', 400);
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) throw serviceError('Valid userId and teamId are required', 400);
  if (typeof type !== 'string' || !type.trim()) throw serviceError('Activity type is required', 400);
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw serviceError('Minutes must be a positive number', 400);

  const [user, team] = await Promise.all([User.findById(userId).lean(), Team.findById(teamId).lean()]);
  if (!user) throw serviceError('User not found', 404);
  if (!team) throw serviceError('Team not found', 404);

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isObject(input)) throw serviceError('Team input is required', 400);
  if (typeof input.name !== 'string' || !input.name.trim()) throw serviceError('Team name is required', 400);
  if (typeof input.mascot !== 'string' || !input.mascot.trim()) throw serviceError('Team mascot is required', 400);

  const memberIds = Array.isArray(input.members) ? input.members : [];
  if (!memberIds.every((id) => typeof id === 'string' && mongoose.isValidObjectId(id))) {
    throw serviceError('Members must contain valid user IDs', 400);
  }
  const validUsers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (validUsers.length !== new Set(memberIds).size) throw serviceError('One or more team members were not found', 404);

  const team = await Team.create({ name: input.name.trim(), mascot: input.mascot.trim(), members: memberIds });
  await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  return team;
}

export async function getLeaderboard() {
  const activities = await Activity.find().select('team points').populate('team', 'name').lean();
  const totals = new Map<string, { teamName: string; totalPoints: number }>();
  for (const activity of activities) {
    const team = activity.team as unknown as { _id: mongoose.Types.ObjectId; name: string } | null;
    if (!team?.name) continue;
    const key = team._id.toString();
    const entry = totals.get(key) ?? { teamName: team.name, totalPoints: 0 };
    entry.totalPoints += typeof activity.points === 'number' ? activity.points : 0;
    totals.set(key, entry);
  }
  return [...totals.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw serviceError('User not found', 404);

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const recentType = typeof recent[0]?.type === 'string' ? recent[0].type : '';
  const activityFocus = recentType === 'run' || recentType === 'cycle'
    ? 'endurance'
    : recentType === 'strength'
      ? 'strength'
      : '';
  const preferredFocus = activityFocus || (typeof user.fitnessGoal === 'string' ? user.fitnessGoal : '');
  const workouts = await Workout.find().lean();
  const ordered = [...workouts].sort((a, b) => {
    const aMatch = a.focus === preferredFocus ? 0 : 1;
    const bMatch = b.focus === preferredFocus ? 0 : 1;
    return aMatch - bMatch;
  });
  return ordered.map((workout) => ({
    ...workout,
    reason: recentType
      ? `Based on your recent ${recentType} activity${preferredFocus ? ` and ${preferredFocus} goal` : ''}.`
      : `Based on your ${preferredFocus || 'fitness'} goal.`,
  }));
}

export { User };
