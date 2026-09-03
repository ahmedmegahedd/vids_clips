import { PLAN_DEFINITIONS, type PlanId } from "./plans";
import { yearlyDiscountPercent, type AdminSnapshot, type AdminUser, type AdminPlan, type AdminPayment, type AdminSubscription, type AdminProject } from "./admin";

const NOW = new Date("2026-09-03T10:00:00.000Z");

function iso(daysAgo: number, hour = 10) {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, (daysAgo * 7) % 60, 0, 0);
  return d.toISOString();
}

function minutesAgo(mins: number) {
  return new Date(NOW.getTime() - mins * 60_000).toISOString();
}

const THUMBS = [
  "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
  "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
  "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
  "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg",
];

function planName(id: string) {
  return PLAN_DEFINITIONS[id as PlanId]?.name ?? id;
}

function featuresFor(id: PlanId): AdminPlan["features"] {
  return PLAN_DEFINITIONS[id].benefits.map((label, i) => ({
    id: `${id}-f${i + 1}`,
    label,
    included: true,
  }));
}

export function createAdminSnapshot(): AdminSnapshot {
  const plans: AdminPlan[] = [
    {
      id: "free",
      name: "Free",
      description: "For users who want to try the product.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      videosPerMonth: 1,
      clipLimit: 12,
      maxProjects: 2,
      priority: 1,
      visibility: "public",
      status: "active",
      subscribers: 11234,
      revenue: 0,
      features: featuresFor("free"),
      builtIn: true,
    },
    {
      id: "creator",
      name: "Creator",
      description: "For creators who publish consistently and need more processing capacity.",
      monthlyPrice: 950,
      yearlyPrice: 9120,
      videosPerMonth: 20,
      clipLimit: 400,
      maxProjects: 20,
      priority: 2,
      visibility: "public",
      status: "active",
      subscribers: 620,
      revenue: 589000,
      features: [
        ...featuresFor("creator"),
        { id: "creator-fmt-9", label: "9:16 format", included: true },
        { id: "creator-fmt-16", label: "16:9 format", included: true },
        { id: "creator-fmt-1", label: "1:1 format", included: true },
      ],
      builtIn: true,
    },
    {
      id: "pro",
      name: "Pro",
      description: "For heavy content creators who process high volumes every month.",
      monthlyPrice: 2450,
      yearlyPrice: 23520,
      videosPerMonth: 80,
      clipLimit: 1600,
      maxProjects: 80,
      priority: 3,
      visibility: "public",
      status: "active",
      subscribers: 410,
      revenue: 1004500,
      features: [
        ...featuresFor("pro"),
        { id: "pro-priority", label: "Priority processing", included: true },
        { id: "pro-fmt", label: "All output formats", included: true },
      ],
      builtIn: true,
    },
    {
      id: "business",
      name: "Business",
      description: "For teams and agencies that need capacity, seats, and priority processing.",
      monthlyPrice: 4950,
      yearlyPrice: 47520,
      videosPerMonth: 300,
      clipLimit: 6000,
      maxProjects: 300,
      priority: 4,
      visibility: "public",
      status: "active",
      subscribers: 218,
      revenue: 1079100,
      features: featuresFor("business"),
      builtIn: true,
    },
  ];

  const users: AdminUser[] = [
    u("usr_1001", "John Smith", "john@email.com", "pro", "active", 18, 50, 240, 142, 1821, 12250, 4.2, "active", "monthly", 2450, iso(22), minutesAgo(40), "paid", iso(22), iso(-27), null, true),
    u("usr_1002", "Sarah Ahmed", "sarah.ahmed@email.com", "creator", "active", 18, 20, 214, 64, 890, 4750, 2.1, "active", "monthly", 950, iso(48), minutesAgo(8), "paid", iso(48), iso(-12), null, true),
    u("usr_1003", "Michael Brown", "michael.brown@studio.io", "business", "active", 210, 300, 3180, 410, 6204, 39600, 18.4, "active", "yearly", 47520, iso(120), minutesAgo(90), "paid", iso(120), iso(-18), null, true),
    u("usr_1004", "Layla Hassan", "layla@clips.studio", "creator", "active", 19, 20, 248, 41, 512, 2850, 1.4, "active", "monthly", 950, iso(14), minutesAgo(120), "paid", iso(14), iso(-16), null, true),
    u("usr_1005", "Omar Farouk", "omar.farouk@gmail.com", "free", "active", 1, 1, 8, 1, 8, 0, 0.2, "free", "monthly", 0, iso(3), minutesAgo(200), "none", iso(3), null, null, false),
    u("usr_1006", "Emma Wilson", "emma.wilson@agency.co", "pro", "active", 61, 80, 940, 210, 3102, 17150, 9.1, "active", "monthly", 2450, iso(70), minutesAgo(15), "paid", iso(70), iso(-8), null, true),
    u("usr_1007", "Youssef Nabil", "youssef@nabil.media", "creator", "active", 16, 20, 188, 38, 420, 950, 1.8, "past_due", "monthly", 950, iso(40), minutesAgo(400), "failed", iso(40), iso(2), null, true),
    u("usr_1008", "Nora Adel", "nora.adel@outlook.com", "pro", "suspended", 22, 80, 310, 55, 701, 4900, 3.2, "active", "monthly", 2450, iso(90), iso(6), "paid", iso(90), iso(-5), null, false),
    u("usr_1009", "Daniel Park", "daniel.park@wave.fm", "business", "active", 188, 300, 2400, 322, 5100, 29700, 14.6, "active", "monthly", 4950, iso(200), minutesAgo(55), "paid", iso(200), iso(-11), null, true),
    u("usr_1010", "Fatima Saleh", "fatima.saleh@email.com", "free", "pending", 0, 1, 0, 0, 0, 0, 0, "free", "monthly", 0, iso(0), minutesAgo(12), "none", iso(0), null, null, false),
    u("usr_1011", "James Carter", "james.carter@mail.com", "creator", "cancelled", 7, 20, 90, 22, 280, 1900, 0.8, "cancelled", "monthly", 950, iso(160), iso(20), "paid", iso(160), null, iso(4), false),
    u("usr_1012", "Mariam Youssef", "mariam.y@studio.eg", "pro", "active", 44, 80, 612, 98, 1402, 9800, 5.4, "active", "yearly", 23520, iso(88), minutesAgo(30), "paid", iso(88), iso(-40), null, true),
    u("usr_1013", "Alex Rivera", "alex.rivera@clips.io", "creator", "active", 12, 20, 156, 29, 340, 1900, 1.1, "active", "monthly", 950, iso(11), minutesAgo(70), "paid", iso(11), iso(-19), null, true),
    u("usr_1014", "Hana Elmasry", "hana.elmasry@gmail.com", "free", "blocked", 1, 1, 4, 1, 4, 0, 0.1, "free", "monthly", 0, iso(55), iso(12), "none", iso(55), null, null, false),
    u("usr_1015", "Robert Chen", "robert.chen@prod.co", "business", "active", 274, 300, 4100, 501, 7800, 44550, 22.0, "cancelling", "monthly", 4950, iso(310), minutesAgo(180), "paid", iso(310), iso(-3), iso(-3), false),
    u("usr_1016", "Dina Mostafa", "dina.mostafa@email.com", "creator", "active", 8, 20, 96, 18, 210, 950, 0.7, "active", "monthly", 950, iso(6), minutesAgo(25), "paid", iso(6), iso(-24), null, true),
    u("usr_1017", "Chris Taylor", "chris.taylor@show.tv", "pro", "active", 73, 80, 1104, 188, 2640, 14700, 8.8, "active", "monthly", 2450, iso(44), minutesAgo(5), "paid", iso(44), iso(-14), null, true),
    u("usr_1018", "Aya Kamal", "aya.kamal@clips.eg", "free", "active", 0, 1, 0, 0, 0, 0, 0, "free", "monthly", 0, iso(1), minutesAgo(360), "none", iso(1), null, null, false),
    u("usr_1019", "Benjamin Cole", "ben.cole@media.uk", "creator", "active", 15, 20, 180, 33, 402, 1900, 1.6, "active", "monthly", 950, iso(27), minutesAgo(240), "pending", iso(27), iso(-1), null, true),
    u("usr_1020", "Nour El-Din", "nour.eldin@agency.eg", "business", "active", 96, 300, 1288, 140, 2104, 14850, 7.2, "active", "monthly", 4950, iso(18), minutesAgo(50), "paid", iso(18), iso(-12), null, true),
    u("usr_1021", "Olivia Grant", "olivia.grant@mail.com", "pro", "active", 39, 80, 520, 77, 990, 7350, 4.0, "active", "monthly", 2450, iso(61), minutesAgo(110), "paid", iso(61), iso(-9), null, true),
    u("usr_1022", "Karim Fawzy", "karim.fawzy@email.com", "creator", "suspended", 20, 20, 260, 40, 480, 950, 1.9, "expired", "monthly", 950, iso(80), iso(3), "failed", iso(80), null, iso(1), false),
    u("usr_1023", "Sophia Martin", "sophia.martin@lab.io", "free", "active", 1, 1, 11, 1, 11, 0, 0.3, "free", "monthly", 0, iso(2), minutesAgo(80), "none", iso(2), null, null, false),
    u("usr_1024", "Tarek Hussein", "tarek.hussein@prod.eg", "pro", "active", 54, 80, 702, 121, 1688, 9800, 6.1, "active", "monthly", 2450, iso(33), minutesAgo(18), "paid", iso(33), iso(-21), null, true),
    u("usr_1025", "Isabella Rossi", "isabella.rossi@studio.it", "creator", "active", 6, 20, 72, 14, 168, 950, 0.6, "active", "yearly", 9120, iso(9), minutesAgo(300), "paid", iso(9), iso(-80), null, true),
    u("usr_1026", "Ahmed Magdy", "ahmed.magdy@clips.eg", "business", "active", 142, 300, 1980, 220, 3400, 19800, 11.5, "active", "monthly", 4950, iso(150), minutesAgo(22), "paid", iso(150), iso(-6), null, true),
    u("usr_1027", "Grace Lee", "grace.lee@wave.co", "free", "cancelled", 1, 1, 6, 1, 6, 0, 0.1, "cancelled", "monthly", 0, iso(210), iso(40), "none", iso(210), null, iso(30), false),
    u("usr_1028", "Hassan Ali", "hassan.ali@email.com", "creator", "active", 11, 20, 132, 24, 288, 950, 0.9, "active", "monthly", 950, iso(5), minutesAgo(2), "paid", iso(5), iso(-25), null, true),
    u("usr_1029", "Chloe Bennett", "chloe.bennett@mail.com", "pro", "pending", 0, 80, 0, 0, 0, 0, 0, "trialing", "monthly", 2450, iso(0), minutesAgo(20), "pending", iso(0), iso(-30), null, true),
    u("usr_1030", "Rania Sherif", "rania.sherif@studio.eg", "creator", "active", 17, 20, 204, 36, 430, 1900, 1.5, "active", "monthly", 950, iso(16), minutesAgo(65), "paid", iso(16), iso(-14), null, true),
    u("usr_1031", "Admin User", "admin@clipora.app", "business", "active", 0, 300, 0, 0, 0, 0, 0, "active", "yearly", 0, iso(400), minutesAgo(1), "none", iso(400), iso(-20), null, true),
    u("usr_1032", "Peter Walsh", "peter.walsh@show.fm", "pro", "active", 29, 80, 388, 60, 744, 4900, 3.3, "active", "monthly", 2450, iso(19), minutesAgo(140), "paid", iso(19), iso(-11), null, true),
  ];
  users[30].role = "admin";

  const payments: AdminPayment[] = [
    p("pay_10294", "TXN-10294", users[0], 2450, "Card", "paid", iso(2, 9), "paymob_txn_10294"),
    p("pay_10295", "TXN-10295", users[1], 950, "Card", "paid", minutesAgo(12), "paymob_txn_10295"),
    p("pay_10296", "TXN-10296", users[6], 950, "Card", "failed", minutesAgo(18), "paymob_txn_10296"),
    p("pay_10297", "TXN-10297", users[2], 47520, "Card", "paid", iso(8, 14), "paymob_txn_10297"),
    p("pay_10298", "TXN-10298", users[5], 2450, "Wallet", "paid", iso(4, 11), "paymob_txn_10298"),
    p("pay_10299", "TXN-10299", users[18], 950, "Card", "pending", minutesAgo(80), null),
    p("pay_10300", "TXN-10300", users[8], 4950, "Card", "paid", iso(1, 8), "paymob_txn_10300"),
    p("pay_10301", "TXN-10301", users[21], 950, "Card", "failed", iso(1, 16), "paymob_txn_10301"),
    p("pay_10302", "TXN-10302", users[11], 23520, "Card", "paid", iso(12, 10), "paymob_txn_10302"),
    p("pay_10303", "TXN-10303", users[14], 4950, "Card", "paid", iso(3, 13), "paymob_txn_10303"),
    p("pay_10304", "TXN-10304", users[16], 2450, "Card", "paid", iso(5, 9), "paymob_txn_10304"),
    p("pay_10305", "TXN-10305", users[3], 950, "Wallet", "paid", iso(6, 18), "paymob_txn_10305"),
    p("pay_10306", "TXN-10306", users[10], 950, "Card", "refunded", iso(10, 12), "paymob_txn_10306"),
    p("pay_10307", "TXN-10307", users[19], 4950, "Card", "paid", iso(7, 7), "paymob_txn_10307"),
    p("pay_10308", "TXN-10308", users[20], 2450, "Card", "paid", iso(9, 15), "paymob_txn_10308"),
    p("pay_10309", "TXN-10309", users[23], 2450, "Card", "paid", iso(0, 8), "paymob_txn_10309"),
    p("pay_10310", "TXN-10310", users[25], 4950, "Card", "paid", iso(2, 19), "paymob_txn_10310"),
    p("pay_10311", "TXN-10311", users[7], 2450, "Card", "cancelled", iso(15, 11), "paymob_txn_10311"),
    p("pay_10312", "TXN-10312", users[12], 950, "Card", "paid", iso(13, 16), "paymob_txn_10312"),
    p("pay_10313", "TXN-10313", users[15], 950, "Wallet", "paid", iso(1, 20), "paymob_txn_10313"),
    p("pay_10314", "TXN-10314", users[27], 950, "Card", "paid", minutesAgo(200), "paymob_txn_10314"),
    p("pay_10315", "TXN-10315", users[29], 950, "Card", "failed", iso(0, 7), "paymob_txn_10315"),
    p("pay_10316", "TXN-10316", users[31], 2450, "Card", "paid", iso(11, 9), "paymob_txn_10316"),
    p("pay_10317", "TXN-10317", users[4], 0, "Card", "cancelled", iso(3, 12), null),
    p("pay_10318", "TXN-10318", users[24], 9120, "Card", "paid", iso(9, 8), "paymob_txn_10318"),
  ];

  const subscriptions: AdminSubscription[] = users
    .filter((user) => user.planId !== "free" || user.subscriptionStatus !== "free")
    .map((user, i) => ({
      id: `sub_${1100 + i}`,
      userId: user.id,
      userName: user.name,
      email: user.email,
      planId: user.planId,
      planName: planName(user.planId),
      status: user.subscriptionStatus === "free" ? "expired" : user.subscriptionStatus,
      price: user.price,
      currency: "EGP" as const,
      billingCycle: user.billingInterval,
      startDate: user.startedAt ?? user.joinedAt,
      nextBillingDate: user.renewsAt,
      endDate: user.endsAt,
      autoRenewal: user.autoRenewal,
      paymentFailed: user.paymentStatus === "failed" || user.subscriptionStatus === "past_due",
    }));

  const projects: AdminProject[] = [
    proj("prj_2001", "Podcast Episode 14", users[0], "How I Built a Media Brand", 2840, 30, "9:16", 18, "completed", iso(1), iso(1)),
    proj("prj_2002", "Morning briefing recap", users[1], "Daily Creator Notes", 1620, 45, "9:16", 18, "completed", minutesAgo(80), minutesAgo(40)),
    proj("prj_2003", "Product launch cutdowns", users[2], "Autumn Collection Film", 4200, 30, "9:16", 42, "processing", minutesAgo(20), null),
    proj("prj_2004", "Interview highlights", users[5], "Founder Stories 08", 2100, 60, "16:9", 12, "completed", iso(2), iso(2)),
    proj("prj_2005", "Tutorial series split", users[16], "Editing Masterclass", 3600, 30, "9:16", 28, "failed", iso(0), null),
    proj("prj_2006", "Reel pack — travel", users[8], "Cairo After Dark", 1980, 20, "9:16", 22, "completed", iso(3), iso(3)),
    proj("prj_2007", "Webinar chapters", users[14], "Agency Ops Live", 5400, 90, "16:9", 16, "queued", minutesAgo(8), null),
    proj("prj_2008", "Shorts from livestream", users[19], "Studio Q&A", 7800, 30, "9:16", 40, "processing", minutesAgo(35), null),
    proj("prj_2009", "Episode teasers", users[11], "Late Night Talk 22", 2460, 15, "9:16", 24, "completed", iso(4), iso(4)),
    proj("prj_2010", "Campaign cutdowns", users[25], "Ramadan Campaign", 3120, 30, "1:1", 20, "completed", iso(5), iso(5)),
    proj("prj_2011", "Clip test — new format", users[3], "Voiceover Demo", 540, 30, "9:16", 6, "cancelled", iso(6), null),
    proj("prj_2012", "Keynote slices", users[20], "Summit Keynote", 3900, 45, "16:9", 18, "completed", iso(7), iso(7)),
    proj("prj_2013", "Podcast Episode 15", users[0], "Guest Interview — Growth", 3010, 30, "9:16", 20, "completed", iso(8), iso(8)),
    proj("prj_2014", "Storytime clips", users[12], "Weekend Recap", 980, 20, "9:16", 8, "completed", iso(2), iso(2)),
    proj("prj_2015", "Course module 3", users[23], "Lighting Basics", 2200, 60, "16:9", 10, "failed", iso(1), null),
    proj("prj_2016", "Brand film shorts", users[9], "Studio Intro", 420, 15, "9:16", 4, "queued", minutesAgo(12), null),
  ];

  const planBreakdown = plans.map((plan) => ({
    planId: plan.id,
    name: plan.name,
    users: plan.subscribers,
    percent: Math.round((plan.subscribers / 12482) * 1000) / 10,
    revenue: plan.revenue,
  }));

  return {
    metrics: {
      periodLabel: "September 2026",
      totalUsers: 12482,
      totalUsersChange: 8.4,
      activeUsers: 4821,
      activeUsersChange: 5.1,
      payingCustomers: 1248,
      payingCustomersChange: 3.6,
      monthlyRevenue: 2672600,
      monthlyRevenueChange: 11.2,
      videosProcessed: 18421,
      videosProcessedChange: 9.8,
      clipsCreated: 284392,
      clipsCreatedChange: 14.3,
      successfulPayments: 1184,
      pendingPayments: 22,
      failedPayments: 41,
      refundedPayments: 18,
      totalPaymentCount: 1265,
    },
    revenueSeries: {
      "7d": series(7, 82000, 118000, true),
      "30d": series(30, 62000, 98000, true),
      "90d": series(12, 480000, 890000, false),
      "12m": [
        { label: "Oct", value: 1482000 },
        { label: "Nov", value: 1614000 },
        { label: "Dec", value: 1890000 },
        { label: "Jan", value: 1765000 },
        { label: "Feb", value: 1922000 },
        { label: "Mar", value: 2104000 },
        { label: "Apr", value: 2218000 },
        { label: "May", value: 2340000 },
        { label: "Jun", value: 2288000 },
        { label: "Jul", value: 2461000 },
        { label: "Aug", value: 2404000 },
        { label: "Sep", value: 2672600 },
      ],
    },
    growthSeries: {
      daily: growth(14, true),
      weekly: growth(12, false),
      monthly: [
        { label: "Apr", newUsers: 740, activeUsers: 3120, payingUsers: 980 },
        { label: "May", newUsers: 810, activeUsers: 3380, payingUsers: 1040 },
        { label: "Jun", newUsers: 690, activeUsers: 3510, payingUsers: 1088 },
        { label: "Jul", newUsers: 920, activeUsers: 3890, payingUsers: 1142 },
        { label: "Aug", newUsers: 1010, activeUsers: 4210, payingUsers: 1194 },
        { label: "Sep", newUsers: 860, activeUsers: 4821, payingUsers: 1248 },
      ],
    },
    planBreakdown,
    users,
    plans,
    payments,
    subscriptions,
    projects,
    activity: [
      { id: "act_1", event: "Plan upgraded", description: "John upgraded to Pro", userId: "usr_1001", userName: "John Smith", time: minutesAgo(2), source: "billing", status: "success", href: "/admin/users/usr_1001" },
      { id: "act_2", event: "Clips created", description: "Sarah created 18 clips", userId: "usr_1002", userName: "Sarah Ahmed", time: minutesAgo(5), source: "processing", status: "success", href: "/admin/projects/prj_2002" },
      { id: "act_3", event: "User registered", description: "New user registered", userId: "usr_1010", userName: "Fatima Saleh", time: minutesAgo(8), source: "user", status: "info", href: "/admin/users/usr_1010" },
      { id: "act_4", event: "Payment received", description: "Payment received", userId: "usr_1002", userName: "Sarah Ahmed", time: minutesAgo(12), source: "billing", status: "success", href: "/admin/payments/pay_10295" },
      { id: "act_5", event: "Payment failed", description: "Payment failed", userId: "usr_1007", userName: "Youssef Nabil", time: minutesAgo(18), source: "billing", status: "error", href: "/admin/payments/pay_10296" },
      { id: "act_6", event: "Project completed", description: "Podcast Episode 14 finished processing", userId: "usr_1001", userName: "John Smith", time: minutesAgo(40), source: "processing", status: "success", href: "/admin/projects/prj_2001" },
      { id: "act_7", event: "Account suspended", description: "Nora Adel was suspended", userId: "usr_1008", userName: "Nora Adel", time: iso(6, 15), source: "admin", status: "warning", href: "/admin/users/usr_1008" },
      { id: "act_8", event: "Subscription cancelling", description: "Robert Chen turned off auto-renewal", userId: "usr_1015", userName: "Robert Chen", time: iso(1, 11), source: "user", status: "warning", href: "/admin/users/usr_1015" },
      { id: "act_9", event: "Processing error", description: "Tutorial series split failed", userId: "usr_1017", userName: "Chris Taylor", time: iso(0, 8), source: "processing", status: "error", href: "/admin/projects/prj_2005" },
      { id: "act_10", event: "Plan pricing changed", description: "Admin changed Creator plan price", userId: "usr_1031", userName: "Admin User", time: iso(0, 12), source: "admin", status: "info", href: "/admin/plans" },
    ],
    audit: [
      { id: "aud_1", action: "Admin changed Creator plan price", adminName: "John", time: iso(0, 12), before: "EGP 500", after: "EGP 650", target: "Creator plan" },
      { id: "aud_2", action: "Admin suspended an account", adminName: "John", time: iso(6, 15), before: "Active", after: "Suspended", target: "Nora Adel" },
      { id: "aud_3", action: "Admin updated support email", adminName: "John", time: iso(12, 9), before: "hello@clipora.app", after: "support@clipora.app", target: "Platform settings" },
      { id: "aud_4", action: "Admin extended a subscription", adminName: "John", time: iso(3, 16), before: "Sep 12, 2026", after: "Oct 12, 2026", target: "Layla Hassan" },
    ],
    notifications: [
      { id: "nt_1", title: "Payment failed", body: "Youssef Nabil’s Creator renewal could not be completed.", category: "payments", time: minutesAgo(18), read: false, href: "/admin/payments/pay_10296" },
      { id: "nt_2", title: "New subscription", body: "Chloe Bennett started a Pro trial.", category: "users", time: minutesAgo(20), read: false, href: "/admin/users/usr_1029" },
      { id: "nt_3", title: "System warning", body: "Video processing errors increased in the last hour.", category: "system", time: minutesAgo(35), read: false, href: "/admin/status" },
      { id: "nt_4", title: "User issue", body: "12 users have used more than 90% of their monthly allowance.", category: "users", time: minutesAgo(50), read: false, href: "/admin/users" },
      { id: "nt_5", title: "Payment failure spike detected", body: "Failed payments are above the usual daily range.", category: "payments", time: iso(0, 8), read: true, href: "/admin/payments" },
      { id: "nt_6", title: "Subscription expiring", body: "5 subscriptions expire this week.", category: "users", time: iso(0, 7), read: true, href: "/admin/subscriptions" },
      { id: "nt_7", title: "New plan created", body: "Business plan visibility was last reviewed.", category: "system", time: iso(2, 10), read: true, href: "/admin/plans" },
      { id: "nt_8", title: "Sign-in from a new device", body: "A new admin session was opened from Cairo.", category: "security", time: iso(1, 19), read: true, href: "/admin/profile" },
    ],
    alerts: [
      { id: "al_1", severity: "critical", title: "12 payments failed today", description: "Card and wallet renewals need attention.", time: minutesAgo(18), actionLabel: "View Failed Payments", href: "/admin/payments?status=failed" },
      { id: "al_2", severity: "warning", title: "23 users reached their monthly limit", description: "These accounts cannot process more videos until their cycle resets.", time: minutesAgo(50), actionLabel: "View Users", href: "/admin/users?usage=limit" },
      { id: "al_3", severity: "critical", title: "3 processing errors detected", description: "A small number of projects could not be completed.", time: minutesAgo(35), actionLabel: "View Projects", href: "/admin/projects?status=failed" },
      { id: "al_4", severity: "warning", title: "5 subscriptions expire this week", description: "Upcoming renewals that may convert to churn.", time: iso(0, 7), actionLabel: "View Expiring", href: "/admin/subscriptions?filter=expiring" },
    ],
    services: [
      { id: "auth", name: "Authentication", status: "operational", detail: "Sign-in and session refresh are healthy." },
      { id: "processing", name: "Video processing", status: "degraded", detail: "A small number of jobs are retrying after errors." },
      { id: "payments", name: "Payments", status: "operational", detail: "Paymob confirmations are completing normally." },
      { id: "database", name: "Database", status: "operational", detail: "Read and write latency is within range." },
      { id: "storage", name: "Storage", status: "operational", detail: "Clip storage and downloads are available." },
      { id: "external", name: "External services", status: "operational", detail: "YouTube lookup and Paymob are reachable." },
    ],
    settings: {
      websiteName: "Clipora",
      supportEmail: "support@clipora.app",
      defaultCurrency: "EGP",
      defaultClipLength: 30,
      defaultOutputFormat: "9:16",
      maintenanceMode: false,
      registrationEnabled: true,
      maxUploadGb: 2,
      maxProcessingMinutes: 240,
    },
    analytics: {
      users: {
        total: 12482,
        newRegistrations: 860,
        active: 4821,
        returning: 3014,
        growth: 8.4,
      },
      revenue: {
        total: 2672600,
        recurring: 2518800,
        arpu: 2141,
        successRate: 93.6,
        thisMonth: 2672600,
        lastMonth: 2404000,
        growth: 11.2,
        refunds: 18400,
        failedPayments: 41,
      },
      subscriptions: {
        active: 1248,
        created: 96,
        cancellations: 28,
        expired: 41,
        upgrades: 19,
        downgrades: 7,
      },
      product: {
        videosProcessed: 18421,
        clipsCreated: 284392,
        avgClipsPerUser: 22.8,
        processingVolume: 18421,
      },
      planPerformance: planBreakdown.filter((row) => row.planId !== "free"),
      funnel: [
        { id: "visitors", label: "Visitors", value: 84200 },
        { id: "registered", label: "Registered users", value: 12482 },
        { id: "first_project", label: "Created first project", value: 7210 },
        { id: "completed", label: "Completed first project", value: 5840 },
        { id: "paid", label: "Paid users", value: 1248 },
        { id: "renewing", label: "Renewing users", value: 1011 },
      ],
      retention: [
        { label: "Apr", newUsers: 740, returningUsers: 2380, activeUsers: 3120, churnedUsers: 90 },
        { label: "May", newUsers: 810, returningUsers: 2570, activeUsers: 3380, churnedUsers: 84 },
        { label: "Jun", newUsers: 690, returningUsers: 2820, activeUsers: 3510, churnedUsers: 102 },
        { label: "Jul", newUsers: 920, returningUsers: 2970, activeUsers: 3890, churnedUsers: 76 },
        { label: "Aug", newUsers: 1010, returningUsers: 3200, activeUsers: 4210, churnedUsers: 88 },
        { label: "Sep", newUsers: 860, returningUsers: 3961, activeUsers: 4821, churnedUsers: 64 },
      ],
    },
    usageHistory: [
      { label: "Apr", videos: 11, clips: 140 },
      { label: "May", videos: 14, clips: 188 },
      { label: "Jun", videos: 16, clips: 210 },
      { label: "Jul", videos: 15, clips: 196 },
      { label: "Aug", videos: 19, clips: 248 },
      { label: "Sep", videos: 18, clips: 240 },
    ],
  };
}

function u(
  id: string,
  name: string,
  email: string,
  planId: string,
  status: AdminUser["status"],
  videosUsed: number,
  videosLimit: number,
  clipsCreated: number,
  totalVideos: number,
  totalClips: number,
  totalPayments: number,
  storageGb: number,
  subscriptionStatus: AdminUser["subscriptionStatus"],
  billingInterval: AdminUser["billingInterval"],
  price: number,
  joinedAt: string,
  lastActiveAt: string,
  paymentStatus: AdminUser["paymentStatus"],
  startedAt: string | null,
  renewsAt: string | null,
  endsAt: string | null,
  autoRenewal: boolean,
): AdminUser {
  return {
    id,
    name,
    email,
    role: "user",
    planId,
    status,
    videosUsed,
    videosLimit,
    clipsCreated,
    totalVideos,
    totalClips,
    totalPayments,
    storageGb,
    subscriptionStatus,
    billingInterval,
    price,
    currency: "EGP",
    renewsAt,
    startedAt,
    endsAt,
    autoRenewal,
    joinedAt,
    lastActiveAt,
    paymentStatus,
    paymentMethod: planId === "free" ? null : "Card",
  };
}

function p(
  id: string,
  transactionId: string,
  user: AdminUser,
  amount: number,
  method: string,
  status: AdminPayment["status"],
  date: string,
  paymentReference: string | null,
): AdminPayment {
  return {
    id,
    transactionId,
    userId: user.id,
    userName: user.name,
    email: user.email,
    planId: user.planId,
    planName: planName(user.planId),
    amount,
    currency: "EGP",
    method,
    status,
    date,
    completedAt: status === "paid" || status === "refunded" ? date : null,
    provider: "Paymob",
    paymentReference,
    invoiceId: `INV-${transactionId.replace("TXN-", "")}`,
  };
}

function proj(
  id: string,
  name: string,
  user: AdminUser,
  sourceVideo: string,
  durationSeconds: number,
  clipSeconds: number,
  format: string,
  clips: number,
  status: AdminProject["status"],
  createdAt: string,
  completedAt: string | null,
): AdminProject {
  const thumb = THUMBS[Number(id.slice(-1)) % THUMBS.length];
  return {
    id,
    name,
    userId: user.id,
    userName: user.name,
    sourceVideo,
    thumbnailUrl: thumb,
    durationSeconds,
    clipSeconds,
    format,
    clips,
    status,
    createdAt,
    completedAt,
    clipThumbnails: Array.from({ length: Math.min(clips, 6) }, (_, i) => THUMBS[i % THUMBS.length]),
  };
}

function series(count: number, min: number, max: number, daily: boolean) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / count;
    const wave = Math.sin(i * 0.7) * 0.08;
    const value = Math.round(min + (max - min) * t + max * wave);
    if (daily) {
      const d = new Date(NOW);
      d.setUTCDate(d.getUTCDate() - (count - 1 - i));
      return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), value };
    }
    return { label: `W${i + 1}`, value };
  });
}

function growth(count: number, daily: boolean) {
  return Array.from({ length: count }, (_, i) => {
    const label = daily
      ? (() => {
          const d = new Date(NOW);
          d.setUTCDate(d.getUTCDate() - (count - 1 - i));
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
        })()
      : `W${i + 1}`;
    return {
      label,
      newUsers: 40 + ((i * 13) % 36),
      activeUsers: 3600 + i * 70 + ((i * 17) % 90),
      payingUsers: 1100 + i * 8,
    };
  });
}

export function describeYearlySavings(monthly: number, yearly: number) {
  const percent = yearlyDiscountPercent(monthly, yearly);
  return percent > 0 ? `Customer saves ${percent}% annually` : "No yearly discount";
}
