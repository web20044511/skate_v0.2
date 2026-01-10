import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
}

export default function SupabaseTest() {
  const [results, setResults] = useState<TestResult[]>([
    { name: "Environment Variables", status: "pending", message: "" },
    { name: "Supabase Client", status: "pending", message: "" },
    { name: "Auth Session", status: "pending", message: "" },
    { name: "Database Connection", status: "pending", message: "" },
  ]);

  const runTests = async () => {
    const newResults: TestResult[] = [...results];

    // Test 1: Environment Variables
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (url && key) {
        newResults[0] = {
          name: "Environment Variables",
          status: "success",
          message: `URL: ${url.substring(0, 30)}... | Key loaded: ✓`,
        };
      } else {
        newResults[0] = {
          name: "Environment Variables",
          status: "error",
          message: `Missing: ${!url ? "VITE_SUPABASE_URL " : ""}${!key ? "VITE_SUPABASE_ANON_KEY" : ""}`,
        };
      }
    } catch (error) {
      newResults[0] = {
        name: "Environment Variables",
        status: "error",
        message: String(error),
      };
    }
    setResults(newResults);

    // Test 2: Supabase Client Initialization
    try {
      const { supabase } = await import("@/lib/supabase");
      newResults[1] = {
        name: "Supabase Client",
        status: "success",
        message: "Client initialized successfully",
      };
      setResults([...newResults]);

      // Test 3: Auth Session
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          newResults[2] = {
            name: "Auth Session",
            status: "error",
            message: `Error: ${error.message}`,
          };
        } else {
          newResults[2] = {
            name: "Auth Session",
            status: "success",
            message: data.session
              ? `Authenticated as: ${data.session.user?.email}`
              : "No active session (expected)",
          };
        }
      } catch (error) {
        newResults[2] = {
          name: "Auth Session",
          status: "error",
          message: `Error: ${String(error).substring(0, 100)}`,
        };
      }
      setResults([...newResults]);

      // Test 4: Database Connection
      try {
        const { data, error } = await supabase
          .from("memberships")
          .select("count")
          .limit(1);

        if (error) {
          newResults[3] = {
            name: "Database Connection",
            status: "error",
            message: `Error: ${error.message}`,
          };
        } else {
          newResults[3] = {
            name: "Database Connection",
            status: "success",
            message: "Database query successful ✓",
          };
        }
      } catch (error) {
        newResults[3] = {
          name: "Database Connection",
          status: "error",
          message: `Error: ${String(error).substring(0, 100)}`,
        };
      }
      setResults([...newResults]);
    } catch (error) {
      newResults[1] = {
        name: "Supabase Client",
        status: "error",
        message: String(error),
      };
      setResults([...newResults]);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Supabase Connection Diagnostic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg border"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {result.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {result.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  {result.status === "pending" && (
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{result.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t space-y-4">
              <Button onClick={runTests} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Tests Again
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
                <h4 className="font-semibold mb-2">Troubleshooting:</h4>
                <ul className="space-y-1 text-xs">
                  <li>
                    ❌ Environment Variables fail: Check .env file has
                    VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
                  </li>
                  <li>
                    ❌ Client fails: Check that Supabase URL is correct format
                  </li>
                  <li>
                    ❌ Database Connection fails: Check Supabase project is
                    active and tables exist
                  </li>
                  <li>
                    ❌ All fail: Verify Supabase is accessible from this
                    network
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
