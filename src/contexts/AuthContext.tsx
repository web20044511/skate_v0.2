import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
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

// Session timeout configuration - DISABLED for permanent login
// Set to very high value (24 hours) to prevent unwanted logouts
// Users will be kept logged in as long as their token is valid
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_WARNING_MS = 23 * 60 * 60 * 1000; // 23 hours

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Set warning timer (show warning 5 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      console.log("[AUTH] Session about to expire due to inactivity");
      // You can add a toast notification here if needed
    }, SESSION_WARNING_MS);

    // Set logout timer
    inactivityTimerRef.current = setTimeout(async () => {
      console.log("[AUTH] Logging out due to inactivity");
      await supabase.auth.signOut();
      setUser(null);
    }, SESSION_TIMEOUT_MS);
  }, []);

  const handleUserActivity = useCallback(() => {
    // Reset timer on any user activity (only for admins)
    if (user?.role === "admin") {
      resetInactivityTimer();
    }
  }, [user?.role, resetInactivityTimer]);

  const fetchProfileWithTimeout = useCallback(async (userId: string, timeoutMs = 30000) => {
    try {
      const profilePromise = profileService.getById(userId);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), timeoutMs)
      );

      return await Promise.race([profilePromise, timeoutPromise]);
    } catch (error) {
      console.debug("[AUTH] Profile fetch timeout or error (will use fallback):", error);
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
          const profile = await fetchProfileWithTimeout(authUser.id, 30000);

          console.log("[AUTH] Profile loaded successfully");
          const newUser = {
            ...profile,
            email: authUser.email || profile.email,
          };
          setUser(newUser);

          // Start inactivity timer for admins on page load (24 hour timeout)
          if (newUser.role === "admin") {
            resetInactivityTimer();
          }
        } catch (profileError) {
          const errorMsg = profileError instanceof Error ? profileError.message : String(profileError);
          console.debug("[AUTH] Profile fetch failed during checkAuth, keeping user logged in:", errorMsg);
          // Fallback: Keep user logged in with minimal data instead of logging them out
          // This prevents unwanted logouts due to network issues or slow database
          const fallbackUser = {
            id: authUser.id,
            email: authUser.email || "",
            role: "customer",
            full_name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUser(fallbackUser);

          // Start inactivity timer for admins
          if (fallbackUser.role === "admin") {
            resetInactivityTimer();
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[AUTH] Auth check error:", errorMsg);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfileWithTimeout, resetInactivityTimer]);

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
          const profile = await fetchProfileWithTimeout(session.user.id, 30000);

          console.log("[AUTH] Profile loaded:", profile);
          const newUser = {
            ...profile,
            email: session.user.email || profile.email,
          };
          setUser(newUser);

          // Start inactivity timer for admins
          if (newUser.role === "admin") {
            resetInactivityTimer();
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.debug("[AUTH] Profile fetch failed in auth state change, using fallback:", errorMsg);
          // Fallback: create a minimal user object if profile fetch fails
          const fallbackUser = {
            id: session.user.id,
            email: session.user.email || "",
            role: "customer",
            full_name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUser(fallbackUser);

          // Start inactivity timer for admins
          if (fallbackUser.role === "admin") {
            resetInactivityTimer();
          }
        }
      } else {
        setUser(null);
        // Clear timers on logout
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      }
    });

    return () => {
      subscription?.unsubscribe();
      // Clear timers on unmount
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [checkAuth, fetchProfileWithTimeout, resetInactivityTimer]);

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
          const profile = await fetchProfileWithTimeout(data.user.id, 30000);

          console.log("[AUTH] Profile fetched:", profile);
          setUser({
            ...profile,
            email: data.user.email || profile.email,
          });
        } catch (profileError) {
          const errorMsg = profileError instanceof Error ? profileError.message : String(profileError);
          console.debug("[AUTH] Profile fetch failed during login, using fallback:", errorMsg);
          // Even if profile fetch fails, user is authenticated - allow login to proceed
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
              setTimeout(() => reject(new Error("Profile creation timeout")), 30000)
            ),
          ]);

          console.log("[AUTH] Profile created successfully");
          setUser({
            ...profile,
            email: data.user.email || email,
          });
        } catch (profileError) {
          const errorMsg = profileError instanceof Error ? profileError.message : String(profileError);
          console.debug("[AUTH] Profile creation failed, using fallback:", errorMsg);
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
    // Clear timers on logout
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  // Set up activity listeners for admins
  useEffect(() => {
    if (user?.role === "admin") {
      // Listen for user activity
      const events = ["mousedown", "keydown", "scroll", "touchstart"];

      events.forEach((event) => {
        document.addEventListener(event, handleUserActivity);
      });

      // Initial timer setup
      resetInactivityTimer();

      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, handleUserActivity);
        });
        // Clear timers on unmount
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      };
    }
  }, [user?.role, handleUserActivity, resetInactivityTimer]);

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
