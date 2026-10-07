import { PageHeading } from '../../components/ui/PageHeading';
import { HabitManager } from './HabitManager';
export function HabitsPage() {
  return (
    <>
      <PageHeading
        eyebrow=""
        title="Habits"
        description="Create and manage your daily habits."
      />
      <HabitManager />
    </>
  );
}
