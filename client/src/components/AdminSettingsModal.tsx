import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Palette, Shield, Database, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdminSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define proper types for the API responses
interface Profile {
  username?: string;
  email?: string;
}

interface SettingsData {
  theme?: string;
  darkMode?: boolean;
  compactMode?: boolean;
  autoBackup?: boolean;
  emailNotifications?: boolean;
  sessionTimeout?: number;
  maxRestaurants?: number;
  twoFactorEnabled?: boolean;
  loginAlerts?: boolean;
}

const colorThemes = [
  { name: "Blue Theme", value: "blue", primary: "#2563eb", secondary: "#dbeafe" },
  { name: "Green Theme", value: "green", primary: "#16a34a", secondary: "#dcfce7" },
  { name: "Purple Theme", value: "purple", primary: "#9333ea", secondary: "#f3e8ff" },
  { name: "Red Theme", value: "red", primary: "#dc2626", secondary: "#fef2f2" },
  { name: "Orange Theme", value: "orange", primary: "#ea580c", secondary: "#fed7aa" },
  { name: "Teal Theme", value: "teal", primary: "#0d9488", secondary: "#ccfbf1" },
];

export default function AdminSettingsModal({ isOpen, onOpenChange }: AdminSettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const { theme: globalTheme, darkMode: globalDarkMode, setTheme: setGlobalTheme, setDarkMode: setGlobalDarkMode } = useTheme();
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    colorTheme: "blue",
    darkMode: false,
    compactMode: false,
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    emailNotifications: true,
    sessionTimeout: "30",
    maxRestaurants: "10",
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
  });

  // Fetch admin profile
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<Profile>({
    queryKey: ["/api/admin/settings/profile"],
    enabled: isOpen,
    retry: 1,
  });

  // Fetch admin settings
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery<SettingsData>({
    queryKey: ["/api/admin/settings/settings"],
    enabled: isOpen,
    retry: 1,
  });

  // Update profile data when profile is loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        username: profile.username || "",
        email: profile.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [profile]);

  // Update settings when loaded - preserve exact server values
  useEffect(() => {
    if (settings) {
      const newThemeSettings = {
        colorTheme: settings.theme || "blue",
        darkMode: settings.darkMode || false,
        compactMode: settings.compactMode || false,
      };
      
      const newSystemSettings = {
        autoBackup: settings.autoBackup !== false,
        emailNotifications: settings.emailNotifications !== false,
        sessionTimeout: String(settings.sessionTimeout || 30),
        maxRestaurants: String(settings.maxRestaurants || 10),
      };
      
      const newSecuritySettings = {
        twoFactorEnabled: settings.twoFactorEnabled || false,
        loginAlerts: settings.loginAlerts !== false,
      };

      setThemeSettings(newThemeSettings);
      setSystemSettings(newSystemSettings);
      setSecuritySettings(newSecuritySettings);
      
      // Apply theme globally with stronger selectors
      setGlobalTheme(newThemeSettings.colorTheme);
      setGlobalDarkMode(newThemeSettings.darkMode);
    }
  }, [settings, setGlobalTheme, setGlobalDarkMode]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/admin/settings/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  // Settings update mutation
  const settingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      return await apiRequest("/api/admin/settings/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = () => {
    // Validate passwords
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for API call
    const updateData: any = {
      username: profileData.username,
      email: profileData.email,
    };

    // Add password fields if password is being changed
    if (profileData.newPassword) {
      updateData.currentPassword = profileData.currentPassword;
      updateData.newPassword = profileData.newPassword;
    }

    profileMutation.mutate(updateData);
    
    // Clear password fields after submission
    setProfileData(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleThemeChange = (theme: string) => {
    setThemeSettings(prev => ({ ...prev, colorTheme: theme }));
    setGlobalTheme(theme);
    
    // Preserve all current settings when updating theme
    const settingsData: SettingsData = {
      theme: theme,
      darkMode: themeSettings.darkMode,
      compactMode: themeSettings.compactMode,
      emailNotifications: systemSettings.emailNotifications,
      sessionTimeout: parseInt(systemSettings.sessionTimeout) || 30,
      twoFactorEnabled: securitySettings.twoFactorEnabled,
      loginAlerts: securitySettings.loginAlerts,
      autoBackup: systemSettings.autoBackup,
      maxRestaurants: parseInt(systemSettings.maxRestaurants) || 10,
    };
    
    settingsMutation.mutate(settingsData);
  };

  const handleDarkModeChange = (darkMode: boolean) => {
    setThemeSettings(prev => ({ ...prev, darkMode }));
    setGlobalDarkMode(darkMode);
    
    // Preserve all current settings when updating dark mode
    const settingsData: SettingsData = {
      theme: themeSettings.colorTheme,
      darkMode: darkMode,
      compactMode: themeSettings.compactMode,
      emailNotifications: systemSettings.emailNotifications,
      sessionTimeout: parseInt(systemSettings.sessionTimeout) || 30,
      twoFactorEnabled: securitySettings.twoFactorEnabled,
      loginAlerts: securitySettings.loginAlerts,
      autoBackup: systemSettings.autoBackup,
      maxRestaurants: parseInt(systemSettings.maxRestaurants) || 10,
    };
    
    settingsMutation.mutate(settingsData);
  };

  const handleSystemUpdate = () => {
    // Preserve all current settings, ensuring no values are lost
    const settingsData: SettingsData = {
      theme: themeSettings.colorTheme,
      darkMode: themeSettings.darkMode,
      compactMode: themeSettings.compactMode,
      emailNotifications: systemSettings.emailNotifications,
      sessionTimeout: parseInt(systemSettings.sessionTimeout) || 30,
      twoFactorEnabled: securitySettings.twoFactorEnabled,
      loginAlerts: securitySettings.loginAlerts,
      autoBackup: systemSettings.autoBackup,
      maxRestaurants: parseInt(systemSettings.maxRestaurants) || 10,
    };

    console.log("Saving system settings:", settingsData); // Debug log
    settingsMutation.mutate(settingsData);
  };

  const handleSecurityUpdate = () => {
    // Preserve all current settings when updating security
    const settingsData: SettingsData = {
      theme: themeSettings.colorTheme,
      darkMode: themeSettings.darkMode,
      compactMode: themeSettings.compactMode,
      emailNotifications: systemSettings.emailNotifications,
      sessionTimeout: parseInt(systemSettings.sessionTimeout) || 30,
      twoFactorEnabled: securitySettings.twoFactorEnabled,
      loginAlerts: securitySettings.loginAlerts,
      autoBackup: systemSettings.autoBackup,
      maxRestaurants: parseInt(systemSettings.maxRestaurants) || 10,
    };
    
    settingsMutation.mutate(settingsData);
  };

  const handleExportDatabase = async () => {
    try {
      const response = await apiRequest('/api/admin/export-database', {
        method: 'GET',
      });
      
      // Convert response to blob for download
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);
      const blob = new Blob([responseText], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Database exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export database",
        variant: "destructive",
      });
    }
  };

  const handleViewSystemLogs = async () => {
    try {
      // Use direct fetch for plain text response
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/system-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const logsText = await response.text();
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>System Logs</title></head>
            <body style="font-family: monospace; white-space: pre-wrap; padding: 20px;">
              <h1>System Logs</h1>
              <hr/>
              <pre>${logsText}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
      
      toast({
        title: "Success",
        description: "System logs opened in new window",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch system logs",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Admin Settings</span>
          </DialogTitle>
          <DialogDescription>
            Manage your admin profile, customize themes, configure security settings, and adjust system preferences.
          </DialogDescription>
        </DialogHeader>
        
        {/* Display error message if there's an authentication issue */}
        {(profileError || settingsError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              Authentication error: Please log out and log back in to access settings.
            </p>
            <p className="text-red-500 text-xs mt-1">
              {profileError?.message || settingsError?.message}
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Theme</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your admin profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Change Password</h4>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleProfileUpdate} 
                  className="w-full"
                  disabled={profileMutation.isPending}
                >
                  {profileMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Color Theme</CardTitle>
                <CardDescription>Customize the appearance of your admin panel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colorThemes.map((theme) => (
                    <div
                      key={theme.value}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        themeSettings.colorTheme === theme.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleThemeChange(theme.value)}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div>
                          <p className="font-medium text-sm">{theme.name}</p>
                          <p className="text-xs text-gray-500">{theme.primary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="darkMode">Dark Mode</Label>
                      <p className="text-sm text-gray-500">Enable dark theme</p>
                    </div>
                    <Switch
                      id="darkMode"
                      checked={themeSettings.darkMode}
                      onCheckedChange={handleDarkModeChange}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compactMode">Compact Mode</Label>
                      <p className="text-sm text-gray-500">Reduce spacing for more content</p>
                    </div>
                    <Switch
                      id="compactMode"
                      checked={themeSettings.compactMode}
                      onCheckedChange={(checked) => setThemeSettings(prev => ({ ...prev, compactMode: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security preferences and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Login Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                    </div>
                    <Switch 
                      checked={securitySettings.loginAlerts}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginAlerts: checked }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Select value={systemSettings.sessionTimeout} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, sessionTimeout: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="0">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSecurityUpdate} 
                  className="w-full"
                  disabled={settingsMutation.isPending}
                >
                  {settingsMutation.isPending ? "Saving..." : "Save Security Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Backup</Label>
                      <p className="text-sm text-gray-500">Automatically backup data daily</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoBackup}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoBackup: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive system alerts via email</p>
                    </div>
                    <Switch
                      checked={systemSettings.emailNotifications}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxRestaurants">Maximum Restaurants</Label>
                    <Select value={systemSettings.maxRestaurants} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, maxRestaurants: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 restaurants</SelectItem>
                        <SelectItem value="10">10 restaurants</SelectItem>
                        <SelectItem value="25">25 restaurants</SelectItem>
                        <SelectItem value="50">50 restaurants</SelectItem>
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={handleExportDatabase}>
                      <Database className="w-4 h-4 mr-2" />
                      Export Database
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleViewSystemLogs}>
                      <Bell className="w-4 h-4 mr-2" />
                      View System Logs
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSystemUpdate} 
                  className="w-full"
                  disabled={settingsMutation.isPending}
                >
                  {settingsMutation.isPending ? "Saving..." : "Save System Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}