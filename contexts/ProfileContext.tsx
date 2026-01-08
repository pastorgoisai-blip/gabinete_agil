import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ProfileData {
  name: string;
  party: string;
  photo: string | null;
}

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => void;
}

const defaultProfile: ProfileData = {
  name: 'Wederson Lopes',
  party: 'Partido Novo',
  photo: null,
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<ProfileData>(() => {
    try {
      const saved = localStorage.getItem('politician_profile');
      return saved ? JSON.parse(saved) : defaultProfile;
    } catch (e) {
      return defaultProfile;
    }
  });

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfile(prev => {
      const newProfile = { ...prev, ...data };
      localStorage.setItem('politician_profile', JSON.stringify(newProfile));
      return newProfile;
    });
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
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
