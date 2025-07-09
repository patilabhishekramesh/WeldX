import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Image, Eye, Users, BarChart3, Settings, RefreshCw, Download, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import LoginPage from "./login";

export default function DatabaseGUI() {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState("analysis_results");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Verify token with server
      fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
        }
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    setLocation("/admin");
  };

  const handleBackToHome = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Fetch database statistics
  const { data: dbStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/database/stats"],
    retry: false,
  });

  // Fetch table data
  const { data: tableData, isLoading: tableLoading, refetch: refetchTable } = useQuery({
    queryKey: ["/api/database/table", selectedTable],
    retry: false,
  });

  // Fetch training images
  const { data: trainingImages, isLoading: trainingLoading, refetch: refetchTraining } = useQuery({
    queryKey: ["/api/training-images"],
    retry: false,
  });

  // Fetch analysis history
  const { data: analysisHistory, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ["/api/analysis-history"],
    retry: false,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchTable();
    refetchTraining();
    refetchAnalysis();
    toast({
      title: "Data refreshed",
      description: "Database information has been updated",
    });
  };

  const handleExport = async (tableName: string) => {
    try {
      const response = await fetch(`/api/database/export/${tableName}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_export.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Export successful",
        description: `${tableName} data exported`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderTableData = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available
        </div>
      );
    }

    const columns = Object.keys(data[0]);
    
    return (
      <ScrollArea className="h-96">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="capitalize">
                  {column.replace(/_/g, ' ')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column.includes('date') || column.includes('At') ? 
                      formatDate(row[column]) : 
                      typeof row[column] === 'object' ? 
                        JSON.stringify(row[column]) : 
                        String(row[column] || '')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Database Management</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBackToHome} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-4">Loading statistics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Analyses</span>
                </div>
                <div className="text-2xl font-bold">{dbStats?.total_analyses || 0}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Training Images</span>
                </div>
                <div className="text-2xl font-bold">{dbStats?.training_images || 0}</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Models</span>
                </div>
                <div className="text-2xl font-bold">{dbStats?.models || 0}</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Users</span>
                </div>
                <div className="text-2xl font-bold">{dbStats?.users || 0}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTable} onValueChange={setSelectedTable}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis_results">Analysis Results</TabsTrigger>
              <TabsTrigger value="training_images">Training Images</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis_results" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                <Button 
                  onClick={() => handleExport("analysis_results")} 
                  size="sm" 
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              {analysisLoading ? (
                <div className="text-center py-8">Loading analysis history...</div>
              ) : (
                renderTableData(analysisHistory || [])
              )}
            </TabsContent>

            <TabsContent value="training_images" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Training Images</h3>
                <Button 
                  onClick={() => handleExport("training_images")} 
                  size="sm" 
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              {trainingLoading ? (
                <div className="text-center py-8">Loading training images...</div>
              ) : (
                renderTableData(trainingImages || [])
              )}
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Models</h3>
                <Button 
                  onClick={() => handleExport("models")} 
                  size="sm" 
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              {tableLoading ? (
                <div className="text-center py-8">Loading models...</div>
              ) : (
                renderTableData(tableData || [])
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">System Users</h3>
                <Button 
                  onClick={() => handleExport("users")} 
                  size="sm" 
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              {tableLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                renderTableData(tableData || [])
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}