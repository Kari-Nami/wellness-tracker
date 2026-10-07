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

it('bounds typed numeric readings before saving and still allows clearing them', async () => {
  const { record, date } = editor();
  const save = vi.spyOn(checkInsApi, 'update').mockResolvedValue({
    ...record,
    waterMl: 12000,
    sleep: { ...record.sleep, durationMinutes: 1440 },
  });
  const sleep = screen.getByLabelText('Hours of sleep');
  const water = screen.getByLabelText('Water intake in milliliters');
  fireEvent.change(sleep, { target: { value: '100' } });
  fireEvent.change(water, { target: { value: '1000000000' } });
  expect(sleep).toHaveValue(24);
  expect(water).toHaveValue(12000);
  expect(screen.getByRole('button', { name: '250 ml' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      date,
      expect.objectContaining({
        waterMl: 12000,
        sleep: { ...record.sleep, durationMinutes: 1440 },
      }),
    ),
  );
  fireEvent.change(sleep, { target: { value: '-5' } });
  fireEvent.change(water, { target: { value: '-250' } });
  expect(sleep).toHaveValue(0);
  expect(water).toHaveValue(0);
  fireEvent.change(sleep, { target: { value: '' } });
  fireEvent.change(water, { target: { value: '' } });
  expect(sleep).toHaveValue(null);
  expect(water).toHaveValue(null);
  save.mockRestore();
});
