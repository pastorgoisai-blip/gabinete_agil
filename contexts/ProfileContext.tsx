import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProfileData {
  name: string;
  party: string;
  photo: string | null;
}

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => void;
  loading: boolean;
}

const defaultProfile: ProfileData = {
  name: 'Carregando...',
  party: '...',
  photo: null,
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);

  // Fetch initial profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authProfile?.cabinet_id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('cabinets')
          .select('parliamentary_name, parliamentary_party, parliamentary_photo')
          .eq('id', authProfile.cabinet_id)
          .single();

        if (data) {
          setProfile({
            name: data.parliamentary_name || 'Nome do Político',
            party: data.parliamentary_party || 'Partido',
            photo: data.parliamentary_photo || null,
          });
        }
      } catch (err) {
        console.error('Error fetching profile context:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authProfile]);

  // Real-time subscription to changes in cabinets table
  useEffect(() => {
    if (!authProfile?.cabinet_id) return;

    const channel = supabase
      .channel('profile-update')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cabinets',
          filter: `id=eq.${authProfile.cabinet_id}`,
        },
        (payload) => {
          const newData = payload.new;
          setProfile({
            name: newData.parliamentary_name || 'Nome do Político',
            party: newData.parliamentary_party || 'Partido',
            photo: newData.parliamentary_photo || null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authProfile]);

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...data }));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
