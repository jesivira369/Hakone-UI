"use client"
import { StatsCard } from "@/components/ui/StatsCards";
import { CustomBarChart } from "@/components/ui/BarChart";
import { CustomLineChart } from "@/components/ui/LineChart";
import { Users, Bike, Wrench, DollarSign } from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/Skeleton/DashboardSkeleton";
import { useState, useEffect } from "react";

export default function DashboardOverview() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 2000);
    }, []);

    const stats = [
        { title: "Clientes", value: 120, icon: <Users size={50} />, link: "/clients" },
        { title: "Bicicletas Registradas", value: 85, icon: <Bike size={50} />, link: "/bicycles" },
        { title: "Servicios Completados", value: 230, icon: <Wrench size={50} />, link: "/services" },
        { title: "Ingresos", value: "$12,500", icon: <DollarSign size={50} />, link: "/dashboard" },
    ];

    const chartData = [
        { name: "Enero", value: 30 },
        { name: "Febrero", value: 50 },
        { name: "Marzo", value: 80 },
        { name: "Abril", value: 40 },
    ];

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="grid gap-8 p-6">
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-center">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomBarChart data={chartData} />
                <CustomLineChart data={chartData} />
            </div>
        </div>
    );
}
