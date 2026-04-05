import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Role = 'CUSTOMER' | 'TECH' | 'ADMIN' | null;

export interface UserProfile {
    user_id: string;
    role: Role;
    first_name: string;
    last_name: string;
    phone: string | null;
    preferred_channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'TELEGRAM';
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    address2_line1?: string;
    address2_line2?: string;
    city2?: string;
    state2?: string;
    zip2?: string;
    data_treatment_consent?: boolean;
    data_treatment_consent_date?: string;
    status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'INACTIVE';
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        console.log('AuthContext: Fetching profile for', userId);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('AuthContext: Error fetching profile:', error);
            }
            if (data) {
                console.log('AuthContext: Profile found:', data.role);
                setProfile(data as UserProfile);
            } else {
                console.log('AuthContext: No profile found');
                setProfile(null);
            }
        } catch (error) {
            console.error('AuthContext: Unexpected error fetching profile:', error);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) console.error('Error getting initial session:', error);

            if (mounted) {
                if (session?.user) {
                    setSession(session);
                    setUser(session.user);
                    await fetchProfile(session.user.id); 
                } else {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                }
                setLoading(false);
            }
        }

        getInitialSession();

        // Safety timeout in case any operation hangs (Initial Session or Auth Change)
        const universalTimeout = setInterval(() => {
            if (mounted && loading) {
                console.warn('AuthContext: Universal loading timeout triggered. Forcing loading to false');
                setLoading(false);
            }
        }, 6000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('AuthContext: onAuthStateChange event:', event);
            if (mounted) {
                if (newSession?.user) {
                    setLoading(true);
                    setSession(newSession);
                    setUser(newSession.user);
                    
                    try {
                        // Use a Promise.race to enforce a 5s limit on this specific fetch
                        await Promise.race([
                            fetchProfile(newSession.user.id),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 5000))
                        ]);
                    } catch (e) {
                        console.error('AuthContext: Profile fetch failed or timed out:', e);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            clearInterval(universalTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
