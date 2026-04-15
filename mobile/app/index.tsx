// ---------------------------------------------------------------------------
// Entry redirect -- sends user to the tabs group
// ---------------------------------------------------------------------------

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}
