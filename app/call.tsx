
import { Redirect } from 'expo-router';

// Audio calls have been removed. Redirect to conferences (video).
export default function CallScreen() {
  console.log('[Call] Route deprecated — redirecting to /conference');
  return <Redirect href="/conference" />;
}
