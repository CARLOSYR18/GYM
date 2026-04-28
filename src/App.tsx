import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  LogOut,
  Search,
  UserPlus,
  Users,
  Wallet,
  Flame,
  Heart,
  Trophy,
  Target,
  Apple,
  Zap,
  Clock,
  Star,
  TrendingUp,
  Bell,
  Play,
  Shield,
  Award,
  Home,
  Smartphone,
  Banknote,
  ArrowRight,
  CalendarCheck,
  AlertCircle,
  CheckCircle,
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
  image: string;
  category: string;
}

interface GymUser {
  id: number;
  full_name: string;
  username: string;
  password: string;
  role: "admin" | "usuario";
}

const classes: GymClass[] = [
  { id: 1, name: "Funcional", trainer: "Diego Salas", time: "07:00 AM", capacity: 20, enrolled: 14, image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80", category: "Fuerza" },
  { id: 2, name: "Spinning", trainer: "Rosa Vega", time: "09:00 AM", capacity: 15, enrolled: 12, image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&q=80", category: "Cardio" },
  { id: 3, name: "Box Training", trainer: "Marco Ruiz", time: "06:00 PM", capacity: 18, enrolled: 17, image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&q=80", category: "Combate" },
  { id: 4, name: "Musculación", trainer: "Kevin Díaz", time: "08:00 PM", capacity: 25, enrolled: 19, image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80", category: "Fuerza" },
];

const plans = [
  { name: "Semanal", price: 35, description: "Acceso libre por 7 días", color: "#a3e635", features: ["Acceso sala principal", "Vestuarios", "App móvil"] },
  { name: "Mensual", price: 120, description: "Acceso completo por 30 días", color: "#84cc16", features: ["Todo Semanal", "Clases grupales", "Seguimiento básico"] },
  { name: "Trimestral", price: 300, description: "Ahorro especial por 3 meses", color: "#65a30d", features: ["Todo Mensual", "Descuento 17%", "1 sesión personal"] },
  { name: "VIP", price: 180, description: "Rutina personalizada + asesoría", color: "#4ade80", features: ["Todo incluido", "Entrenador personal", "Plan nutricional", "Prioridad en clases"] },
];

const workoutTips = [
  { icon: Flame, title: "Calentamiento", desc: "10 min antes de entrenar para evitar lesiones", color: "#f97316" },
  { icon: Apple, title: "Nutrición", desc: "Come proteína en las 2h post-entrenamiento", color: "#84cc16" },
  { icon: Heart, title: "Recuperación", desc: "Duerme 7-8h para máxima recuperación muscular", color: "#ec4899" },
  { icon: Zap, title: "Hidratación", desc: "2-3 litros de agua durante tu jornada activa", color: "#06b6d4" },
  { icon: Target, title: "Objetivos SMART", desc: "Define metas específicas, medibles y alcanzables", color: "#a855f7" },
  { icon: Clock, title: "Descanso activo", desc: "1-2 días de descanso activo entre sesiones intensas", color: "#f59e0b" },
];

const exercises = [
  { name: "Press de banca", muscles: "Pecho, Tríceps", sets: "4x10", image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=300&q=80" },
  { name: "Sentadilla", muscles: "Cuádriceps, Glúteos", sets: "4x12", image: "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=300&q=80" },
  { name: "Peso muerto", muscles: "Isquios, Espalda", sets: "3x8", image: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=300&q=80" },
  { name: "Dominadas", muscles: "Dorsales, Bíceps", sets: "3x8", image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a34?w=300&q=80" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<GymUser | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<GymUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "", dni: "", phone: "", plan: "Mensual",
    status: "Activo" as Member["status"], paid: "120",
  });

  const [userForm, setUserForm] = useState({
    full_name: "", username: "", password: "", role: "usuario" as GymUser["role"],
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("gym_user");
    if (savedUser) {
      const user = JSON.parse(savedUser) as GymUser;
      setCurrentUser(user);
      setIsLoggedIn(true);
      setActiveTab(user.role === "admin" ? "Dashboard" : "Inicio");
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadMembers();
      if (currentUser?.role === "admin") loadUsers();
    }
  }, [isLoggedIn, currentUser]);

  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("members").select("*").order("id", { ascending: false });
    if (error) { alert("Error al cargar datos"); setLoading(false); return; }
    setMembers((data || []) as Member[]);
    const generatedPayments: Payment[] = (data || []).filter((m) => Number(m.paid) > 0).map((m) => ({
      id: m.id, member: m.name, plan: m.plan, amount: Number(m.paid), date: m.start_date, method: "Registrado",
    }));
    setPayments(generatedPayments);
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase.from("users_gym").select("*").order("id", { ascending: false });
    if (!error) setUsers((data || []) as GymUser[]);
  };

  const filteredMembers = useMemo(() =>
    members.filter((m) => `${m.name} ${m.dni} ${m.phone} ${m.plan}`.toLowerCase().includes(search.toLowerCase())),
    [members, search]
  );

  const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
  const activeMembers = members.filter((m) => m.status === "Activo").length;
  const expiredMembers = members.filter((m) => m.status === "Vencido").length;
  const pendingMembers = members.filter((m) => m.status === "Pendiente").length;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    const { data, error } = await supabase.from("users_gym").select("*").eq("username", username.trim()).eq("password", password.trim()).single();
    if (error || !data) { setLoginError("Usuario o contraseña incorrectos"); return; }
    const user = data as GymUser;
    localStorage.setItem("gym_user", JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActiveTab(user.role === "admin" ? "Dashboard" : "Inicio");
    setUsername(""); setPassword("");
  };

  const logout = () => { localStorage.removeItem("gym_user"); setCurrentUser(null); setIsLoggedIn(false); setActiveTab("Dashboard"); };

  const addMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dni.trim() || !form.phone.trim()) { alert("Completa nombre, DNI y teléfono"); return; }
    const today = new Date();
    const endDate = new Date(today);
    const days = form.plan === "Semanal" ? 7 : form.plan === "Trimestral" ? 90 : 30;
    endDate.setDate(today.getDate() + days);
    const newMember = { name: form.name, dni: form.dni, phone: form.phone, plan: form.plan, status: form.status, start_date: today.toISOString().slice(0, 10), end_date: endDate.toISOString().slice(0, 10), paid: Number(form.paid) };
    const { error } = await supabase.from("members").insert([newMember]);
    if (error) { alert("Error al guardar"); return; }
    setForm({ name: "", dni: "", phone: "", plan: "Mensual", status: "Activo", paid: "120" });
    loadMembers();
  };

  const removeMember = async (id: number) => {
    if (currentUser?.role !== "admin") return;
    if (!confirm("¿Eliminar este socio?")) return;
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (!error) loadMembers();
  };

  const markAttendance = async (id: number) => {
    const { error } = await supabase.from("members").update({ status: "Activo" }).eq("id", id);
    if (!error) loadMembers();
  };

  const addUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser?.role !== "admin") return;
    if (!userForm.full_name.trim() || !userForm.username.trim() || !userForm.password.trim()) { alert("Completa todos los campos"); return; }
    const { error } = await supabase.from("users_gym").insert([userForm]);
    if (error) { alert("Error al crear usuario. El username puede ya existir."); return; }
    setUserForm({ full_name: "", username: "", password: "", role: "usuario" });
    loadUsers();
  };

  const removeUser = async (id: number) => {
    if (currentUser?.role !== "admin" || id === currentUser.id) return;
    if (!confirm("¿Eliminar usuario?")) return;
    const { error } = await supabase.from("users_gym").delete().eq("id", id);
    if (!error) loadUsers();
  };

  const adminMenu = [
    { name: "Dashboard", icon: BarChart3 },
    { name: "Socios", icon: Users },
    { name: "Planes", icon: CreditCard },
    { name: "Pagos", icon: Wallet },
    { name: "Clases", icon: CalendarDays },
    { name: "Usuarios", icon: UserPlus },
  ];

  const userMenu = [
    { name: "Inicio", icon: Home },
    { name: "Mi Plan", icon: CreditCard },
    { name: "Mis Pagos", icon: Wallet },
    { name: "Medios de Pago", icon: Banknote },
    { name: "Horarios", icon: Clock },
    { name: "Clases", icon: Dumbbell },
    { name: "Mi Progreso", icon: TrendingUp },
    { name: "Rutinas", icon: Target },
    { name: "Nutrición", icon: Apple },
    { name: "Logros", icon: Trophy },
    { name: "Recomendaciones", icon: Star },
  ];

  const menu = currentUser?.role === "admin" ? adminMenu : userMenu;

  const myMember = members.find((m) => {
    const mn = m.name.toLowerCase().trim();
    const fn = currentUser?.full_name.toLowerCase().trim() || "";
    const un = currentUser?.username.toLowerCase().trim() || "";
    return mn === fn || mn === un;
  });

  // Days remaining calculation
  const getDaysRemaining = () => {
    if (!myMember?.end_date) return null;
    const end = new Date(myMember.end_date);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };
  const daysRemaining = getDaysRemaining();

  // ============ LOGIN SCREEN ============
  if (!isLoggedIn) {
    return (
      <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow', 'Arial Black', sans-serif", padding: "16px" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow+Condensed:wght@700;900&display=swap');`}</style>
        <div style={{ width: "100%", maxWidth: "1100px", display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: "24px", overflow: "hidden", boxShadow: "0 0 80px rgba(163,230,53,0.15)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ position: "relative", minHeight: "600px", overflow: "hidden" }}>
            <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" alt="gym" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(163,230,53,0.2) 100%)" }} />
            <div style={{ position: "relative", zIndex: 10, padding: "48px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#a3e635", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Dumbbell size={26} color="#000" />
                </div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "2px" }}>POWER GYM</span>
              </div>
              <div>
                <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "14px", letterSpacing: "4px", marginBottom: "16px", textTransform: "uppercase" }}>Sistema de gestión</p>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(52px, 6vw, 72px)", fontWeight: 900, lineHeight: 0.9, color: "#fff", marginBottom: "24px", fontStyle: "italic", textTransform: "uppercase" }}>
                  SÉ FUERTE.<br /><span style={{ color: "#a3e635" }}>SÉ IMPARABLE.</span>
                </h1>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {["Socios", "Pagos", "Clases", "Reportes"].map((f) => (
                    <span key={f} style={{ background: "rgba(163,230,53,0.15)", border: "1px solid rgba(163,230,53,0.3)", color: "#a3e635", padding: "6px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: 700 }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: "#111", padding: "48px" }}>
            <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "8px" }}>Bienvenido</p>
            <h2 style={{ color: "#fff", fontSize: "36px", fontWeight: 900, marginBottom: "40px", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>Iniciar sesión</h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#888", fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Usuario</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin"
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "14px 16px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = "#a3e635"} onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ color: "#888", fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Contraseña</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••"
                  style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "14px 16px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => e.target.style.borderColor = "#a3e635"} onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
              </div>
              {loginError && <p style={{ color: "#f87171", fontSize: "14px", marginBottom: "16px" }}>{loginError}</p>}
              <button type="submit" style={{ width: "100%", background: "#a3e635", color: "#000", fontWeight: 900, fontSize: "16px", padding: "15px", borderRadius: "12px", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "2px", textTransform: "uppercase" }}>
                ENTRAR AL SISTEMA
              </button>
            </form>
            <div style={{ marginTop: "40px", padding: "20px", background: "#1a1a1a", borderRadius: "12px", border: "1px solid #2a2a2a" }}>
              <p style={{ color: "#555", fontSize: "13px", marginBottom: "8px" }}>Credenciales de prueba:</p>
              <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "14px" }}>Admin: <span style={{ color: "#fff" }}>admin</span> / <span style={{ color: "#fff" }}>123456</span></p>
            </div>
            <div style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[{ icon: Shield, label: "Seguro" }, { icon: Zap, label: "Rápido" }, { icon: Bell, label: "Alertas" }, { icon: Award, label: "Premium" }].map(({ icon: Icon, label }) => (
                <div key={label} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={16} color="#a3e635" />
                  <span style={{ color: "#888", fontSize: "13px", fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============ MAIN APP ============
  const S: Record<string, React.CSSProperties> = {
    app: { minHeight: "100vh", background: "#0d0d0d", color: "#fff", display: "flex", fontFamily: "'Barlow', 'Arial', sans-serif" },
    sidebar: { width: "260px", minWidth: "260px", background: "#111", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", padding: "24px 16px", position: "sticky" as any, top: 0, height: "100vh", overflowY: "auto" },
    logo: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", padding: "0 8px" },
    logoIcon: { width: "42px", height: "42px", borderRadius: "12px", background: "#a3e635", display: "flex", alignItems: "center", justifyContent: "center" },
    userCard: { background: "#1a1a1a", borderRadius: "14px", padding: "16px", marginBottom: "24px", border: "1px solid #2a2a2a" },
    navBtn: (active: boolean): React.CSSProperties => ({ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, transition: "all 0.2s", background: active ? "#a3e635" : "transparent", color: active ? "#000" : "#888", textAlign: "left" }),
    main: { flex: 1, padding: "32px", overflowY: "auto" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" },
    card: { background: "#161616", border: "1px solid #222", borderRadius: "18px", padding: "24px" },
    statCard: (color: string): React.CSSProperties => ({ background: "#161616", border: "1px solid #222", borderRadius: "18px", padding: "24px", borderTop: `3px solid ${color}` }),
    badge: (status: Member["status"]): React.CSSProperties => {
      const colors = { Activo: { bg: "rgba(163,230,53,0.15)", color: "#a3e635", border: "rgba(163,230,53,0.3)" }, Vencido: { bg: "rgba(248,113,113,0.15)", color: "#f87171", border: "rgba(248,113,113,0.3)" }, Pendiente: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" } };
      return { display: "inline-flex", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, background: colors[status].bg, color: colors[status].color, border: `1px solid ${colors[status].border}` };
    },
    input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "12px 14px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" as any },
    select: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "12px 14px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" as any },
    btnPrimary: { width: "100%", background: "#a3e635", color: "#000", fontWeight: 900, fontSize: "14px", padding: "13px", borderRadius: "10px", border: "none", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" as any },
    btnDanger: { background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" },
    btnSuccess: { background: "rgba(163,230,53,0.15)", color: "#a3e635", border: "1px solid rgba(163,230,53,0.3)", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" },
    table: { width: "100%", borderCollapse: "collapse" as any, fontSize: "14px" },
    th: { textAlign: "left" as any, padding: "12px 16px", color: "#555", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as any, letterSpacing: "1px", borderBottom: "1px solid #222" },
    td: { padding: "14px 16px", borderBottom: "1px solid #1a1a1a", verticalAlign: "middle" as any },
    logoutBtn: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px", background: "transparent", border: "none", color: "#555", cursor: "pointer", width: "100%", fontSize: "14px", fontWeight: 600, marginTop: "auto" },
  };

  const featuredClasses = classes.slice(0, 3);
  const services = [
    { name: "Nutrición", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&q=80" },
    { name: "Entrenador", image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300&q=80" },
    { name: "Yoga", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&q=80" },
  ];

  return (
    <main style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,900;1,900&family=Barlow+Condensed:wght@700;900&display=swap');
        * { scrollbar-width: thin; scrollbar-color: #333 #111; }
        .pay-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
        .pay-card { transition: transform 0.25s, box-shadow 0.25s; }
        .class-card:hover .class-overlay { opacity: 1 !important; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoIcon}><Dumbbell size={22} color="#000" /></div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "18px", letterSpacing: "2px", color: "#fff" }}>POWER GYM</div>
            <div style={{ fontSize: "11px", color: "#555", fontWeight: 600 }}>{currentUser?.role === "admin" ? "Administrador" : "Miembro"}</div>
          </div>
        </div>
        <div style={S.userCard}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#a3e635", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
            <span style={{ fontWeight: 900, color: "#000", fontSize: "16px" }}>{currentUser?.full_name?.[0]?.toUpperCase()}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>{currentUser?.full_name}</div>
          <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>@{currentUser?.username}</div>
          <span style={{ display: "inline-block", marginTop: "8px", background: "rgba(163,230,53,0.15)", color: "#a3e635", border: "1px solid rgba(163,230,53,0.3)", padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{currentUser?.role}</span>
        </div>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.name} onClick={() => setActiveTab(item.name)} style={S.navBtn(activeTab === item.name)}>
                <Icon size={17} />
                {item.name}
              </button>
            );
          })}
        </nav>
        <button onClick={logout} style={S.logoutBtn}>
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <section style={S.main}>
        <header style={S.header}>
          <div>
            <p style={{ color: "#555", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Panel de control</p>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "32px", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>{activeTab}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Bell size={18} color="#888" />
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#a3e635", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontWeight: 900, color: "#000" }}>{currentUser?.full_name?.[0]?.toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* ============ ADMIN DASHBOARD ============ */}
        {currentUser?.role === "admin" && activeTab === "Dashboard" && (
          <div>
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "28px", height: "200px" }}>
              <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80" alt="gym" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase" }}>Bienvenido</p>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "40px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: "4px 0 0" }}>{currentUser.full_name}</h3>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
              {[
                { title: "Socios activos", value: activeMembers, icon: Users, color: "#a3e635" },
                { title: "Vencidos", value: expiredMembers, icon: Activity, color: "#f87171" },
                { title: "Pendientes", value: pendingMembers, icon: CreditCard, color: "#fbbf24" },
                { title: "Ingresos", value: `S/ ${totalIncome}`, icon: Wallet, color: "#818cf8" },
              ].map(({ title, value, icon: Icon, color }) => (
                <div key={title} style={S.statCard(color)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ color: "#555", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{title}</p>
                      <h3 style={{ fontSize: "36px", fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", color: "#fff", margin: 0 }}>{value}</h3>
                    </div>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={20} color={color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
              <div style={S.card}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Últimos socios</h3>
                {loading ? <p style={{ color: "#555" }}>Cargando...</p> : members.length === 0 ? (
                  <p style={{ color: "#555" }}>No hay socios registrados.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {members.slice(0, 5).map((m) => (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a1a", borderRadius: "12px", padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#a3e63520", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontWeight: 900, color: "#a3e635", fontSize: "15px" }}>{m.name[0]}</span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>{m.name}</div>
                            <div style={{ color: "#555", fontSize: "12px" }}>{m.plan} · vence {m.end_date}</div>
                          </div>
                        </div>
                        <span style={S.badge(m.status)}>{m.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={S.card}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Rendimiento</h3>
                {[{ label: "Ocupación gym", value: 72, color: "#a3e635" }, { label: "Pagos ok", value: 84, color: "#818cf8" }, { label: "Asistencia", value: 63, color: "#f97316" }].map(({ label, value, color }) => (
                  <div key={label} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#888", fontSize: "13px", fontWeight: 600 }}>{label}</span>
                      <span style={{ color, fontWeight: 700, fontSize: "13px" }}>{value}%</span>
                    </div>
                    <div style={{ height: "6px", background: "#222", borderRadius: "100px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: "100px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ INICIO (USUARIO) — NUEVO DISEÑO ============ */}
        {currentUser?.role === "usuario" && activeTab === "Inicio" && (
          <div>
            {/* TOP ROW: Hero + Estado card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", marginBottom: "20px" }}>

              {/* Hero Banner */}
              <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", minHeight: "240px" }}>
                <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80" alt="gym" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)" }} />
                <div style={{ position: "relative", zIndex: 2, padding: "36px 40px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "10px" }}>BE STRONG · BE BEAUTIFUL</p>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", lineHeight: 1.0, margin: "0 0 14px" }}>
                    Entrena fuerte,<br />controla tu plan<br />y mantente activo
                  </h2>
                  <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.6, marginBottom: "24px", maxWidth: "380px" }}>
                    Desde este panel puedes ver tu membresía, pagos, rutinas, horarios y clases disponibles.
                  </p>
                  <button
                    onClick={() => setActiveTab("Mi Progreso")}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#a3e635", color: "#000", fontWeight: 900, fontSize: "13px", padding: "12px 24px", borderRadius: "10px", border: "none", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase", width: "fit-content" }}>
                    Ver mi progreso <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Mi Estado Card */}
              <div style={{ ...S.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "12px" }}>
                <p style={{ color: "#555", fontSize: "11px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase" }}>Mi estado</p>

                {/* Circular progress */}
                <div style={{ position: "relative", width: "110px", height: "110px" }}>
                  <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="55" cy="55" r="48" fill="none" stroke="#222" strokeWidth="8" />
                    <circle cx="55" cy="55" r="48" fill="none" stroke="#a3e635" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      strokeDashoffset={`${2 * Math.PI * 48 * (1 - (myMember ? (myMember.status === "Activo" ? 0.85 : myMember.status === "Pendiente" ? 0.4 : 0.1) : 0.05))}`}
                      strokeLinecap="round" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", fontWeight: 900, color: "#fff" }}>
                      {myMember ? (myMember.status === "Activo" ? "85%" : myMember.status === "Pendiente" ? "40%" : "10%") : "0%"}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, color: myMember?.status === "Activo" ? "#a3e635" : myMember?.status === "Pendiente" ? "#fbbf24" : "#f87171" }}>
                    {myMember?.status || "Sin plan"}
                  </div>
                  <div style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>Plan: <span style={{ color: "#888", fontWeight: 700 }}>{myMember?.plan || "No asignado"}</span></div>
                </div>

                {daysRemaining !== null && (
                  <div style={{ background: daysRemaining > 7 ? "rgba(163,230,53,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${daysRemaining > 7 ? "rgba(163,230,53,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius: "10px", padding: "8px 14px", width: "100%" }}>
                    <span style={{ color: daysRemaining > 7 ? "#a3e635" : "#f87171", fontWeight: 700, fontSize: "13px" }}>
                      {daysRemaining > 0 ? `${daysRemaining} días restantes` : "¡Vencido!"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* QUICK STATS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
              {[
                { label: "Calorías", value: "850 kcal", icon: Flame, color: "#f97316" },
                { label: "Rutina", value: myMember?.plan === "VIP" ? "Personal" : "Pecho + Tríceps", icon: Dumbbell, color: "#a3e635" },
                { label: "Entrenos", value: "4 esta semana", icon: Activity, color: "#818cf8" },
                { label: "Meta", value: "73% completado", icon: Trophy, color: "#fbbf24" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{ background: "#161616", border: "1px solid #222", borderRadius: "16px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div>
                    <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px" }}>{label}</p>
                    <p style={{ color: "#fff", fontSize: "15px", fontWeight: 900, margin: 0, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CLASES DESTACADAS + SERVICIOS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

              {/* Clases */}
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Clases destacadas</h3>
                  <button onClick={() => setActiveTab("Clases")} style={{ background: "none", border: "none", color: "#a3e635", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>Ver todas <ArrowRight size={13} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {featuredClasses.map((cls) => (
                    <div key={cls.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: "#1a1a1a", borderRadius: "12px", overflow: "hidden" }}>
                      <img src={cls.image} alt={cls.name} style={{ width: "70px", height: "60px", objectFit: "cover", flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: "4px 0" }}>
                        <div style={{ fontWeight: 800, color: "#fff", fontSize: "14px" }}>{cls.name}</div>
                        <div style={{ color: "#555", fontSize: "12px" }}>{cls.trainer} · {cls.time}</div>
                      </div>
                      <div style={{ padding: "0 16px", textAlign: "right" }}>
                        <span style={{ background: "#a3e63520", color: "#a3e635", border: "1px solid #a3e63530", padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700 }}>{cls.category}</span>
                        <div style={{ color: "#555", fontSize: "11px", marginTop: "4px" }}>{cls.enrolled}/{cls.capacity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Servicios */}
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Servicios para ti</h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {services.map((srv) => (
                    <div key={srv.name} style={{ borderRadius: "12px", overflow: "hidden", position: "relative", height: "100px", cursor: "pointer" }}>
                      <img src={srv.image} alt={srv.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }} />
                      <div style={{ position: "absolute", bottom: "8px", left: "10px" }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: "#fff", fontSize: "14px", textTransform: "uppercase" }}>{srv.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick links */}
                <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { label: "Ver Rutinas", tab: "Rutinas", color: "#a3e635" },
                    { label: "Nutrición", tab: "Nutrición", color: "#f97316" },
                    { label: "Horarios", tab: "Horarios", color: "#818cf8" },
                    { label: "Mis Logros", tab: "Logros", color: "#fbbf24" },
                  ].map(({ label, tab, color }) => (
                    <button key={label} onClick={() => setActiveTab(tab)}
                      style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: "10px", padding: "10px 14px", color, fontWeight: 700, fontSize: "13px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {label} <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ SOCIOS ============ */}
        {activeTab === "Socios" && (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
            <div style={S.card}>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={18} color="#a3e635" /> Registrar socio
              </h3>
              <form onSubmit={addMember} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[{ placeholder: "Nombre completo", key: "name" }, { placeholder: "DNI", key: "dni" }, { placeholder: "Teléfono", key: "phone" }].map(({ placeholder, key }) => (
                  <input key={key} placeholder={placeholder} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={S.input} />
                ))}
                <select value={form.plan} onChange={(e) => { const p = plans.find((pl) => pl.name === e.target.value); setForm({ ...form, plan: e.target.value, paid: String(p?.price || 0) }); }} style={S.select}>
                  {plans.map((p) => <option key={p.name}>{p.name}</option>)}
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Member["status"] })} style={S.select}>
                  <option>Activo</option><option>Pendiente</option><option>Vencido</option>
                </select>
                <input placeholder="Pago S/" value={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.value })} style={S.input} />
                <button type="submit" style={S.btnPrimary}>+ Guardar socio</button>
              </form>
            </div>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Lista de socios</h3>
                <div style={{ position: "relative" }}>
                  <Search size={16} color="#555" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." style={{ ...S.input, paddingLeft: "38px", width: "220px" }} />
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Socio</th><th style={S.th}>Plan</th><th style={S.th}>Estado</th><th style={S.th}>Vence</th><th style={S.th}>Acción</th></tr></thead>
                  <tbody>
                    {filteredMembers.map((m) => (
                      <tr key={m.id}>
                        <td style={S.td}><div style={{ fontWeight: 700, color: "#fff" }}>{m.name}</div><div style={{ color: "#555", fontSize: "12px" }}>DNI {m.dni} · {m.phone}</div></td>
                        <td style={S.td}><span style={{ color: "#888" }}>{m.plan}</span></td>
                        <td style={S.td}><span style={S.badge(m.status)}>{m.status}</span></td>
                        <td style={S.td}><span style={{ color: "#888", fontSize: "13px" }}>{m.end_date}</span></td>
                        <td style={S.td}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => markAttendance(m.id)} style={S.btnSuccess}>✓</button>
                            {currentUser?.role === "admin" && <button onClick={() => removeMember(m.id)} style={S.btnDanger}>✕</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============ PLANES ============ */}
        {activeTab === "Planes" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {plans.map((plan, i) => (
              <div key={plan.name} style={{ ...S.card, borderTop: `3px solid ${plan.color}`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: `${plan.color}15` }} />
                {i === 3 && <div style={{ position: "absolute", top: "16px", right: "16px", background: "#a3e635", color: "#000", fontSize: "10px", fontWeight: 900, padding: "3px 8px", borderRadius: "100px", letterSpacing: "1px" }}>POPULAR</div>}
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", fontWeight: 900, textTransform: "uppercase", color: "#fff", marginBottom: "4px" }}>{plan.name}</h3>
                <p style={{ color: "#555", fontSize: "13px", marginBottom: "20px" }}>{plan.description}</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "48px", fontWeight: 900, color: plan.color, margin: "0 0 4px" }}>S/ {plan.price}</p>
                <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#888" }}>
                      <CheckCircle2 size={14} color={plan.color} /> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============ PAGOS (ADMIN) ============ */}
        {activeTab === "Pagos" && (
          <div style={S.card}>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Historial de pagos</h3>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Cliente</th><th style={S.th}>Plan</th><th style={S.th}>Monto</th><th style={S.th}>Fecha</th><th style={S.th}>Método</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={S.td}><span style={{ fontWeight: 700, color: "#fff" }}>{p.member}</span></td>
                    <td style={S.td}><span style={{ color: "#888" }}>{p.plan}</span></td>
                    <td style={S.td}><span style={{ fontWeight: 900, color: "#a3e635" }}>S/ {p.amount}</span></td>
                    <td style={S.td}><span style={{ color: "#555" }}>{p.date}</span></td>
                    <td style={S.td}><span style={{ color: "#888" }}>{p.method}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ============ CLASES ============ */}
        {(activeTab === "Clases") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {classes.map((cls) => (
              <div key={cls.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                <div style={{ position: "relative", height: "180px" }}>
                  <img src={cls.image} alt={cls.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)" }} />
                  <div style={{ position: "absolute", bottom: "16px", left: "16px", right: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <span style={{ background: "#a3e63520", color: "#a3e635", border: "1px solid #a3e63530", padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700 }}>{cls.category}</span>
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "26px", color: "#fff", textTransform: "uppercase", margin: "4px 0 0" }}>{cls.name}</h3>
                    </div>
                    <div style={{ background: "#a3e635", borderRadius: "50%", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Play size={18} color="#000" fill="#000" />
                    </div>
                  </div>
                </div>
                <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#555", fontSize: "12px" }}>Entrenador</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>{cls.trainer}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#555", fontSize: "12px" }}>Horario</div>
                    <div style={{ fontWeight: 700, color: "#a3e635", fontSize: "14px" }}>{cls.time}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#555", fontSize: "12px" }}>Inscritos</div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>{cls.enrolled}/{cls.capacity}</div>
                    <div style={{ marginTop: "6px", height: "4px", width: "80px", background: "#222", borderRadius: "100px" }}>
                      <div style={{ height: "100%", width: `${(cls.enrolled / cls.capacity) * 100}%`, background: cls.enrolled / cls.capacity > 0.8 ? "#f87171" : "#a3e635", borderRadius: "100px" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============ USUARIOS (ADMIN) ============ */}
        {activeTab === "Usuarios" && currentUser?.role === "admin" && (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
            <div style={S.card}>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={18} color="#a3e635" /> Crear usuario
              </h3>
              <form onSubmit={addUser} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input placeholder="Nombre completo" value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} style={S.input} />
                <input placeholder="Usuario" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} style={S.input} />
                <input placeholder="Contraseña" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} style={S.input} />
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as GymUser["role"] })} style={S.select}>
                  <option value="usuario">usuario</option>
                  <option value="admin">admin</option>
                </select>
                <button type="submit" style={S.btnPrimary}>+ Crear usuario</button>
              </form>
            </div>
            <div style={S.card}>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "20px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Usuarios del sistema</h3>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Nombre</th><th style={S.th}>Usuario</th><th style={S.th}>Rol</th><th style={S.th}>Acción</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={S.td}><span style={{ fontWeight: 700, color: "#fff" }}>{u.full_name}</span></td>
                      <td style={S.td}><span style={{ color: "#888" }}>@{u.username}</span></td>
                      <td style={S.td}><span style={{ background: u.role === "admin" ? "#a3e63520" : "#818cf820", color: u.role === "admin" ? "#a3e635" : "#818cf8", border: `1px solid ${u.role === "admin" ? "#a3e63530" : "#818cf830"}`, padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700 }}>{u.role}</span></td>
                      <td style={S.td}><button onClick={() => removeUser(u.id)} style={S.btnDanger}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ MI PLAN (USUARIO) ============ */}
        {currentUser?.role === "usuario" && activeTab === "Mi Plan" && (
          <div>
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "24px", height: "180px" }}>
              <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80" alt="gym" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase" }}>Tu membresía</p>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "38px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: "4px 0 0" }}>
                  {myMember ? `Plan ${myMember.plan}` : "Sin plan activo"}
                </h3>
              </div>
            </div>
            {myMember ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                {[
                  { title: "Socio", value: myMember.name, color: "#a3e635" },
                  { title: "Plan", value: myMember.plan, color: "#818cf8" },
                  { title: "Estado", value: myMember.status, color: "#fbbf24" },
                  { title: "Pago", value: `S/ ${myMember.paid}`, color: "#a3e635" },
                  { title: "Inicio", value: myMember.start_date, color: "#06b6d4" },
                  { title: "Vence", value: myMember.end_date, color: "#f97316" },
                ].map(({ title, value, color }) => (
                  <div key={title} style={{ ...S.card, borderTop: `3px solid ${color}` }}>
                    <p style={{ color: "#555", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{title}</p>
                    <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "24px", fontWeight: 900, color: "#fff", margin: 0 }}>{value}</h4>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: "center", padding: "48px" }}>
                <Dumbbell size={48} color="#333" style={{ marginBottom: "16px" }} />
                <p style={{ color: "#555" }}>Aún no tienes membresía vinculada. Contacta al administrador.</p>
              </div>
            )}
          </div>
        )}

        {/* ============ MIS PAGOS (USUARIO) — REDISEÑADO ============ */}
        {currentUser?.role === "usuario" && activeTab === "Mis Pagos" && (
          <div>
            {/* Header banner */}
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "24px", height: "160px" }}>
              <img src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80" alt="pagos" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "28px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Historial financiero</p>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "36px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: 0 }}>Mis Pagos</h3>
              </div>
            </div>

            {myMember ? (
              <div>
                {/* Top summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
                  {[
                    { label: "Último pago", value: `S/ ${myMember.paid}`, sub: myMember.start_date, icon: CheckCircle, color: "#a3e635", bg: "rgba(163,230,53,0.08)" },
                    { label: "Próximo pago", value: myMember.end_date, sub: `Plan ${myMember.plan}`, icon: CalendarCheck, color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
                    { label: "Estado de cuenta", value: myMember.status, sub: daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} días restantes` : "Vencido") : "—", icon: daysRemaining !== null && daysRemaining <= 0 ? AlertCircle : Shield, color: myMember.status === "Activo" ? "#a3e635" : myMember.status === "Pendiente" ? "#fbbf24" : "#f87171", bg: myMember.status === "Activo" ? "rgba(163,230,53,0.08)" : "rgba(248,113,113,0.08)" },
                  ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                    <div key={label} style={{ background: "#161616", border: `1px solid ${color}25`, borderRadius: "18px", padding: "24px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: "-16px", right: "-16px", width: "80px", height: "80px", borderRadius: "50%", background: bg }} />
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: bg, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                        <Icon size={20} color={color} />
                      </div>
                      <p style={{ color: "#555", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>{label}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "26px", fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{value}</p>
                      <p style={{ color: color, fontSize: "12px", fontWeight: 700 }}>{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Payment timeline */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                  <div style={S.card}>
                    <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", color: "#fff" }}>Detalle del pago actual</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                      {[
                        { label: "Nombre del socio", value: myMember.name, icon: "👤" },
                        { label: "Plan contratado", value: myMember.plan, icon: "📋" },
                        { label: "Monto pagado", value: `S/ ${myMember.paid}`, icon: "💰" },
                        { label: "Fecha de inicio", value: myMember.start_date, icon: "📅" },
                        { label: "Fecha de vencimiento", value: myMember.end_date, icon: "⏰" },
                        { label: "Método de pago", value: "Registrado en recepción", icon: "🏦" },
                      ].map(({ label, value, icon }, idx, arr) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderBottom: idx < arr.length - 1 ? "1px solid #1e1e1e" : "none" }}>
                          <span style={{ fontSize: "18px", width: "28px", textAlign: "center" }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 2px" }}>{label}</p>
                            <p style={{ color: "#fff", fontSize: "14px", fontWeight: 700, margin: 0 }}>{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vencimiento card */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ background: "#161616", border: "1px solid #222", borderRadius: "18px", padding: "24px", textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(163,230,53,0.12)", border: "2px solid rgba(163,230,53,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Wallet size={28} color="#a3e635" />
                      </div>
                      <div>
                        <p style={{ color: "#555", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>Vence el</p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{myMember.end_date}</p>
                        <p style={{ color: daysRemaining !== null && daysRemaining <= 5 ? "#f87171" : "#a3e635", fontSize: "13px", fontWeight: 700 }}>
                          {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} días restantes` : "¡Membresía vencida!") : "—"}
                        </p>
                      </div>
                    </div>

                    <div style={{ background: "rgba(163,230,53,0.06)", border: "1px solid rgba(163,230,53,0.2)", borderRadius: "16px", padding: "18px" }}>
                      <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>💡 Recordatorio</p>
                      <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>Renueva antes del vencimiento para no interrumpir tu acceso al gimnasio.</p>
                      <button onClick={() => setActiveTab("Medios de Pago")}
                        style={{ marginTop: "12px", width: "100%", background: "#a3e635", color: "#000", fontWeight: 900, fontSize: "12px", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        Ver cómo pagar <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: "center", padding: "64px" }}>
                <Wallet size={56} color="#333" style={{ marginBottom: "16px" }} />
                <p style={{ color: "#555", fontSize: "15px" }}>Sin pagos registrados. Contacta al administrador.</p>
              </div>
            )}
          </div>
        )}

        {/* ============ MEDIOS DE PAGO (USUARIO) — REDISEÑADO ============ */}
        {currentUser?.role === "usuario" && activeTab === "Medios de Pago" && (
          <div>
            {/* Header */}
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "24px", height: "160px" }}>
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80" alt="pagos" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "28px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>¿Cómo quieres pagar?</p>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "36px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: 0 }}>Medios de Pago</h3>
              </div>
            </div>

            {/* Payment method cards — big redesign */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
              {[
                {
                  title: "Efectivo",
                  subtitle: "Pago presencial",
                  desc: "Acércate a recepción y realiza tu pago directamente con el administrador.",
                  icon: Banknote,
                  color: "#a3e635",
                  gradient: "linear-gradient(135deg, #1a2a0a 0%, #161616 100%)",
                  steps: ["Visita recepción del gym", "Indica tu nombre o DNI", "Realiza el pago en efectivo", "Recibe tu comprobante"],
                  detail: "Lun – Sáb · 6:00 AM – 10:00 PM",
                  badge: "Disponible hoy",
                  badgeColor: "#a3e635",
                },
                {
                  title: "Yape",
                  subtitle: "Pago por app",
                  desc: "Escanea el QR o envía al número registrado y envía captura de pantalla.",
                  icon: Smartphone,
                  color: "#a855f7",
                  gradient: "linear-gradient(135deg, #1e0a2a 0%, #161616 100%)",
                  steps: ["Abre tu app Yape", "Escanea el QR o busca el número", "Ingresa el monto exacto", "Envía captura al admin"],
                  detail: "📱 +51 999 999 999",
                  badge: "Rápido y fácil",
                  badgeColor: "#a855f7",
                },
                {
                  title: "Transferencia",
                  subtitle: "Depósito bancario",
                  desc: "Transfiere desde tu banco a la cuenta del gimnasio previa coordinación.",
                  icon: CreditCard,
                  color: "#06b6d4",
                  gradient: "linear-gradient(135deg, #0a1e2a 0%, #161616 100%)",
                  steps: ["Solicita los datos bancarios", "Realiza la transferencia", "Envía voucher al admin", "Espera confirmación"],
                  detail: "Consultar en recepción",
                  badge: "Previa coordinación",
                  badgeColor: "#06b6d4",
                },
              ].map(({ title, subtitle, desc, icon: Icon, color, gradient, steps, detail, badge, badgeColor }) => (
                <div key={title} className="pay-card"
                  style={{ background: gradient, border: `1px solid ${color}25`, borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>

                  {/* Card header */}
                  <div style={{ padding: "24px 24px 20px", borderBottom: `1px solid ${color}18` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div style={{ width: "54px", height: "54px", borderRadius: "16px", background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={24} color={color} />
                      </div>
                      <span style={{ background: `${badgeColor}18`, border: `1px solid ${badgeColor}30`, color: badgeColor, fontSize: "10px", fontWeight: 800, padding: "4px 10px", borderRadius: "100px", letterSpacing: "1px", textTransform: "uppercase" }}>{badge}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "28px", fontWeight: 900, color: "#fff", textTransform: "uppercase", margin: "0 0 2px" }}>{title}</h3>
                    <p style={{ color: color, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 12px" }}>{subtitle}</p>
                    <p style={{ color: "#666", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{desc}</p>
                  </div>

                  {/* Steps */}
                  <div style={{ padding: "20px 24px", flex: 1 }}>
                    <p style={{ color: "#444", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>Cómo hacerlo</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {steps.map((step, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ color, fontSize: "10px", fontWeight: 900 }}>{i + 1}</span>
                          </div>
                          <span style={{ color: "#777", fontSize: "12px", lineHeight: 1.4 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer detail */}
                  <div style={{ margin: "0 20px 20px", background: `${color}10`, border: `1px solid ${color}25`, borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ color, fontWeight: 700, fontSize: "13px" }}>{detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Info notice */}
            <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,191,36,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bell size={20} color="#fbbf24" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "#fff", fontSize: "14px", margin: "0 0 4px" }}>¿Necesitas ayuda con tu pago?</p>
                <p style={{ color: "#555", fontSize: "13px", margin: 0 }}>Comunícate con recepción o escríbenos. Siempre hay alguien disponible para ayudarte con tu renovación.</p>
              </div>
              <button onClick={() => setActiveTab("Mis Pagos")} style={{ background: "#fbbf2418", border: "1px solid #fbbf2430", color: "#fbbf24", fontWeight: 700, fontSize: "12px", padding: "10px 18px", borderRadius: "10px", cursor: "pointer", flexShrink: 0, textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                Ver mi saldo
              </button>
            </div>
          </div>
        )}

        {/* ============ HORARIOS (USUARIO) — REDISEÑADO ============ */}
        {currentUser?.role === "usuario" && activeTab === "Horarios" && (
          <div>
            {/* Hero */}
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "24px", height: "170px" }}>
              <img src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80" alt="gym" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "28px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Estamos aquí para ti</p>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "38px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: 0 }}>Horarios de Atención</h3>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
              {/* Schedule list */}
              <div style={S.card}>
                <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px", color: "#fff" }}>Semana completa</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {[
                    { day: "Lunes", abbr: "LUN", time: "6:00 AM – 10:00 PM", hours: 16, open: true },
                    { day: "Martes", abbr: "MAR", time: "6:00 AM – 10:00 PM", hours: 16, open: true },
                    { day: "Miércoles", abbr: "MIÉ", time: "6:00 AM – 10:00 PM", hours: 16, open: true },
                    { day: "Jueves", abbr: "JUE", time: "6:00 AM – 10:00 PM", hours: 16, open: true },
                    { day: "Viernes", abbr: "VIE", time: "6:00 AM – 10:00 PM", hours: 16, open: true },
                    { day: "Sábado", abbr: "SÁB", time: "7:00 AM – 6:00 PM", hours: 11, open: true },
                    { day: "Domingo", abbr: "DOM", time: "Cerrado", hours: 0, open: false },
                  ].map(({ day, abbr, time, hours, open }, idx, arr) => (
                    <div key={day} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: idx < arr.length - 1 ? "1px solid #1e1e1e" : "none" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: open ? "rgba(163,230,53,0.1)" : "rgba(248,113,113,0.08)", border: `1px solid ${open ? "rgba(163,230,53,0.25)" : "rgba(248,113,113,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", fontWeight: 900, color: open ? "#a3e635" : "#f87171", letterSpacing: "0.5px" }}>{abbr}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>{day}</div>
                        {open && (
                          <div style={{ marginTop: "6px", height: "4px", background: "#1e1e1e", borderRadius: "100px", overflow: "hidden", width: "160px" }}>
                            <div style={{ height: "100%", width: `${(hours / 16) * 100}%`, background: "#a3e635", borderRadius: "100px" }} />
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: open ? "#a3e635" : "#f87171" }}>{time}</span>
                        {open && <div style={{ color: "#444", fontSize: "11px", marginTop: "2px" }}>{hours}h abiertas</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info aside */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Open now card */}
                <div style={{ background: "linear-gradient(135deg, #1a2a0a 0%, #161616 100%)", border: "1px solid rgba(163,230,53,0.25)", borderRadius: "18px", padding: "24px", textAlign: "center" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(163,230,53,0.15)", border: "2px solid rgba(163,230,53,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#a3e635" }} />
                  </div>
                  <p style={{ color: "#a3e635", fontWeight: 900, fontSize: "16px", margin: "0 0 4px" }}>ABIERTO AHORA</p>
                  <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>Ven y entrena hoy</p>
                </div>

                {[
                  { icon: "🕕", label: "Apertura más temprana", value: "6:00 AM", sub: "Lunes a Viernes" },
                  { icon: "🌙", label: "Cierre más tarde", value: "10:00 PM", sub: "Lunes a Viernes" },
                  { icon: "📍", label: "Ubicación", value: "Power Gym", sub: "Centro de la ciudad" },
                ].map(({ icon, label, value, sub }) => (
                  <div key={label} style={{ background: "#161616", border: "1px solid #222", borderRadius: "14px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{icon}</span>
                    <div>
                      <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 2px" }}>{label}</p>
                      <p style={{ color: "#fff", fontSize: "14px", fontWeight: 700, margin: "0 0 1px" }}>{value}</p>
                      <p style={{ color: "#444", fontSize: "11px", margin: 0 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============ MI PROGRESO (USUARIO) — REDISEÑADO ============ */}
        {currentUser?.role === "usuario" && activeTab === "Mi Progreso" && (
          <div>
            {/* Hero banner */}
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "24px", height: "160px" }}>
              <img src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1200&q=80" alt="progreso" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "28px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ color: "#a3e635", fontWeight: 700, fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>Tu evolución</p>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "38px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: 0 }}>Mi Progreso</h3>
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
              {[
                { label: "Sesiones este mes", value: "12", icon: Flame, color: "#f97316", trend: "+3 vs mes ant." },
                { label: "Calorías quemadas", value: "4,800", icon: Zap, color: "#a3e635", trend: "+12% esta semana" },
                { label: "Horas entrenadas", value: "18h", icon: Clock, color: "#818cf8", trend: "Meta: 24h" },
                { label: "Racha actual", value: "5 días", icon: Trophy, color: "#fbbf24", trend: "¡Récord personal!" },
              ].map(({ label, value, icon: Icon, color, trend }) => (
                <div key={label} style={{ background: "#161616", border: `1px solid ${color}25`, borderRadius: "18px", padding: "20px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `${color}10` }} />
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                    <Icon size={18} color={color} />
                  </div>
                  <p style={{ color: "#555", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", margin: "0 0 6px" }}>{label}</p>
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "34px", fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>{value}</h3>
                  <p style={{ color, fontSize: "11px", fontWeight: 700, margin: 0 }}>{trend}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
              {/* Bar chart */}
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", color: "#fff", margin: 0 }}>Sesiones esta semana</h4>
                  <span style={{ background: "rgba(163,230,53,0.12)", color: "#a3e635", border: "1px solid rgba(163,230,53,0.25)", padding: "4px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: 700 }}>6 de 7 días</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "130px" }}>
                  {[
                    { d: "L", h: 80, min: 55 },
                    { d: "M", h: 60, min: 40 },
                    { d: "X", h: 90, min: 65 },
                    { d: "J", h: 45, min: 30 },
                    { d: "V", h: 100, min: 70 },
                    { d: "S", h: 70, min: 50 },
                    { d: "D", h: 0, min: 0 },
                  ].map(({ d, h, min }) => (
                    <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      {h > 0 && <span style={{ color: "#a3e635", fontSize: "10px", fontWeight: 700 }}>{min}m</span>}
                      <div style={{ width: "100%", background: h > 0 ? "linear-gradient(to top, #84cc16, #a3e635)" : "#1e1e1e", borderRadius: "8px 8px 0 0", height: `${Math.max(h, 4)}%`, opacity: h > 0 ? 1 : 0.4 }} />
                      <span style={{ color: h > 0 ? "#888" : "#333", fontSize: "12px", fontWeight: 700 }}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div style={S.card}>
                <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "18px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", color: "#fff", marginBottom: "20px" }}>Metas del mes</h4>
                {[
                  { label: "Sesiones completadas", current: 12, total: 20, color: "#a3e635" },
                  { label: "Calorías objetivo", current: 4800, total: 8000, color: "#f97316" },
                  { label: "Horas de entreno", current: 18, total: 24, color: "#818cf8" },
                ].map(({ label, current, total, color }) => {
                  const pct = Math.round((current / total) * 100);
                  return (
                    <div key={label} style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ color: "#888", fontSize: "12px", fontWeight: 600 }}>{label}</span>
                        <span style={{ color, fontWeight: 700, fontSize: "12px" }}>{pct}%</span>
                      </div>
                      <div style={{ height: "8px", background: "#1e1e1e", borderRadius: "100px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "100px" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        <span style={{ color: "#333", fontSize: "10px" }}>{current}</span>
                        <span style={{ color: "#333", fontSize: "10px" }}>/{total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============ RUTINAS (USUARIO) ============ */}
        {currentUser?.role === "usuario" && activeTab === "Rutinas" && (
          <div>
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "24px", height: "180px" }}>
              <img src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1200&q=80" alt="gym" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "38px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: 0 }}>Tu Rutina Semanal</h3>
                <p style={{ color: "#a3e635", fontSize: "13px", fontWeight: 700, marginTop: "4px" }}>Programa de fuerza e hipertrofia</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
              {exercises.map((ex) => (
                <div key={ex.name} style={{ ...S.card, padding: 0, overflow: "hidden", display: "flex" }}>
                  <img src={ex.image} alt={ex.name} style={{ width: "120px", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h4 style={{ fontWeight: 900, color: "#fff", fontSize: "16px", marginBottom: "4px" }}>{ex.name}</h4>
                    <p style={{ color: "#555", fontSize: "13px", marginBottom: "10px" }}>{ex.muscles}</p>
                    <span style={{ background: "#a3e63520", color: "#a3e635", border: "1px solid #a3e63330", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, display: "inline-block" }}>{ex.sets}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ NUTRICIÓN (USUARIO) ============ */}
        {currentUser?.role === "usuario" && activeTab === "Nutrición" && (
          <div>
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "24px", height: "180px" }}>
              <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80" alt="nutrition" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "38px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: 0 }}>Plan Nutricional</h3>
                <p style={{ color: "#a3e635", fontSize: "13px", fontWeight: 700, marginTop: "4px" }}>Alimentación para tu objetivo</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {[
                { meal: "Desayuno", time: "7:00 AM", items: ["Avena con frutas", "2 huevos revueltos", "Café o té verde"], cal: "450 kcal", color: "#f97316" },
                { meal: "Almuerzo", time: "1:00 PM", items: ["Pollo a la plancha", "Arroz integral", "Ensalada verde"], cal: "620 kcal", color: "#a3e635" },
                { meal: "Cena", time: "7:30 PM", items: ["Atún o salmón", "Vegetales salteados", "Batata asada"], cal: "480 kcal", color: "#818cf8" },
              ].map(({ meal, time, items, cal, color }) => (
                <div key={meal} style={{ ...S.card, borderTop: `3px solid ${color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px", fontWeight: 900, color: "#fff", textTransform: "uppercase", margin: 0 }}>{meal}</h3>
                    <span style={{ color, fontWeight: 700, fontSize: "13px" }}>{time}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {items.map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ color: "#888", fontSize: "13px" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: `${color}15`, borderRadius: "8px", padding: "8px 12px", textAlign: "center" }}>
                    <span style={{ color, fontWeight: 700, fontSize: "14px" }}>{cal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ LOGROS (USUARIO) ============ */}
        {currentUser?.role === "usuario" && activeTab === "Logros" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { title: "Primera sesión", desc: "Completaste tu primera sesión de entrenamiento", icon: "🏋️", earned: true },
              { title: "Semana completa", desc: "Entrenaste 5 días seguidos sin falta", icon: "🔥", earned: true },
              { title: "Mes activo", desc: "Asististe todos los días del mes", icon: "⚡", earned: false },
              { title: "Madrugador", desc: "3 sesiones antes de las 7AM", icon: "🌅", earned: true },
              { title: "Campeón de clases", desc: "Inscrito en 10 clases grupales", icon: "🏆", earned: false },
              { title: "Plan renovado", desc: "Renovaste tu membresía sin interrupciones", icon: "♻️", earned: false },
            ].map(({ title, desc, icon, earned }) => (
              <div key={title} style={{ ...S.card, opacity: earned ? 1 : 0.4, borderTop: earned ? "3px solid #a3e635" : "3px solid #333" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>{icon}</div>
                <h3 style={{ fontWeight: 900, color: "#fff", fontSize: "16px", marginBottom: "6px" }}>{title}</h3>
                <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.5 }}>{desc}</p>
                {earned && <span style={{ display: "inline-block", marginTop: "12px", background: "#a3e63520", color: "#a3e635", border: "1px solid #a3e63330", padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700 }}>OBTENIDO</span>}
              </div>
            ))}
          </div>
        )}

        {/* ============ RECOMENDACIONES (USUARIO) ============ */}
        {currentUser?.role === "usuario" && activeTab === "Recomendaciones" && (
          <div>
            <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "24px", height: "180px" }}>
              <img src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&q=80" alt="gym" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "38px", fontWeight: 900, fontStyle: "italic", color: "#fff", textTransform: "uppercase", margin: 0 }}>Consejos para ti</h3>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {workoutTips.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} style={{ ...S.card, borderTop: `3px solid ${color}` }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <Icon size={22} color={color} />
                  </div>
                  <h3 style={{ fontWeight: 900, color: "#fff", fontSize: "16px", marginBottom: "8px" }}>{title}</h3>
                  <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}