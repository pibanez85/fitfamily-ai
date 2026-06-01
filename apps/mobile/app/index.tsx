import { useEffect } from "react";
import { router } from "expo-router";
import { LoadingState } from "@/components/StateViews";
import { useAppStore } from "@/store/appStore";

export default function IndexScreen() {
  const session = useAppStore((state) => state.session);
  const activeProfileId = useAppStore((state) => state.activeProfileId);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    router.replace(activeProfileId ? "/dashboard" : "/profiles");
  }, [session, activeProfileId]);

  return <LoadingState label="Abriendo FitFamily AI..." />;
}
