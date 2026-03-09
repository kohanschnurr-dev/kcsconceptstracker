import { Link } from "react-router-dom";
import { Twitter, Linkedin, Facebook } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
        <p className="text-sm text-muted-foreground">
        &copy; 2025 GroundWorks. All rights reserved.{" "}
          <Link to="/admin" className="text-muted-foreground/30 text-[10px] hover:text-primary transition-colors">·</Link>
        </p>

        <div className="flex items-center gap-6">
          <Link
            to="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="#"
            aria-label="Twitter"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="#"
            aria-label="LinkedIn"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Linkedin className="w-5 h-5" />
          </a>
          <a
            href="#"
            aria-label="Facebook"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
