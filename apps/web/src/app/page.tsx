'use client'

import Link from 'next/link'
import { ArrowRight, Zap, Database, Lock, BarChart3, GitBranch, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background">
          {/* Animated gradient orbs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[hsl(var(--stream-pink))]/10 rounded-full blur-3xl animate-pulse-slow animation-delay-4000" />
        </div>

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-xl bg-background/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center stream-glow">
                <Zap className="w-6 h-6 text-background" />
              </div>
              <span className="text-2xl font-bold">Stream<span className="text-gradient">Forge</span></span>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-card">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity stream-glow">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <div className="text-center space-y-8 animate-slide-in">
          <div className="inline-block">
            <div className="px-4 py-2 rounded-full border border-primary/50 bg-primary/10 text-sm text-primary font-medium mb-6">
              Real-Time Event Streaming Platform
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
            Build <span className="text-gradient animate-gradient bg-gradient-to-r from-[hsl(var(--stream-cyan))] via-[hsl(var(--stream-purple))] to-[hsl(var(--stream-pink))]">Powerful</span>
            <br />
            Data Streams
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Enterprise-grade event streaming platform. Process millions of events per second with real-time analytics, guaranteed delivery, and infinite scalability.
          </p>

          <div className="flex items-center justify-center gap-4 pt-8">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg px-8 py-6 stream-glow">
                Start Building Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-border hover:bg-card text-lg px-8 py-6">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient">99.99%</div>
              <div className="text-sm text-muted-foreground mt-2">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient">10M+</div>
              <div className="text-sm text-muted-foreground mt-2">Events/Second</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient">&lt;10ms</div>
              <div className="text-sm text-muted-foreground mt-2">Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-4">
            Everything You Need for <span className="text-gradient">Event Streaming</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for developers, trusted by enterprises. StreamForge delivers the tools you need to build real-time data pipelines.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>

                <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient transition-all">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-32">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/20 to-[hsl(var(--stream-pink))]/20 p-16 text-center overflow-hidden border border-primary/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-5xl font-bold">
              Ready to Build the Future?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of developers building real-time applications with StreamForge. Start streaming in minutes.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg px-12 py-6 stream-glow">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 backdrop-blur-xl bg-background/50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-background" />
              </div>
              <span className="text-xl font-bold">StreamForge</span>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; 2026 StreamForge. Built for the future of data streaming.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: <Zap className="w-7 h-7 text-primary" />,
    title: 'Lightning Fast',
    description: 'Process millions of events per second with sub-10ms latency. Built for real-time performance.'
  },
  {
    icon: <Database className="w-7 h-7 text-primary" />,
    title: 'Persistent Storage',
    description: 'Never lose data with durable message storage and replay capabilities. Query historical events anytime.'
  },
  {
    icon: <Lock className="w-7 h-7 text-primary" />,
    title: 'Enterprise Security',
    description: 'End-to-end encryption, fine-grained access control, and compliance-ready architecture.'
  },
  {
    icon: <BarChart3 className="w-7 h-7 text-primary" />,
    title: 'Real-Time Analytics',
    description: 'Built-in monitoring and analytics. Track throughput, latency, and consumer lag in real-time.'
  },
  {
    icon: <GitBranch className="w-7 h-7 text-primary" />,
    title: 'Multi-Protocol',
    description: 'Support for Kafka, WebSocket, and HTTP protocols. Connect from any platform or language.'
  },
  {
    icon: <Shield className="w-7 h-7 text-primary" />,
    title: 'Guaranteed Delivery',
    description: 'At-least-once and exactly-once semantics. Your events are delivered reliably, every time.'
  }
]
