import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './ClientLayout.css';

export default function ClientLayout({ children }) {
  return (
    <div className="client-layout">
      <Navbar />
      <main className="client-main">
        {children}
      </main>
      <Footer />
    </div>
  );
}