import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  settings: Record<string, string>;
  isLoading: boolean;
  onSave: (key: string, value: string) => void;
}

export default function AdminSettings({ settings, isLoading, onSave }: Props) {
  const [trialLength, setTrialLength] = useState("14");
  const [autoTrial, setAutoTrial] = useState(true);
  const [notifySignup, setNotifySignup] = useState(true);
  const [notifyDemo, setNotifyDemo] = useState(true);
  const [notifyTrialDays, setNotifyTrialDays] = useState("3");

  useEffect(() => {
    setTrialLength(settings.trial_length_days ?? "14");
    setAutoTrial(settings.auto_trial === "true");
    setNotifySignup(settings.notify_new_signup === "true");
    setNotifyDemo(settings.notify_demo_request === "true");
    setNotifyTrialDays(settings.notify_trial_expiring_days ?? "3");
  }, [settings]);

  const handleSaveAll = () => {
    onSave("trial_length_days", trialLength);
    onSave("auto_trial", String(autoTrial));
    onSave("notify_new_signup", String(notifySignup));
    onSave("notify_demo_request", String(notifyDemo));
    onSave("notify_trial_expiring_days", notifyTrialDays);
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Settings</h1>

      {/* Trial Settings */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-heading font-semibold">Trial Configuration</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default Trial Length</p>
              <p className="text-xs text-muted-foreground">Number of days for new user trials</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={trialLength}
                onChange={(e) => setTrialLength(e.target.value)}
                className="w-20 text-center"
                min="1"
                max="90"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-Trial on Signup</p>
              <p className="text-xs text-muted-foreground">
                New signups automatically start a free trial
              </p>
            </div>
            <button
              onClick={() => setAutoTrial(!autoTrial)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoTrial ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  autoTrial ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-heading font-semibold">Notification Preferences</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New Signup</p>
              <p className="text-xs text-muted-foreground">Email me when a new user signs up</p>
            </div>
            <button
              onClick={() => setNotifySignup(!notifySignup)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notifySignup ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  notifySignup ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Demo Request</p>
              <p className="text-xs text-muted-foreground">Email me when a demo is requested</p>
            </div>
            <button
              onClick={() => setNotifyDemo(!notifyDemo)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notifyDemo ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  notifyDemo ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Trial Expiring</p>
              <p className="text-xs text-muted-foreground">
                Email me when a trial is expiring within X days
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={notifyTrialDays}
                onChange={(e) => setNotifyTrialDays(e.target.value)}
                className="w-16 text-center"
                min="1"
                max="30"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleSaveAll} className="gold-glow">
        <Save className="w-4 h-4 mr-2" />
        Save All Settings
      </Button>
    </div>
  );
}
