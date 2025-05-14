import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function SessionLogger() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "loading") {
      console.log("Session Data:", session);
    }
  }, [session, status]);

  return null; // No UI needed, just for console logging
}
