import type { Session } from "@supabase/supabase-js";
import type { FoodPhotoAnalysis, GymMachineAnalysis, Profile } from "@fitfamily-ai/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { deviceStorage } from "@/services/localStorage";

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
  lastProfileByUser: Record<string, string | null>;
  setSession: (session: Session | null) => void;
  setProfiles: (profiles: Profile[]) => void;
  setActiveProfileId: (profileId: string | null) => void;
  setPendingFoodAnalysis: (analysis: FoodPhotoAnalysis | null) => void;
  setPendingMachineAnalysis: (analysis: GymMachineAnalysis | null) => void;
  setActiveWorkout: (profileId: string, workoutId: string | null) => void;
  activeProfile: () => Profile | null;
  getActiveWorkoutId: (profileId: string | null | undefined) => string | null;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      profiles: [],
      activeProfileId: null,
      pendingFoodAnalysis: null,
      pendingMachineAnalysis: null,
      activeWorkoutByProfile: {},
      lastProfileByUser: {},
      setSession: (session) =>
        set((state) => ({
          session,
          ...(state.session?.user.id !== session?.user.id
            ? {
                profiles: [],
                activeProfileId: null,
                pendingFoodAnalysis: null,
                pendingMachineAnalysis: null,
              }
            : {}),
        })),
      setProfiles: (profiles) => {
        const state = get();
        const currentId =
          state.activeProfileId ?? state.lastProfileByUser[state.session?.user.id ?? ""];
        set({
          profiles,
          activeProfileId:
            currentId && profiles.some((profile) => profile.id === currentId)
              ? currentId
              : (profiles[0]?.id ?? null),
        });
      },
      setActiveProfileId: (profileId) =>
        set((state) => ({
          activeProfileId: profileId,
          pendingFoodAnalysis: null,
          pendingMachineAnalysis: null,
          lastProfileByUser: state.session
            ? { ...state.lastProfileByUser, [state.session.user.id]: profileId }
            : state.lastProfileByUser,
        })),
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
    }),
    {
      name: "fitfamily.preferences.v2",
      storage: createJSONStorage(() => deviceStorage),
      partialize: (state) => ({
        activeWorkoutByProfile: state.activeWorkoutByProfile,
        lastProfileByUser: state.lastProfileByUser,
      }),
    },
  ),
);
