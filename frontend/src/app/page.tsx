import Header from '../components/Header';
import FeatureIntro from '../components/FeatureIntro';
import DemoPlaceholder from '../components/DemoPlaceholder';
import Footer from '../components/Footer';
import { getSession } from 'src/lib/session';

export default async function Home() {
  const session = await getSession();
  const user = session.githubUser;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-grow">
        <FeatureIntro />
        <DemoPlaceholder />
      </main>
      <Footer />
    </div>
  );
}
