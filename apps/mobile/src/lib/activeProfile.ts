import { router } from "expo-router";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";

export function useActiveProfileId() {
  const profileId = useAppStore((state) => state.activeProfileId);

  useEffect(() => {
    if (!profileId) {
      router.replace("/profiles");
    }
  }, [profileId]);

  return profileId;
}
