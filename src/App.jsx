import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ListingsManagerView from './components/ListingsManagerView';
import SectionsManagerView from './components/SectionsManagerView';
import LeadsManagerView from './components/LeadsManagerView';
import HeroManagerView from './components/HeroManagerView';
import { supabase } from './services/supabase';
import { INITIAL_SECTIONS, fetchSections, fetchListings, fetchLeads } from './services/storage';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    sections: INITIAL_SECTIONS,
    listings: [],
    leads: []
  });

  // Handle auth session state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        if (session.user.email !== 'agustinfidalgo200@gmail.com') {
          supabase.auth.signOut();
          setSession(null);
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (session.user.email !== 'agustinfidalgo200@gmail.com') {
          supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(session);
        }
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch lists when authenticated
  const loadDatabaseData = async () => {
    if (!session) return;
    try {
      const sections = await fetchSections();
      const listings = await fetchListings();
      const leads = await fetchLeads();
      setData({
        sections,
        listings,
        leads
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };


  useEffect(() => {
    if (session) {
      loadDatabaseData();
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <span className="text-sm font-semibold tracking-wider text-primary opacity-60">CARGANDO CRM...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLoginSuccess={(sess) => setSession(sess)} />;
  }

  const pendingLeadsCount = (data.leads || []).filter((l) => l.status === 'Pending').length;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-bg-canvas font-body">
      {/* Sidebar Nav */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        leadsCount={pendingLeadsCount}
        user={session.user}
        onLogout={handleLogout}
      />

      {/* Main Panel Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 lg:pl-[290px] pt-20 lg:pt-10 transition-all duration-300">
        {activeTab === 'dashboard' && (
          <DashboardView
            data={data}
            setActiveTab={setActiveTab}
            onOpenAddListing={() => setActiveTab('listings')}
          />
        )}

        {activeTab === 'listings' && (
          <ListingsManagerView
            data={data}
            setData={(newData) => setData(prev => ({ ...prev, ...newData }))}
            refreshData={loadDatabaseData}
          />
        )}

        {activeTab === 'sections' && (
          <SectionsManagerView
            data={data}
            setData={(newData) => setData(prev => ({ ...prev, ...newData }))}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsManagerView
            data={data}
            setData={(newData) => setData(prev => ({ ...prev, ...newData }))}
            refreshData={loadDatabaseData}
          />
        )}

        {activeTab === 'hero' && (
          <HeroManagerView />
        )}
      </main>
    </div>
  );
}
