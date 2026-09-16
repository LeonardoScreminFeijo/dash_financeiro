"use client";

import { formatCurrency, formatDate } from "@/lib/formatters";
import type { DailyExpense, ValueByLabel } from "@/lib/finance";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";

const COLORS = ["#176b4e", "#2f8a67", "#e6a243", "#cc5b43", "#6f5ca7", "#507a9f"];
const tooltip = { formatter: (value: ValueType) => formatCurrency(Number(Array.isArray(value) ? value[0] : value)), contentStyle: { borderRadius: 12, borderColor: "#e7e5e4" } };

export function DailyExpenseChart({ data }: { data: DailyExpense[] }) { return <ChartCard title="Evolução diária dos gastos" className="lg:col-span-2"><ResponsiveContainer width="100%" height={260}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={(value) => formatDate(String(value)).slice(0, 5)} /><YAxis tickFormatter={(value) => `R$ ${value}`} width={60} /><Tooltip {...tooltip} labelFormatter={(value) => formatDate(String(value))} /><Line type="monotone" dataKey="value" name="Gastos" stroke="#176b4e" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></ChartCard>; }

export function BreakdownChart({ title, data }: { title: string; data: ValueByLabel[] }) { return <ChartCard title={title}><ResponsiveContainer width="100%" height={260}><BarChart data={data.slice(0, 6)} layout="vertical" margin={{ left: 14 }}><XAxis type="number" hide /><YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 12 }} /><Tooltip {...tooltip} /><Bar dataKey="value" radius={[0, 6, 6, 0]}>{data.slice(0, 6).map((entry, index) => <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></ChartCard>; }

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) { return <section className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}><h2 className="mb-4 text-base font-semibold">{title}</h2>{children}</section>; }
