import type { Session } from "@supabase/supabase-js";
import type { FoodPhotoAnalysis, GymMachineAnalysis, Profile } from "@fitfamily-ai/shared";
import { create } from "zustand";

// activeWorkoutByProfile: ID de la rutina marcada como activa por cada perfil.
// Es un estado LOCAL del cliente (no hay flag is_active en el backend MVP).
// La rutina activa se usa para mostrar la "rutina del dia" y registrar entrenos rapidos.

type AppState = {
  session: Session | null;
  profiles: Profile[];
  activeProfileId: string | null;
  pendingFoodAnalysis: FoodPhotoAnalysis | null;
  pendingMachineAnalysis: GymMachineAnalysis | null;
  activeWorkoutByProfile: Record<string, string | null>;
  setSession: (session: Session | null) => void;
  setProfiles: (profiles: Profile[]) => void;
  setActiveProfileId: (profileId: string | null) => void;
  setPendingFoodAnalysis: (analysis: FoodPhotoAnalysis | null) => void;
  setPendingMachineAnalysis: (analysis: GymMachineAnalysis | null) => void;
  setActiveWorkout: (profileId: string, workoutId: string | null) => void;
  activeProfile: () => Profile | null;
  getActiveWorkoutId: (profileId: string | null | undefined) => string | null;
};

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  profiles: [],
  activeProfileId: null,
  pendingFoodAnalysis: null,
  pendingMachineAnalysis: null,
  activeWorkoutByProfile: {},
  setSession: (session) => set({ session }),
  setProfiles: (profiles) => {
    const currentId = get().activeProfileId;
    set({
      profiles,
      activeProfileId: currentId && profiles.some((profile) => profile.id === currentId)
        ? currentId
        : profiles[0]?.id ?? null,
    });
  },
  setActiveProfileId: (profileId) => set({ activeProfileId: profileId }),
  setPendingFoodAnalysis: (analysis) => set({ pendingFoodAnalysis: analysis }),
  setPendingMachineAnalysis: (analysis) => set({ pendingMachineAnalysis: analysis }),
  setActiveWorkout: (profileId, workoutId) =>
    set((state) => ({
      activeWorkoutByProfile: { ...state.activeWorkoutByProfile, [profileId]: workoutId },
    })),
  activeProfile: () => {
    const state = get();
    return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? null;
  },
  getActiveWorkoutId: (profileId) => {
    if (!profileId) return null;
    return get().activeWorkoutByProfile[profileId] ?? null;
  },
}));
