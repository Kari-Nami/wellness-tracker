import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CheckInEditor } from './CheckInEditor';
import { createDemoDatabase } from '../../mocks/data';
import { checkInsApi } from '../../api/checkIns';
import { todayInZone } from '../../lib/dates';
import { UnsavedProvider } from '../../app/UnsavedProvider';
function editor() {
  const db = createDemoDatabase();
  const user = db.accounts[0].user;
  const date = todayInZone(user.timezone);
  const record = db.records[user.id][date];
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <UnsavedProvider>
        <MemoryRouter>
          <CheckInEditor
            localDate={date}
            record={record}
            habits={db.habits[user.id]}
            user={user}
            streak={12}
          />
        </MemoryRouter>
      </UnsavedProvider>
    </QueryClientProvider>,
  );
  return { record, date };
}
describe('daily check-in interactions', () => {
  it('saves a cleared water entry as null while preserving other categories', async () => {
    const { record, date } = editor();
    const save = vi
      .spyOn(checkInsApi, 'update')
      .mockResolvedValue({ ...record, waterMl: null });
    fireEvent.change(screen.getByLabelText('Water intake in milliliters'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        date,
        expect.objectContaining({ waterMl: null, meals: record.meals }),
      ),
    );
    save.mockRestore();
  });
  it('keeps an invalid snack draft and prevents the network save', async () => {
    editor();
    const save = vi.spyOn(checkInsApi, 'update');
    fireEvent.click(screen.getByRole('button', { name: 'Add a snack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(save).not.toHaveBeenCalled();
    save.mockRestore();
  });
});

it('clears both sleep fields and water explicitly', async () => {
  const { record, date } = editor();
  const save = vi.spyOn(checkInsApi, 'update').mockResolvedValue({
    ...record,
    sleep: { durationMinutes: null, quality: null },
    waterMl: null,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Clear sleep' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear water' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      date,
      expect.objectContaining({
        sleep: { durationMinutes: null, quality: null },
        waterMl: null,
      }),
    ),
  );
  save.mockRestore();
});
