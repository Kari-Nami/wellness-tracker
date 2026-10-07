import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { UnsavedProvider } from '../../app/UnsavedProvider';
import { usersApi } from '../../api/users';
import { queryKeys } from '../../api/queryKeys';
import { createDemoDatabase } from '../../mocks/data';
function page() {
  const user = createDemoDatabase().accounts[0].user;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(queryKeys.profile, user);
  client.setQueryData(queryKeys.auth, user);
  render(
    <QueryClientProvider client={client}>
      <UnsavedProvider>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </UnsavedProvider>
    </QueryClientProvider>,
  );
  return user;
}
it('autosaves account edits and participation without a save button or timezone picker', async () => {
  const user = page();
  const update = vi
    .spyOn(usersApi, 'update')
    .mockResolvedValue({ ...user, leaderboardEnabled: false });
  expect(
    screen.queryByRole('button', { name: 'Save profile' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Timezone')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('switch'));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith({ leaderboardEnabled: false }),
  );
  expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
  update.mockRestore();
});
it('removes a target by autosaving null while preserving the other targets', async () => {
  const user = page();
  const update = vi
    .spyOn(usersApi, 'update')
    .mockResolvedValue({ ...user, goals: { ...user.goals, sleepHours: null } });
  fireEvent.click(screen.getByRole('button', { name: 'Clear sleep target' }));
  await waitFor(() =>
    expect(update).toHaveBeenCalledWith({
      goals: { ...user.goals, sleepHours: null },
    }),
  );
  expect(screen.getByLabelText('Sleep target (hours)')).toHaveValue(null);
  update.mockRestore();
});
it('keeps failed edits available for a deliberate retry', async () => {
  const user = page();
  const update = vi
    .spyOn(usersApi, 'update')
    .mockRejectedValueOnce(new Error('Connection failed'))
    .mockResolvedValue({ ...user, leaderboardEnabled: false });
  fireEvent.click(screen.getByRole('switch'));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Connection failed',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
  expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
  expect(update).toHaveBeenCalledTimes(2);
  update.mockRestore();
});
it('queues a newer edit while a save is in flight and does not overwrite it with the older response', async () => {
  const user = page();
  let finish!: (value: typeof user) => void;
  const update = vi
    .spyOn(usersApi, 'update')
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce({
      ...user,
      leaderboardEnabled: false,
      displayName: 'Updated name',
    });
  fireEvent.click(screen.getByRole('switch'));
  await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByLabelText('Display name'), {
    target: { value: 'Updated name' },
  });
  finish({ ...user, leaderboardEnabled: false });
  await waitFor(() =>
    expect(update).toHaveBeenNthCalledWith(2, { displayName: 'Updated name' }),
  );
  expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
  expect(screen.getByLabelText('Display name')).toHaveValue('Updated name');
  update.mockRestore();
});
