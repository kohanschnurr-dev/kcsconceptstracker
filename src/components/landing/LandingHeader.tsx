import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import groundworksLogo from "@/assets/groundworks-helmet-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Demo", href: "/demo" },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on outside tap
  useEffect(() => {
    if (!mobileOpen) return;
    const close = () => setMobileOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [mobileOpen]);

  const handleTrialClick = () => {
    navigate("/auth");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <img src={groundworksLogo} alt="GroundWorks" className="h-8 w-8 object-contain" />
          GroundWorks
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Log In
            </Button>
          </Link>
          <Button
            size="sm"
            className="gold-glow hover:scale-[1.03] transition-transform"
            onClick={handleTrialClick}
          >
            Start Free Trial
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 min-h-[48px] min-w-[48px] flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setMobileOpen(!mobileOpen);
          }}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 w-72 bg-background border-l border-border z-50 transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2 p-6 pt-20">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-lg py-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border mt-4 pt-4 flex flex-col gap-3">
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full min-h-[48px]">
                Log In
              </Button>
            </Link>
            <Button
              className="w-full min-h-[48px] gold-glow"
              onClick={() => {
                setMobileOpen(false);
                navigate("/auth");
              }}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" />
      )}
    </header>
  );
}
