import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Hero } from './components/Hero';
import { FeaturedProperties } from './components/FeaturedProperties';
import { Services } from './components/Services';
import { Footer } from './components/Footer';
import { PropertiesPage } from './components/PropertiesPage';
import { ContactPage } from './components/ContactPage';
import { PropertyDetail } from './components/PropertyDetail';
import { DynamicPage } from './components/DynamicPage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPropertyForm } from './pages/AdminPropertyForm';
import { ServicesList } from './components/admin/ServicesList';
import { ServiceForm } from './components/admin/ServiceForm';
import { PagesList } from './components/admin/PagesList';
import { PageForm } from './components/admin/PageForm';
import { SectionsList } from './components/admin/SectionsList';
import { SectionForm } from './components/admin/SectionForm';

const HomePage = () => (
  <div>
    <Hero />
    <FeaturedProperties />
    <Services />
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<DynamicPage />} />
              <Route path="/:slug" element={<DynamicPage />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/new" element={<AdminPropertyForm mode="create" />} />
              <Route path="/admin/edit/:id" element={<AdminPropertyForm mode="edit" />} />
              
              {/* Services Management */}
              <Route path="/admin/services" element={<ServicesList />} />
              <Route path="/admin/services/new" element={<ServiceForm />} />
              <Route path="/admin/services/:id/edit" element={<ServiceForm />} />
              
              {/* Pages Management */}
              <Route path="/admin/pages" element={<PagesList />} />
              <Route path="/admin/pages/new" element={<PageForm />} />
              <Route path="/admin/pages/:id/edit" element={<PageForm />} />
              
              {/* Sections Management */}
              <Route path="/admin/sections" element={<SectionsList />} />
              <Route path="/admin/sections/new" element={<SectionForm />} />
              <Route path="/admin/sections/:id/edit" element={<SectionForm />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;