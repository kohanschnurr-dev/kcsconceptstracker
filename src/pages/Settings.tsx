import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { User, Key, FileText, Shield, Loader2, Building2, Upload, X, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const US_STATES = [
  { label: "Alabama", value: "AL" }, { label: "Alaska", value: "AK" }, { label: "Arizona", value: "AZ" },
  { label: "Arkansas", value: "AR" }, { label: "California", value: "CA" }, { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" }, { label: "Delaware", value: "DE" }, { label: "District of Columbia", value: "DC" },
  { label: "Florida", value: "FL" }, { label: "Georgia", value: "GA" }, { label: "Hawaii", value: "HI" },
  { label: "Idaho", value: "ID" }, { label: "Illinois", value: "IL" }, { label: "Indiana", value: "IN" },
  { label: "Iowa", value: "IA" }, { label: "Kansas", value: "KS" }, { label: "Kentucky", value: "KY" },
  { label: "Louisiana", value: "LA" }, { label: "Maine", value: "ME" }, { label: "Maryland", value: "MD" },
  { label: "Massachusetts", value: "MA" }, { label: "Michigan", value: "MI" }, { label: "Minnesota", value: "MN" },
  { label: "Mississippi", value: "MS" }, { label: "Missouri", value: "MO" }, { label: "Montana", value: "MT" },
  { label: "Nebraska", value: "NE" }, { label: "Nevada", value: "NV" }, { label: "New Hampshire", value: "NH" },
  { label: "New Jersey", value: "NJ" }, { label: "New Mexico", value: "NM" }, { label: "New York", value: "NY" },
  { label: "North Carolina", value: "NC" }, { label: "North Dakota", value: "ND" }, { label: "Ohio", value: "OH" },
  { label: "Oklahoma", value: "OK" }, { label: "Oregon", value: "OR" }, { label: "Pennsylvania", value: "PA" },
  { label: "Rhode Island", value: "RI" }, { label: "South Carolina", value: "SC" }, { label: "South Dakota", value: "SD" },
  { label: "Tennessee", value: "TN" }, { label: "Texas", value: "TX" }, { label: "Utah", value: "UT" },
  { label: "Vermont", value: "VT" }, { label: "Virginia", value: "VA" }, { label: "Washington", value: "WA" },
  { label: "West Virginia", value: "WV" }, { label: "Wisconsin", value: "WI" }, { label: "Wyoming", value: "WY" },
];
import { toast } from 'sonner';
import kcsLogo from '@/assets/kcs-logo.png';
import ManageSourcesCard from '@/components/settings/ManageSourcesCard';
import ManageUsersCard from '@/components/settings/ManageUsersCard';
import ManageRolesCard from '@/components/settings/ManageRolesCard';
import ColorPaletteCard from '@/components/settings/ColorPaletteCard';
import DashboardPreferencesCard from '@/components/settings/DashboardPreferencesCard';

export default function Settings() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const { settings, isLoading: isLoadingCompany, updateSettings, uploadLogo, logoUrl } = useCompanySettings();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setCity((profile as any).city || '');
      setState((profile as any).state || '');
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || '');
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ firstName, lastName });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleSaveCompany = async () => {
    try {
      await updateSettings.mutateAsync({ companyName });
      toast.success('Company settings updated');
    } catch (error) {
      toast.error('Failed to update company settings');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const url = await uploadLogo(file);
      await updateSettings.mutateAsync({ logoUrl: url });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateSettings.mutateAsync({ logoUrl: '' });
      toast.success('Logo removed');
    } catch (error) {
      toast.error('Failed to remove logo');
    }
  };

  // Legacy variable for inline buttons (will be removed)
  const hasProfileChanges = profile && (
    firstName !== (profile.first_name || '') ||
    lastName !== (profile.last_name || '')
  );

  // Check if company name has changed from initial value
  const initialCompanyName = settings?.company_name || '';
  const hasCompanyChanges = companyName !== initialCompanyName;

  // Check if profile has changed from initial values
  const initialFirstName = profile?.first_name || '';
  const initialLastName = profile?.last_name || '';
  const initialCity = (profile as any)?.city || '';
  const initialState = (profile as any)?.state || '';
  const hasProfileChangesCalc = firstName !== initialFirstName || lastName !== initialLastName || city !== initialCity || state !== initialState;

  const hasAnyChanges = hasProfileChangesCalc || hasCompanyChanges;

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = [];
      if (hasCompanyChanges) {
        promises.push(updateSettings.mutateAsync({ companyName }));
      }
      if (hasProfileChangesCalc) {
        promises.push(updateProfile.mutateAsync({ firstName, lastName, city, state }));
      }
      await Promise.all(promises);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid gap-6">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal",
                              !state && "text-muted-foreground"
                            )}
                          >
                            {state
                              ? US_STATES.find((s) => s.value === state)?.label ?? state
                              : "Select state..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search state..." />
                            <CommandList>
                              <CommandEmpty>No state found.</CommandEmpty>
                              <CommandGroup>
                                {US_STATES.map((s) => (
                                  <CommandItem
                                    key={s.value}
                                    value={`${s.label} ${s.value}`}
                                    onSelect={() => {
                                      setState(s.value);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        state === s.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {s.label} ({s.value})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Business City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Dallas"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Used for weather forecasts on the Calendar</p>
                  <p className="text-xs text-muted-foreground">Disclaimer: Weather data is sourced from third-party providers and is for informational purposes only. Please verify conditions independently before making project-critical decisions.</p>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{user?.email}</p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Change your password</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Company Branding Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Branding
              </CardTitle>
              <CardDescription>Customize your company name and logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingCompany ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Company logo" className="h-full w-full object-contain" />
                        ) : (
                          <img src={kcsLogo} alt="Default logo" className="h-12 w-12 object-contain opacity-50" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                        >
                          {isUploadingLogo ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload Logo
                        </Button>
                        {logoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended: Square image, max 2MB
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Manage Sources Section */}
          <ManageSourcesCard />

          {/* Manage Roles Section */}
          <ManageRolesCard />

          {/* Manage Users Section */}
          <ManageUsersCard />

          {/* Color Palette Section */}
          <ColorPaletteCard />

          {/* Dashboard Preferences */}
          <DashboardPreferencesCard />

          {/* Legal Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Legal
              </CardTitle>
              <CardDescription>Privacy and terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link 
                to="/privacy" 
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                Privacy Policy
              </Link>
              <Link 
                to="/eula" 
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                End User License Agreement
              </Link>
            </CardContent>
          </Card>
        </div>

      {/* Sticky Save Bar */}
      {hasAnyChanges && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-background border-t border-border p-4 flex justify-end z-50 shadow-lg">
          <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </div>
      )}
      </div>
    </MainLayout>
  );
}
