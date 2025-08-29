import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Zap, ArrowRight, Sparkles } from 'lucide-react';

const Index = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-glow">
          <MessageCircle className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  if (user && profile) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background grid */}
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(theme(colors.primary/15)_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Gradient orbs */}
      <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl animate-pulse" />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-24 pb-16 text-center">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto mb-8 w-fit rounded-2xl bg-primary/10 px-4 py-2 backdrop-blur-sm border border-primary/20 animate-slide-up">
              <span className="inline-flex items-center gap-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                AI-powered professional chat platform
              </span>
            </div>

            <h1 className="animate-slide-up text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-accent bg-clip-text text-transparent">
                GuruChat
              </span>
            </h1>

            <p className="animate-slide-up text-lg md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Connect with top professionals instantly. Pay per minute in INR and get actionable answers now.
            </p>

            <div className="animate-slide-up inline-flex items-center gap-3">
              <Button size="lg" asChild className="shadow-[0_0_20px_theme(colors.primary/40)]">
                <a href="/auth" className="gap-2">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Explore features
              </a>
            </div>

            {/* Glassmorphism preview card */}
            <div className="mt-16 animate-slide-up">
              <Card className="mx-auto max-w-5xl bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 border-primary/20">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      <div className="p-8 text-left">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">Clients</h3>
                        <p className="text-sm text-muted-foreground">Browse verified experts and start a secure chat in seconds.</p>
                      </div>
                      <div className="p-8 text-left border-y md:border-y-0 md:border-x border-border/60">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          <Zap className="h-5 w-5 text-accent" />
                        </div>
                        <h3 className="font-semibold mb-1">Professionals</h3>
                        <p className="text-sm text-muted-foreground">Set your rate, manage availability, and build reputation.</p>
                      </div>
                      <div className="p-8 text-left">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                          <MessageCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="font-semibold mb-1">Real-time chat</h3>
                        <p className="text-sm text-muted-foreground">Smooth, reliable messaging with live session status.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="group bg-card/60 backdrop-blur border-border/60 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:scale-105 transition-transform">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">For Clients</CardTitle>
                <CardDescription className="text-base">
                  Instant access to top-tier expertise with transparent per-minute pricing.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground">
                <div className="animate-slide-up">Browse verified professionals</div>
                <div className="animate-slide-up [animation-delay:80ms]">Pay securely in Indian Rupees</div>
                <div className="animate-slide-up [animation-delay:160ms]">Message history and receipts</div>
                <div className="animate-slide-up [animation-delay:240ms]">Real-time session updates</div>
              </CardContent>
            </Card>

            <Card className="group bg-card/60 backdrop-blur border-border/60 hover:border-accent/40 transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="p-3 bg-accent/10 rounded-xl w-fit mb-4 group-hover:scale-105 transition-transform">
                  <Zap className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">For Professionals</CardTitle>
                <CardDescription className="text-base">
                  Monetize your expertise, manage availability, and grow your brand.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground">
                <div className="animate-slide-up">Flexible hourly rates</div>
                <div className="animate-slide-up [animation-delay:80ms]">Optimized matching and requests</div>
                <div className="animate-slide-up [animation-delay:160ms]">Ratings and reputation</div>
                <div className="animate-slide-up [animation-delay:240ms]">Transparent payouts</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 pb-24 text-center">
          <Card className="max-w-3xl mx-auto bg-card/60 backdrop-blur border-primary/20">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get expert help?</h2>
              <p className="text-muted-foreground mb-6">Join thousands of clients and professionals on GuruChat.</p>
              <Button size="lg" asChild className="gap-2">
                <a href="/auth">
                  Join GuruChat Today
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Index;
