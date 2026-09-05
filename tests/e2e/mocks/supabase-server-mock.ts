let mockUser: any = { id: 'usr_test_1', email: 'test_user@nothingness.test' };

export function setTestAuthUser(user: any) {
  mockUser = user;
}

export async function createClient() {
  return {
    auth: {
      async getUser() {
        if (!mockUser) {
          return { data: { user: null }, error: new Error('Unauthorized') };
        }
        return { data: { user: mockUser }, error: null };
      },
    },
  };
}
