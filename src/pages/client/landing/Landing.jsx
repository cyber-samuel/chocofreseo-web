import { useEffect } from 'react';
import ClientLayout  from '../../../components/layout/ClientLayout';
import Hero          from './components/Hero';
import ComoFunciona  from './components/ComoFunciona';
import Conocenos     from './components/Conocenos';
import CtaFinal      from './components/CtaFinal';
import './Landing.css';

export default function Landing() {
  useEffect(() => {
    document.title = 'ChocoFreseo | Chocolates, Fresas y Postres en Medellín';
  }, []);
  return (
    <ClientLayout>
      <Hero />
      <ComoFunciona />
      <Conocenos />
      <CtaFinal />
    </ClientLayout>
  );
}