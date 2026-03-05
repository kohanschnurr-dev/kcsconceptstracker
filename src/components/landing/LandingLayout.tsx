import { LeadCaptureProvider } from "@/contexts/LeadCaptureContext";
import LeadCaptureModal from "./LeadCaptureModal";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LeadCaptureProvider>
      {children}
      <LeadCaptureModal />
    </LeadCaptureProvider>
  );
}
