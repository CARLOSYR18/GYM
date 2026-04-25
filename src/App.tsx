import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "./supabaseClient";

interface Member {
  id: number;
  name: string;
  dni: string;
  phone: string;
  plan: string;
  status: "Activo" | "Vencido" | "Pendiente";
  start_date: string;
  end_date: string;
  paid: number;
}

interface Payment {
  id: number;
  member: string;
  plan: string;
  amount: number;
  date: string;
  method: string;
}

interface GymClass {
  id: number;
  name: string;
  trainer: string;
  time: string;
  capacity: number;
  enrolled: number;
}

const classes: GymClass[] = [
  { id: 1, name: "Funcional", trainer: "Diego Salas", time: "07:00 AM", capacity: 20, enrolled: 14 },
  { id: 2, name: "Spinning", trainer: "Rosa Vega", time: "09:00 AM", capacity: 15, enrolled: 12 },
  { id: 3, name: "Box Training", trainer: "Marco Ruiz", time: "06:00 PM", capacity: 18, enrolled: 17 },
  { id: 4, name: "Musculación", trainer: "Kevin Díaz", time: "08:00 PM", capacity: 25, enrolled: 19 },
];

const plans = [
  { name: "Semanal", price: 35, description: "Acceso libre por 7 días" },
  { name: "Mensual", price: 120, description: "Acceso completo por 30 días" },
  { name: "Trimestral", price: 300, description: "Ahorro especial por 3 meses" },
  { name: "VIP", price: 180, description: "Rutina personalizada + asesoría" },
];

const statusStyles = {
  Activo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Vencido: "bg-red-100 text-red-700 border-red-200",
  Pendiente: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    dni: "",
    phone: "",
    plan: "Mensual",
    status: "Activo" as Member["status"],
    paid: "120",
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error al cargar socios:", error.message);
      alert("Error al cargar datos de Supabase");
      setLoading(false);
      return;
    }

    setMembers((data || []) as Member[]);

    const generatedPayments: Payment[] = (data || [])
      .filter((member) => Number(member.paid) > 0)
      .map((member) => ({
        id: member.id,
        member: member.name,
        plan: member.plan,
        amount: Number(member.paid),
        date: member.start_date,
        method: "Registrado",
      }));

    setPayments(generatedPayments);
    setLoading(false);
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) =>
      `${member.name} ${member.dni} ${member.phone} ${member.plan}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [members, search]);

  const totalIncome = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const activeMembers = members.filter((member) => member.status === "Activo").length;
  const expiredMembers = members.filter((member) => member.status === "Vencido").length;
  const pendingMembers = members.filter((member) => member.status === "Pendiente").length;

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username === "admin" && password === "123456") {
      setIsLoggedIn(true);
      setLoginError("");
      return;
    }

    setLoginError("Usuario o contraseña incorrectos. Usa admin / 123456");
  };

  const addMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.dni.trim() || !form.phone.trim()) {
      alert("Completa nombre, DNI y teléfono");
      return;
    }

    const today = new Date();
    const endDate = new Date(today);
    const days = form.plan === "Semanal" ? 7 : form.plan === "Trimestral" ? 90 : 30;
    endDate.setDate(today.getDate() + days);

    const newMember = {
      name: form.name,
      dni: form.dni,
      phone: form.phone,
      plan: form.plan,
      status: form.status,
      start_date: today.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      paid: Number(form.paid),
    };

    const { error } = await supabase.from("members").insert([newMember]);

    if (error) {
      console.error("Error al guardar:", error.message);
      alert("Error al guardar en Supabase");
      return;
    }

    alert("Socio guardado en Supabase");
    setForm({ name: "", dni: "", phone: "", plan: "Mensual", status: "Activo", paid: "120" });
    loadMembers();
  };

  const removeMember = async (id: number) => {
    const confirmDelete = confirm("¿Seguro que quieres eliminar este socio?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      console.error("Error al eliminar:", error.message);
      alert("Error al eliminar");
      return;
    }

    loadMembers();
  };

  const markAttendance = async (id: number) => {
    const { error } = await supabase.from("members").update({ status: "Activo" }).eq("id", id);

    if (error) {
      console.error("Error al actualizar:", error.message);
      alert("Error al actualizar asistencia");
      return;
    }

    loadMembers();
  };

  const menu = [
    { name: "Dashboard", icon: BarChart3 },
    { name: "Socios", icon: Users },
    { name: "Planes", icon: CreditCard },
    { name: "Pagos", icon: Wallet },
    { name: "Clases", icon: CalendarDays },
  ];

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl grid lg:grid-cols-2 bg-neutral-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
        >
          <div className="relative p-10 bg-gradient-to-br from-lime-400 via-emerald-500 to-cyan-500 text-neutral-950">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,_white,_transparent_35%)]" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-neutral-950 text-lime-300 flex items-center justify-center shadow-xl mb-8">
                <Dumbbell size={34} />
              </div>
              <h1 className="text-4xl font-black leading-tight mb-4">GYM POWER SYSTEM</h1>
              <p className="text-lg font-medium max-w-md">
                Sistema profesional para administrar socios, pagos, membresías, asistencia, clases y reportes del gimnasio.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-4">
                <Feature title="Admin seguro" />
                <Feature title="Control rápido" />
                <Feature title="Pagos" />
                <Feature title="Socios" />
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-8 sm:p-10 flex flex-col justify-center">
            <p className="text-lime-300 font-semibold mb-2">Acceso administrativo</p>
            <h2 className="text-3xl font-bold mb-6">Iniciar sesión</h2>

            <label className="text-sm text-neutral-300 mb-2">Usuario</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mb-4 rounded-2xl bg-neutral-800 border border-white/10 px-4 py-3 outline-none focus:border-lime-400"
              placeholder="admin"
            />

            <label className="text-sm text-neutral-300 mb-2">Contraseña</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mb-4 rounded-2xl bg-neutral-800 border border-white/10 px-4 py-3 outline-none focus:border-lime-400"
              placeholder="123456"
            />

            {loginError && <p className="mb-4 text-sm text-red-300">{loginError}</p>}

            <button className="rounded-2xl bg-lime-400 text-neutral-950 font-bold py-3 hover:bg-lime-300 transition shadow-lg shadow-lime-400/20">
              Entrar al sistema
            </button>

            <p className="text-sm text-neutral-400 mt-5">
              Usuario de prueba: <b>admin</b> / Contraseña: <b>123456</b>
            </p>
          </form>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900 flex">
      <aside
        className={`fixed lg:static z-30 min-h-screen w-72 bg-neutral-950 text-white p-5 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-lime-400 text-neutral-950 flex items-center justify-center">
              <Dumbbell />
            </div>
            <div>
              <h1 className="font-black leading-none">POWER GYM</h1>
              <p className="text-xs text-neutral-400">Panel administrador</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X />
          </button>
        </div>

        <nav className="space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                  activeTab === item.name ? "bg-lime-400 text-neutral-950 font-bold" : "hover:bg-white/10 text-neutral-300"
                }`}
              >
                <Icon size={20} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => setIsLoggedIn(false)}
          className="absolute bottom-5 left-5 right-5 flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 hover:bg-white/15"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </aside>

      <section className="flex-1 p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-neutral-500">Sistema conectado a Supabase</p>
            <h2 className="text-3xl font-black">{activeTab}</h2>
          </div>
          <button
            className="lg:hidden rounded-2xl bg-neutral-950 text-white p-3"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu />
          </button>
        </header>

        {activeTab === "Dashboard" && (
          <section>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              <Stat title="Socios activos" value={activeMembers} icon={Users} />
              <Stat title="Membresías vencidas" value={expiredMembers} icon={Activity} />
              <Stat title="Pagos pendientes" value={pendingMembers} icon={CreditCard} />
              <Stat title="Ingresos" value={`S/ ${totalIncome}`} icon={Wallet} />
            </div>

            <div className="grid xl:grid-cols-3 gap-5">
              <Card className="xl:col-span-2">
                <h3 className="text-xl font-black mb-4">Últimos socios registrados</h3>
                {loading ? (
                  <p>Cargando datos...</p>
                ) : members.length === 0 ? (
                  <p className="text-neutral-500">Todavía no hay socios registrados.</p>
                ) : (
                  <div className="space-y-3">
                    {members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4 border">
                        <div>
                          <h4 className="font-bold">{member.name}</h4>
                          <p className="text-sm text-neutral-500">{member.plan} · vence {member.end_date}</p>
                        </div>
                        <StatusBadge status={member.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="text-xl font-black mb-4">Resumen del día</h3>
                <div className="space-y-4">
                  <Progress label="Ocupación del gym" value={72} />
                  <Progress label="Pagos completados" value={84} />
                  <Progress label="Asistencia" value={63} />
                </div>
              </Card>
            </div>
          </section>
        )}

        {activeTab === "Socios" && (
          <section className="grid xl:grid-cols-3 gap-5">
            <Card className="xl:col-span-1">
              <div className="flex items-center gap-2 mb-5">
                <UserPlus className="text-lime-600" />
                <h3 className="text-xl font-black">Registrar socio</h3>
              </div>
              <form onSubmit={addMember} className="space-y-3">
                <Input placeholder="Nombre completo" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <Input placeholder="DNI" value={form.dni} onChange={(value) => setForm({ ...form, dni: value })} />
                <Input placeholder="Teléfono" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
                <select
                  value={form.plan}
                  onChange={(event) => {
                    const selected = plans.find((plan) => plan.name === event.target.value);
                    setForm({ ...form, plan: event.target.value, paid: String(selected?.price || 0) });
                  }}
                  className="w-full rounded-2xl border px-4 py-3 outline-none focus:border-lime-500"
                >
                  {plans.map((plan) => <option key={plan.name}>{plan.name}</option>)}
                </select>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as Member["status"] })}
                  className="w-full rounded-2xl border px-4 py-3 outline-none focus:border-lime-500"
                >
                  <option>Activo</option>
                  <option>Pendiente</option>
                  <option>Vencido</option>
                </select>
                <Input placeholder="Pago S/" value={form.paid} onChange={(value) => setForm({ ...form, paid: value })} />
                <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 text-white py-3 font-bold hover:bg-neutral-800">
                  <Plus size={18} /> Guardar en Supabase
                </button>
              </form>
            </Card>

            <Card className="xl:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h3 className="text-xl font-black">Lista de socios</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-neutral-400" size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar socio..."
                    className="w-full sm:w-72 rounded-2xl border pl-10 pr-4 py-3 outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b">
                      <th className="py-3">Socio</th>
                      <th>Plan</th>
                      <th>Estado</th>
                      <th>Vence</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="py-4">
                          <b>{member.name}</b>
                          <p className="text-neutral-500">DNI {member.dni} · {member.phone}</p>
                        </td>
                        <td>{member.plan}</td>
                        <td><StatusBadge status={member.status} /></td>
                        <td>{member.end_date}</td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => markAttendance(member.id)} className="rounded-xl bg-lime-100 text-lime-700 px-3 py-2 font-bold">
                              Check
                            </button>
                            <button onClick={() => removeMember(member.id)} className="rounded-xl bg-red-100 text-red-700 px-3 py-2 font-bold">
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        )}

        {activeTab === "Planes" && (
          <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan) => (
              <Card key={plan.name} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-lime-300 rounded-bl-full opacity-50" />
                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                <p className="text-neutral-500 mb-6">{plan.description}</p>
                <p className="text-4xl font-black mb-1">S/ {plan.price}</p>
                <p className="text-sm text-neutral-500">Precio del plan</p>
              </Card>
            ))}
          </section>
        )}

        {activeTab === "Pagos" && (
          <Card>
            <h3 className="text-xl font-black mb-5">Historial de pagos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 border-b">
                    <th className="py-3">Cliente</th>
                    <th>Plan</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Método</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="py-4 font-bold">{payment.member}</td>
                      <td>{payment.plan}</td>
                      <td className="font-black">S/ {payment.amount}</td>
                      <td>{payment.date}</td>
                      <td>{payment.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "Clases" && (
          <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {classes.map((gymClass) => (
              <Card key={gymClass.id}>
                <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-lime-300 flex items-center justify-center mb-4">
                  <Dumbbell />
                </div>
                <h3 className="text-xl font-black">{gymClass.name}</h3>
                <p className="text-neutral-500 mb-4">Entrenador: {gymClass.trainer}</p>
                <p className="font-bold mb-2">Horario: {gymClass.time}</p>
                <Progress label={`${gymClass.enrolled}/${gymClass.capacity} inscritos`} value={(gymClass.enrolled / gymClass.capacity) * 100} />
              </Card>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[1.5rem] p-5 shadow-sm border border-neutral-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Stat({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <h3 className="text-3xl font-black mt-1">{value}</h3>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center">
          <Icon />
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Member["status"] }) {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-semibold">{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-lime-400 rounded-full" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border px-4 py-3 outline-none focus:border-lime-500"
    />
  );
}

function Feature({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/30 p-3 backdrop-blur">
      <CheckCircle2 size={20} />
      <span className="font-bold">{title}</span>
    </div>
  );
}
