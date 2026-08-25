import { Redirect } from 'expo-router';
import { useAppStore } from '../src/store/useAppStore';

export default function Index() {
  const currentUser = useAppStore(s => s.currentUser);

  if (!currentUser) {
    return <Redirect href="/login" />;
  }

  switch (currentUser.role) {
    case 'official':
      return <Redirect href="/(official)" />;
    case 'inspector':
      return <Redirect href="/(inspector)" />;
    case 'citizen':
      return <Redirect href="/(citizen)" />;
    default:
      return <Redirect href="/login" />;
  }
}
