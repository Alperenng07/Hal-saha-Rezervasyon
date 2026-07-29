import { getAllPitchesAdmin } from "@/lib/actions/pitches";
import PitchesManager from "./pitches-manager";

export default async function AdminPitchesPage() {
  const pitches = await getAllPitchesAdmin();
  return <PitchesManager initialPitches={pitches} />;
}
