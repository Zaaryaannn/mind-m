const Navbar = () => {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-14 items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-primary shadow-elegant" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">AI Playground</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="#settings" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Settings</a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
