import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/database";
import { Profile } from "@/types/database";

export interface User extends Profile {
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileWithTimeout = useCallback(async (userId: string, timeoutMs = 8000) => {
    try {
      const profilePromise = profileService.getById(userId);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), timeoutMs)
      );

      return await Promise.race([profilePromise, timeoutPromise]);
    } catch (error) {
      console.error("[AUTH] Profile fetch failed:", error);
      throw error;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        try {
          console.log("[AUTH] Fetching profile for user:", authUser.id);
          const profile = await fetchProfileWithTimeout(authUser.id, 8000);

          console.log("[AUTH] Profile loaded successfully");
          setUser({
            ...profile,
            email: authUser.email || profile.email,
          });
        } catch (profileError) {
          console.error("[AUTH] Profile fetch error:", profileError);
          console.log("[AUTH] Using fallback user object due to profile fetch failure");
          // Fallback: create a minimal user object if profile fetch fails
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            role: "customer",
            full_name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("[AUTH] Auth check error:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfileWithTimeout]);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH] Auth state changed:", event);
      if (session?.user) {
        try {
          console.log("[AUTH] Fetching profile for user:", session.user.id);
          const profile = await fetchProfileWithTimeout(session.user.id, 8000);

          console.log("[AUTH] Profile loaded:", profile);
          setUser({
            ...profile,
            email: session.user.email || profile.email,
          });
        } catch (error) {
          console.error("[AUTH] Error fetching profile:", error);
          console.log("[AUTH] Using fallback user object");
          // Fallback: create a minimal user object if profile fetch fails
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: "customer",
            full_name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [checkAuth, fetchProfileWithTimeout]);

  const login = async (email: string, password: string) => {
    console.log("[AUTH] Login attempt with email:", email);

    try {
      console.log("[AUTH] Calling signInWithPassword...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[AUTH] Login error:", error);
        throw error;
      }

      console.log("[AUTH] Login successful, user ID:", data.user?.id);

      if (data.user) {
        try {
          console.log("[AUTH] Fetching profile for user:", data.user.id);
          const profile = await fetchProfileWithTimeout(data.user.id, 8000);

          console.log("[AUTH] Profile fetched:", profile);
          setUser({
            ...profile,
            email: data.user.email || profile.email,
          });
        } catch (profileError) {
          console.error("[AUTH] Profile fetch error:", profileError);
          // Even if profile fetch fails, user is authenticated - allow login to proceed
          console.log("[AUTH] Using fallback user object");
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            role: "customer",
            full_name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (error: any) {
      console.error("[AUTH] Login failed:", error.message);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    console.log("[AUTH] Register attempt with email:", email);

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    try {
      console.log("[AUTH] Calling signUp with email:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("[AUTH] SignUp error:", error);
        throw error;
      }

      console.log("[AUTH] SignUp successful, user ID:", data.user?.id);

      if (data.user) {
        try {
          // Create profile with timeout
          console.log("[AUTH] Creating profile for user:", data.user.id);

          const profilePromise = profileService.create({
            id: data.user.id,
            email,
            full_name: fullName || null,
            role: "customer",
            avatar_url: null,
          });

          const profile = await Promise.race([
            profilePromise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Profile creation timeout")), 8000)
            ),
          ]);

          console.log("[AUTH] Profile created successfully");
          setUser({
            ...profile,
            email: data.user.email || email,
          });
        } catch (profileError) {
          console.error("[AUTH] Profile creation error:", profileError);
          console.log("[AUTH] Using fallback after profile creation failure");
          // Still set user even if profile creation fails
          setUser({
            id: data.user.id,
            email: data.user.email || email,
            role: "customer",
            full_name: fullName || null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (error: any) {
      console.error("[AUTH] Registration failed:", error.message);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
