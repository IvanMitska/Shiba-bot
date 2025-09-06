import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  theme: 'light',
  token: null,
  partner: null,
  isAdmin: false,
  
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  setToken: (token) => set({ token }),
  setPartner: (partner) => set({ partner }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  
  reset: () => set({
    user: null,
    theme: 'light',
    token: null,
    partner: null,
    isAdmin: false,
  }),
}));