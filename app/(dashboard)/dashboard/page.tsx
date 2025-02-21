"use client"
import { StatsCard } from "@/components/ui/StatsCards";
import { CustomBarChart } from "@/components/ui/BarChart";
// import { CustomLineChart } from "@/components/ui/LineChart";
// import { CustomPieChart } from "@/components/ui/PieChart";
import { Users, Bike, Wrench, DollarSign } from "lucide-react";

export default function DashboardOverview() {
    const stats = [
        { title: "Clientes", value: 120, icon: <Users className="w-6 h-6" /> },
        { title: "Bicicletas Registradas", value: 85, icon: <Bike className="w-6 h-6" /> },
        { title: "Servicios Completados", value: 230, icon: <Wrench className="w-6 h-6" /> },
        { title: "Ingresos", value: "$12,500", icon: <DollarSign className="w-6 h-6" /> },
    ];

    const chartData = [
        { name: "Enero", value: 30 },
        { name: "Febrero", value: 50 },
        { name: "Marzo", value: 80 },
        { name: "Abril", value: 40 },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p>Bienvenido al panel de gestión del taller de bicicletas.</p>
            <div className="grid gap-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>
                <CustomBarChart data={chartData} />
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <CustomLineChart data={chartData} />
                </div>
                <div className="flex justify-center">
                    <CustomPieChart data={chartData} />
                </div> */}
            </div>
        </div>
    );
}
