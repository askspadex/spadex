"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Tag,
  Package,
  ShoppingCart,
  Star,
  Users,
  TrendingUp,
  ArrowRight,
  Box,
} from "lucide-react";

interface DashboardData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get("/api/v1/admin/dashboard");
        if (response?.data?.data) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = [
    {
      title: "Total Users",
      value: data?.totalUsers ?? 0,
      icon: Users,
      description: "Registered accounts",
      prefix: "",
    },
    {
      title: "Total Orders",
      value: data?.totalOrders ?? 0,
      icon: ShoppingCart,
      description: "All time orders",
      prefix: "",
    },
    {
      title: "Total Revenue",
      value: data?.totalRevenue ?? 0,
      icon: TrendingUp,
      description: "Gross earnings",
      prefix: "₹",
    },
    {
      title: "Total Products",
      value: data?.totalProducts ?? 0,
      icon: Box,
      description: "Active listings",
      prefix: "",
    },
  ];

  const navSections = [
    {
      label: "Catalogue",
      items: [
        {
          title: "Categories",
          description: "Manage all product categories",
          icon: Tag,
          href: "/adminPanel/dashboard/categories",
          badge: "CRUD",
        },
        {
          title: "Products",
          description: "Manage all products",
          icon: Package,
          href: "/adminPanel/dashboard/products",
          badge: "CRUD",
        },
      ],
    },
    {
      label: "Orders & Reviews",
      items: [
        {
          title: "All Orders",
          description: "View and manage customer orders",
          icon: ShoppingCart,
          href: "/adminPanel/dashboard/orders",
          badge: "CRUD",
        },
        {
          title: "Reviews (Not Working)",
          description: "Moderate customer reviews",
          icon: Star,
          href: "/adminPanel/dashboard/",
          badge: null,
        }
      ],
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header Bar */}
      <div className="border-b bg-card px-8 py-4 flex items-center gap-3">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg tracking-tight">Admin Panel</span>
        <Badge variant="secondary" className="ml-auto">
          v1.0
        </Badge>
      </div>

      <div className="px-8 py-8 max-w-7xl mx-auto space-y-10">

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Overview of your store&apos;s performance and quick navigation.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ title, value, icon: Icon, description, prefix }) => (
            <Card key={title} className="border shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-3xl font-bold">
                    {prefix}{value.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Navigation Sections */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Quick Navigation</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Jump directly to any section of the admin panel.
            </p>
          </div>

          {navSections.map((section) => (
            <div key={section.label} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </span>
                <Separator className="flex-1" />
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map(({ title, description, icon: Icon, href, badge }) => (
                  <Card
                    key={href}
                    className="border shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer group"
                    onClick={() => router.push(href)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        {badge && (
                          <Badge variant="outline" className="text-xs">
                            {badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{title}</CardTitle>
                      <CardDescription className="text-xs">
                        {description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full justify-between group-hover:bg-primary/5 group-hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(href);
                        }}
                      >
                        Go to {title}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}