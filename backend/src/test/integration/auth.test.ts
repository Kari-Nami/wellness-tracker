import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { prepareDatabase, clearDatabase, request, account } from './support';
import { POST as register } from '../../app/api/auth/register/route';
import { POST as login } from '../../app/api/auth/login/route';
import { POST as logout } from '../../app/api/auth/logout/route';
import { GET as me } from '../../app/api/auth/me/route';
import { PATCH as profile } from '../../app/api/users/me/route';
import { requireAdmin } from '../../lib/auth/guards';
import { User } from '../../models/User';
import {
  userDtoSchema,
  successEnvelope,
  DEFAULT_GOALS,
} from '../../types/contracts';
beforeAll(prepareDatabase);
beforeEach(clearDatabase);
afterAll(() => mongoose.disconnect());
describe('persistent authentication and profile', () => {
  it('registers normalized email, sets a private cookie, and returns a safe DTO', async () => {
    const response = await register(
      request('/auth/register', 'POST', {
        email: '  MEMBER@EXAMPLE.COM  ',
        password: 'password123',
        displayName: 'Member',
        timezone: 'Asia/Bangkok',
      }),
    );
    expect(response.status).toBe(201);
    const user = successEnvelope(userDtoSchema).parse(
      await response.json(),
    ).data;
    expect(user.email).toBe('member@example.com');
    expect(user.goals).toEqual(DEFAULT_GOALS);
    expect(response.headers.get('Set-Cookie')).toContain('HttpOnly');
    expect(response.headers.get('Set-Cookie')).toContain('SameSite=Lax');
    expect(Object.keys(user)).not.toContain('passwordHash');
    const stored = await User.findById(user.id).select('+passwordHash');
    expect(stored?.passwordHash).toMatch(/^sha256-bcrypt:/);
    expect(stored?.passwordHash).not.toContain('password123');
  });
  it('rejects duplicate emails, role injection, malformed JSON, and untrusted origins', async () => {
    await account();
    expect(
      (
        await register(
          request('/auth/register', 'POST', {
            email: 'MEMBER@example.com',
            password: 'password123',
            displayName: 'Duplicate',
            timezone: 'Asia/Bangkok',
          }),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await register(
          request('/auth/register', 'POST', {
            email: 'other@example.com',
            password: 'password123',
            displayName: 'Other',
            timezone: 'Asia/Bangkok',
            role: 'admin',
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await register(
          new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
              Origin: 'https://other.example',
              'Content-Type': 'application/json',
            },
            body: '{}',
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await register(
          new Request('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
              Origin: process.env.APP_ORIGIN!,
              'Content-Type': 'application/json',
            },
            body: 'invalid',
          }),
        )
      ).status,
    ).toBe(400);
  });
  it('authenticates credentials, resolves a persisted session, and clears matching cookie attributes', async () => {
    await account();
    const result = await login(
      request('/auth/login', 'POST', {
        email: 'member@example.com',
        password: 'integration-password',
      }),
    );
    expect(result.status).toBe(200);
    const cookie = result.headers.get('Set-Cookie')!.split(';')[0];
    expect(
      (await me(request('/auth/me', 'GET', undefined, cookie))).status,
    ).toBe(200);
    expect((await me(request('/auth/me'))).status).toBe(401);
    expect(
      (
        await login(
          request('/auth/login', 'POST', {
            email: 'member@example.com',
            password: 'wrong',
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await me(
          request('/auth/me', 'GET', undefined, 'wellness_session=malformed'),
        )
      ).status,
    ).toBe(401);
    const cleared = await logout(
      request('/auth/logout', 'POST', undefined, cookie),
    );
    expect(cleared.status).toBe(204);
    expect(await cleared.text()).toBe('');
    expect(cleared.headers.get('Set-Cookie')).toContain('Max-Age=0');
    expect(cleared.headers.get('Set-Cookie')).toContain('Path=/');
  });
  it('uses the persisted role for authorization and prevents profile role changes', async () => {
    const { user, cookie } = await account();
    await expect(
      requireAdmin(request('/admin', 'GET', undefined, cookie)),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (await profile(request('/users/me', 'PATCH', { role: 'admin' }, cookie)))
        .status,
    ).toBe(400);
    await User.updateOne({ _id: user.id }, { $set: { role: 'admin' } });
    expect(
      (await requireAdmin(request('/admin', 'GET', undefined, cookie))).role,
    ).toBe('admin');
    await User.deleteOne({ _id: user.id });
    expect(
      (await me(request('/auth/me', 'GET', undefined, cookie))).status,
    ).toBe(401);
  });
  it('keeps independent profile categories under concurrent mutations', async () => {
    const { cookie } = await account();
    const responses = await Promise.all([
      profile(
        request('/users/me', 'PATCH', { displayName: 'Updated' }, cookie),
      ),
      profile(
        request('/users/me', 'PATCH', { leaderboardEnabled: false }, cookie),
      ),
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    const dto = successEnvelope(userDtoSchema).parse(
      await (await me(request('/auth/me', 'GET', undefined, cookie))).json(),
    ).data;
    expect(dto.displayName).toBe('Updated');
    expect(dto.leaderboardEnabled).toBe(false);
    expect(dto.goals.waterMl).toBe(2000);
  });
});
