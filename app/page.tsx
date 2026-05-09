import { cookies } from "next/headers";
import LandingPage from "./components/LandingPage";

export default async function Home() {
  const store = await cookies();
  const hasSeenIntro = store.has("bb_intro_seen");
  return <LandingPage showCarousel={!hasSeenIntro} />;
}
