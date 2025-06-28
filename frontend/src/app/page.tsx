import Header from '../components/Header';
import FeatureIntro from '../components/FeatureIntro';
import DemoPlaceholder from '../components/DemoPlaceholder';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <FeatureIntro />
        <DemoPlaceholder />
      </main>
      <Footer />
    </div>
  );
}
